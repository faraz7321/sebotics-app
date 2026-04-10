import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import * as jwt from 'jsonwebtoken';
import {
  RawData,
  WebSocket,
  WebSocketServer,
} from 'ws';
import type { JwtPayload, JwtUser } from '../../auth/auth.types';
import { AutoxingAuthService } from '../auth/autoxing-auth.service';
import { AutoxingRobotService } from '../services/autoxing-robot.service';

type ClientCommand = {
  action?: string;
  robotId?: string;
};

type SubscriptionKind = 'robot.state' | 'task.state';

type UpstreamSubscription = {
  kind: SubscriptionKind;
  robotId: string;
  socket: WebSocket;
  heartbeatTimer?: ReturnType<typeof setInterval>;
};

type ClientState = {
  connectionId: string;
  user: JwtUser;
  subscriptions: Map<string, UpstreamSubscription>;
};

@Injectable()
export class AutoxingWsBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoxingWsBridgeService.name);
  private readonly clientStates = new Map<WebSocket, ClientState>();
  private wsServer?: WebSocketServer;
  private readonly wsPath = '/ws/autoxing';
  private readonly autoxingWsBaseUrl: string;
  private readonly refreshTokenSecret: string;
  private readonly jwtSecret: string;
  private readonly corsOrigin: string;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    private readonly autoxingAuthService: AutoxingAuthService,
    private readonly autoxingRobotService: AutoxingRobotService,
  ) {
    this.autoxingWsBaseUrl = (
      this.configService.get<string>('AUTOXING_WS_BASE_URL') ??
      'wss://serviceglobal.autoxing.com'
    ).replace(/\/$/, '');
    this.refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? '';
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    this.corsOrigin = this.configService.get<string>('CORS_ORIGIN') ?? '';
  }

  onModuleInit(): void {
    const httpServer =
      this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;
    this.wsServer = new WebSocketServer({ noServer: true });
    httpServer.on('upgrade', this.handleUpgrade);
    this.wsServer.on('connection', this.handleConnection);
    this.logger.log(
      JSON.stringify({
        event: 'autoxing.ws.ready',
        path: this.wsPath,
        upstreamBaseUrl: this.autoxingWsBaseUrl,
      }),
    );
  }

  onModuleDestroy(): void {
    const httpServer =
      this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;
    httpServer.off('upgrade', this.handleUpgrade);

    for (const [client, state] of this.clientStates.entries()) {
      for (const subscription of state.subscriptions.values()) {
        if (subscription.heartbeatTimer) {
          clearInterval(subscription.heartbeatTimer);
        }
        subscription.socket.close(1000, 'server_shutdown');
      }
      client.close(1012, 'server_shutdown');
    }
    this.clientStates.clear();
    this.wsServer?.close();
  }

  private readonly handleUpgrade = (
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname !== this.wsPath) {
      return;
    }

    if (!this.isOriginAllowed(request.headers.origin)) {
      socket.destroy();
      return;
    }

    const user = this.authenticate(request);
    if (!user) {
      socket.destroy();
      return;
    }

    this.wsServer?.handleUpgrade(request, socket, head, (client) => {
      (request as IncomingMessage & { user?: JwtUser }).user = user;
      this.wsServer?.emit('connection', client, request);
    });
  };

  private readonly handleConnection = (
    client: WebSocket,
    request: IncomingMessage,
  ) => {
    const user = (request as IncomingMessage & { user?: JwtUser }).user;
    if (!user) {
      client.close(1008, 'unauthorized');
      return;
    }

    const state: ClientState = {
      connectionId: randomUUID(),
      user,
      subscriptions: new Map<string, UpstreamSubscription>(),
    };

    this.clientStates.set(client, state);
    this.sendToClient(client, {
      event: 'connection.ready',
      connectionId: state.connectionId,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
      },
    });

    client.on('message', (raw) => {
      void this.onClientMessage(client, raw);
    });

    client.on('close', () => {
      this.closeClient(client, 'client_disconnected');
    });

    client.on('error', (error) => {
      this.logger.warn(
        JSON.stringify({
          event: 'autoxing.ws.client.error',
          connectionId: state.connectionId,
          message: error.message,
        }),
      );
    });
  };

  private async onClientMessage(client: WebSocket, raw: RawData): Promise<void> {
    const state = this.clientStates.get(client);
    if (!state) {
      return;
    }

    const command = this.parseClientCommand(raw);
    if (!command?.action) {
      this.sendToClient(client, {
        event: 'command.rejected',
        reason: 'Invalid JSON payload or missing action',
      });
      return;
    }

    if (command.action === 'ping') {
      this.sendToClient(client, {
        event: 'pong',
        timestamp: Date.now(),
      });
      return;
    }

    if (command.action === 'subscribe.robot.state') {
      await this.subscribeOversee(client, state, {
        robotId: command.robotId,
        kind: 'robot.state',
        upstreamPathPrefix: 'robot-control/oversee',
        eventName: 'robot.state',
      });
      return;
    }

    if (command.action === 'unsubscribe.robot.state') {
      this.unsubscribeOversee(client, state, command.robotId, 'robot.state');
      return;
    }

    if (command.action === 'subscribe.task.state') {
      await this.subscribeOversee(client, state, {
        robotId: command.robotId,
        kind: 'task.state',
        upstreamPathPrefix: 'task-control/oversee/robot',
        eventName: 'task.state',
      });
      return;
    }

    if (command.action === 'unsubscribe.task.state') {
      this.unsubscribeOversee(client, state, command.robotId, 'task.state');
      return;
    }

    this.sendToClient(client, {
      event: 'command.rejected',
      action: command.action,
      reason: 'Unsupported action',
    });
  }

  private async subscribeOversee(
    client: WebSocket,
    state: ClientState,
    params: {
      robotId: string | undefined;
      kind: SubscriptionKind;
      upstreamPathPrefix: string;
      eventName: 'robot.state' | 'task.state';
    },
  ): Promise<void> {
    const { robotId, kind, upstreamPathPrefix, eventName } = params;
    const normalizedRobotId = robotId?.trim();
    if (!normalizedRobotId) {
      this.sendToClient(client, {
        event: 'subscribe.rejected',
        stream: kind,
        reason: 'robotId is required',
      });
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(kind, normalizedRobotId);
    if (state.subscriptions.has(subscriptionKey)) {
      this.sendToClient(client, {
        event: 'subscribe.ignored',
        stream: kind,
        robotId: normalizedRobotId,
        reason: 'Already subscribed',
      });
      return;
    }

    try {
      await this.autoxingRobotService.assertRobotAccess(normalizedRobotId, state.user);
      const accessToken = await this.autoxingAuthService.getAccessToken();
      const upstreamUrl =
        `${this.autoxingWsBaseUrl}/${upstreamPathPrefix}/${encodeURIComponent(normalizedRobotId)}`;

      // Autoxing expects token key as websocket subprotocol during handshake.
      const upstream = new WebSocket(upstreamUrl, accessToken.key);

      state.subscriptions.set(subscriptionKey, {
        kind,
        robotId: normalizedRobotId,
        socket: upstream,
      });

      this.sendToClient(client, {
        event: 'subscribe.requested',
        stream: kind,
        robotId: normalizedRobotId,
      });

      upstream.on('open', () => {
        const heartbeatTimer = setInterval(() => {
          if (upstream.readyState !== WebSocket.OPEN) {
            return;
          }

          upstream.send(JSON.stringify({ reqType: 'onHeartBeat' }));
        }, 5_000);

        const subscription = state.subscriptions.get(subscriptionKey);
        if (subscription && subscription.socket === upstream) {
          subscription.heartbeatTimer = heartbeatTimer;
        }

        this.sendToClient(client, {
          event: 'subscribe.ready',
          stream: kind,
          robotId: normalizedRobotId,
        });
      });

      upstream.on('message', (payload) => {
        const decodedPayload = this.decodeUpstreamPayload(payload);
        if (this.isHeartbeatPayload(decodedPayload)) {
          return;
        }

        this.sendToClient(client, {
          event: eventName,
          stream: kind,
          robotId: normalizedRobotId,
          payload: decodedPayload,
          receivedAt: Date.now(),
        });
      });

      upstream.on('close', (code, reason) => {
        const subscription = state.subscriptions.get(subscriptionKey);
        if (subscription && subscription.socket === upstream) {
          if (subscription.heartbeatTimer) {
            clearInterval(subscription.heartbeatTimer);
          }
          state.subscriptions.delete(subscriptionKey);
        }

        this.sendToClient(client, {
          event: 'subscribe.closed',
          stream: kind,
          robotId: normalizedRobotId,
          code,
          reason: reason.toString('utf8'),
        });
      });

      upstream.on('error', (error) => {
        this.logger.warn(
          JSON.stringify({
            event: 'autoxing.ws.upstream.error',
            connectionId: state.connectionId,
            stream: kind,
            robotId: normalizedRobotId,
            message: error.message,
          }),
        );
        this.sendToClient(client, {
          event: 'subscribe.error',
          stream: kind,
          robotId: normalizedRobotId,
          message: error.message,
        });
      });
    } catch (error) {
      this.sendToClient(client, {
        event: 'subscribe.rejected',
        stream: kind,
        robotId: normalizedRobotId,
        reason: error instanceof Error ? error.message : 'Subscription failed',
      });
    }
  }

  private unsubscribeOversee(
    client: WebSocket,
    state: ClientState,
    robotId: string | undefined,
    kind: SubscriptionKind,
  ): void {
    const normalizedRobotId = robotId?.trim();
    if (!normalizedRobotId) {
      this.sendToClient(client, {
        event: 'unsubscribe.rejected',
        stream: kind,
        reason: 'robotId is required',
      });
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(kind, normalizedRobotId);
    const subscription = state.subscriptions.get(subscriptionKey);
    if (!subscription) {
      this.sendToClient(client, {
        event: 'unsubscribe.ignored',
        stream: kind,
        robotId: normalizedRobotId,
        reason: 'No active subscription',
      });
      return;
    }

    state.subscriptions.delete(subscriptionKey);
    if (subscription.heartbeatTimer) {
      clearInterval(subscription.heartbeatTimer);
    }
    subscription.socket.close(1000, 'client_unsubscribe');

    this.sendToClient(client, {
      event: 'unsubscribe.done',
      stream: kind,
      robotId: normalizedRobotId,
    });
  }

  private closeClient(client: WebSocket, reason: string): void {
    const state = this.clientStates.get(client);
    if (!state) {
      return;
    }

    for (const subscription of state.subscriptions.values()) {
      if (subscription.heartbeatTimer) {
        clearInterval(subscription.heartbeatTimer);
      }
      subscription.socket.close(1000, reason);
    }

    state.subscriptions.clear();
    this.clientStates.delete(client);
  }

  private parseClientCommand(raw: RawData): ClientCommand | null {
    const text = this.toTextPayload(raw);
    if (!text) {
      return null;
    }

    try {
      const payload = JSON.parse(text) as ClientCommand;
      if (!payload || typeof payload !== 'object') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private decodeUpstreamPayload(raw: RawData): unknown {
    const text = this.toTextPayload(raw);
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private toTextPayload(raw: RawData): string {
    if (typeof raw === 'string') {
      return raw;
    }

    if (raw instanceof Buffer) {
      return raw.toString('utf8');
    }

    if (raw instanceof ArrayBuffer) {
      return Buffer.from(raw).toString('utf8');
    }

    if (Array.isArray(raw)) {
      return Buffer.concat(raw).toString('utf8');
    }

    return '';
  }

  private sendToClient(client: WebSocket, payload: Record<string, unknown>): void {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    client.send(JSON.stringify(payload));
  }

  private getSubscriptionKey(kind: SubscriptionKind, robotId: string): string {
    return `${kind}:${robotId}`;
  }

  private isHeartbeatPayload(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return false;
    }

    return (payload as { reqType?: string }).reqType === 'onHeartBeat';
  }

  private authenticate(request: IncomingMessage): JwtUser | null {
    // Try cookie-based refresh token first (same-origin / nginx proxy flow)
    const refreshToken = this.extractRefreshTokenCookie(request);
    if (refreshToken && this.refreshTokenSecret) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          this.refreshTokenSecret,
        ) as JwtPayload;
        if (this.isJwtPayload(decoded)) {
          return { userId: decoded.sub, username: decoded.username, role: decoded.role };
        }
      } catch {
        // fall through to access token check
      }
    }

    // Fall back to ?token=<accessToken> query param (cross-origin direct WS)
    if (this.jwtSecret) {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) {
        try {
          const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
          if (this.isJwtPayload(decoded)) {
            return { userId: decoded.sub, username: decoded.username, role: decoded.role };
          }
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  private extractRefreshTokenCookie(request: IncomingMessage): string | null {
    const header = request.headers.cookie;
    const cookieHeader = typeof header === 'string' ? header : '';

    if (!cookieHeader) {
      return null;
    }

    const parts = cookieHeader.split(';').map((item: string) => item.trim());
    for (const part of parts) {
      if (!part) {
        continue;
      }
      const [key, ...rest] = part.split('=');
      if (key === 'refreshToken') {
        return decodeURIComponent(rest.join('='));
      }
    }

    return null;
  }

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const maybePayload = payload as Partial<JwtPayload>;
    return (
      typeof maybePayload.sub === 'string' &&
      typeof maybePayload.username === 'string' &&
      (maybePayload.role === Role.ADMIN || maybePayload.role === Role.CLIENT)
    );
  }

  private isOriginAllowed(origin: string | undefined): boolean {
    if (!origin || !this.corsOrigin) {
      return true;
    }
    return origin === this.corsOrigin;
  }
}
