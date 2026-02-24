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

type UpstreamSubscription = {
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
      socket.destroy();
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

    if (command.action === 'subscribe.robot.oversee') {
      await this.subscribeRobotOversee(client, state, command.robotId);
      return;
    }

    if (command.action === 'unsubscribe.robot.oversee') {
      this.unsubscribeRobotOversee(client, state, command.robotId);
      return;
    }

    this.sendToClient(client, {
      event: 'command.rejected',
      action: command.action,
      reason: 'Unsupported action',
    });
  }

  private async subscribeRobotOversee(
    client: WebSocket,
    state: ClientState,
    robotId: string | undefined,
  ): Promise<void> {
    const normalizedRobotId = robotId?.trim();
    if (!normalizedRobotId) {
      this.sendToClient(client, {
        event: 'subscribe.rejected',
        reason: 'robotId is required',
      });
      return;
    }

    if (state.subscriptions.has(normalizedRobotId)) {
      this.sendToClient(client, {
        event: 'subscribe.ignored',
        robotId: normalizedRobotId,
        reason: 'Already subscribed',
      });
      return;
    }

    try {
      await this.autoxingRobotService.assertRobotAccess(normalizedRobotId, state.user);
      const accessToken = await this.autoxingAuthService.getAccessToken();
      const upstreamUrl =
        `${this.autoxingWsBaseUrl}/robot-control/oversee/${encodeURIComponent(normalizedRobotId)}`;

      // Autoxing expects token key as websocket subprotocol during handshake.
      const upstream = new WebSocket(upstreamUrl, accessToken.key);

      state.subscriptions.set(normalizedRobotId, { socket: upstream });

      this.sendToClient(client, {
        event: 'subscribe.requested',
        robotId: normalizedRobotId,
      });

      upstream.on('open', () => {
        const heartbeatTimer = setInterval(() => {
          if (upstream.readyState !== WebSocket.OPEN) {
            return;
          }

          upstream.send(JSON.stringify({ reqType: 'onHeartBeat' }));
        }, 5_000);

        const subscription = state.subscriptions.get(normalizedRobotId);
        if (subscription && subscription.socket === upstream) {
          subscription.heartbeatTimer = heartbeatTimer;
        }

        this.sendToClient(client, {
          event: 'subscribe.ready',
          robotId: normalizedRobotId,
        });
      });

      upstream.on('message', (payload) => {
        const decodedPayload = this.decodeUpstreamPayload(payload);
        if (this.isHeartbeatPayload(decodedPayload)) {
          return;
        }

        this.sendToClient(client, {
          event: 'robot.oversee',
          robotId: normalizedRobotId,
          payload: decodedPayload,
          receivedAt: Date.now(),
        });
      });

      upstream.on('close', (code, reason) => {
        const subscription = state.subscriptions.get(normalizedRobotId);
        if (subscription && subscription.socket === upstream) {
          if (subscription.heartbeatTimer) {
            clearInterval(subscription.heartbeatTimer);
          }
          state.subscriptions.delete(normalizedRobotId);
        }

        this.sendToClient(client, {
          event: 'subscribe.closed',
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
            robotId: normalizedRobotId,
            message: error.message,
          }),
        );
        this.sendToClient(client, {
          event: 'subscribe.error',
          robotId: normalizedRobotId,
          message: error.message,
        });
      });
    } catch (error) {
      this.sendToClient(client, {
        event: 'subscribe.rejected',
        robotId: normalizedRobotId,
        reason: error instanceof Error ? error.message : 'Subscription failed',
      });
    }
  }

  private unsubscribeRobotOversee(
    client: WebSocket,
    state: ClientState,
    robotId: string | undefined,
  ): void {
    const normalizedRobotId = robotId?.trim();
    if (!normalizedRobotId) {
      this.sendToClient(client, {
        event: 'unsubscribe.rejected',
        reason: 'robotId is required',
      });
      return;
    }

    const subscription = state.subscriptions.get(normalizedRobotId);
    if (!subscription) {
      this.sendToClient(client, {
        event: 'unsubscribe.ignored',
        robotId: normalizedRobotId,
        reason: 'No active subscription',
      });
      return;
    }

    state.subscriptions.delete(normalizedRobotId);
    if (subscription.heartbeatTimer) {
      clearInterval(subscription.heartbeatTimer);
    }
    subscription.socket.close(1000, 'client_unsubscribe');

    this.sendToClient(client, {
      event: 'unsubscribe.done',
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

  private isHeartbeatPayload(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return false;
    }

    return (payload as { reqType?: string }).reqType === 'onHeartBeat';
  }

  private authenticate(request: IncomingMessage): JwtUser | null {
    if (!this.refreshTokenSecret) {
      this.logger.error(
        'REFRESH_TOKEN_SECRET is missing, websocket authentication is disabled',
      );
      return null;
    }

    const refreshToken = this.extractRefreshTokenCookie(request);
    if (!refreshToken) {
      return null;
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        this.refreshTokenSecret,
      ) as JwtPayload;
      if (!this.isJwtPayload(decoded)) {
        return null;
      }

      return {
        userId: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    } catch {
      return null;
    }
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
