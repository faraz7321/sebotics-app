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
import { RawData, WebSocket, WebSocketServer } from 'ws';
import type { JwtPayload, JwtUser } from '../../auth/auth.types';
import { ElevatorService } from '../elevator.service';
import { isTerminalState } from '../fsm/elevator.fsm';
import {
  OperatorAction,
  OperatorCommand,
  RobotAction,
  RobotCommand,
  Transaction,
  TransactionState,
} from '../types/elevator.types';

const VALID_ROBOT_ACTIONS = new Set<string>([
  'start-enter',
  'enter-success',
  'enter-failed',
  'give-up-enter',
  'start-exit',
  'exit-success',
  'exit-failed',
  'give-up-exit',
  'cancel-transaction',
]);

const VALID_OPERATOR_ACTIONS = new Set<string>([
  'CLAIM_TRANSACTION',
  'CALL_ELEVATOR',
  'ARRIVED_ENTRY',
  'DISPATCHED',
  'ARRIVED_EXIT',
  'COMPLETE',
  'FAIL',
]);

type RobotClient = {
  ws: WebSocket;
  transactionId: string;
};

type OperatorClient = {
  ws: WebSocket;
  user: JwtUser;
  connectionId: string;
};

@Injectable()
export class ElevatorWsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElevatorWsGateway.name);

  /** Robot WS connections keyed by transactionId */
  private readonly robotClients = new Map<string, RobotClient>();
  /** Operator WS connections keyed by WebSocket instance */
  private readonly operatorClients = new Map<WebSocket, OperatorClient>();

  private robotWss?: WebSocketServer;
  private operatorWss?: WebSocketServer;

  private readonly robotWsPathPrefix = '/ws/elevator/transaction/';
  private readonly operatorWsPath = '/ws/elevator/operators';
  private readonly refreshTokenSecret: string;
  private readonly jwtSecret: string;
  private readonly corsOrigin: string;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    private readonly elevatorService: ElevatorService,
  ) {
    this.refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? '';
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    this.corsOrigin = this.configService.get<string>('CORS_ORIGIN') ?? '';
  }

  onModuleInit(): void {
    const httpServer =
      this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;

    this.robotWss = new WebSocketServer({ noServer: true });
    this.operatorWss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', this.handleUpgrade);

    this.robotWss.on('connection', this.handleRobotConnection);
    this.operatorWss.on('connection', this.handleOperatorConnection);

    this.logger.log(
      JSON.stringify({
        event: 'elevator.ws.ready',
        robotPath: this.robotWsPathPrefix + '{transactionId}',
        operatorPath: this.operatorWsPath,
      }),
    );
  }

  onModuleDestroy(): void {
    const httpServer =
      this.httpAdapterHost.httpAdapter.getHttpServer() as HttpServer;
    httpServer.off('upgrade', this.handleUpgrade);

    for (const client of this.robotClients.values()) {
      client.ws.close(1012, 'server_shutdown');
    }
    this.robotClients.clear();

    for (const client of this.operatorClients.values()) {
      client.ws.close(1012, 'server_shutdown');
    }
    this.operatorClients.clear();

    this.robotWss?.close();
    this.operatorWss?.close();
  }

  // ─── Upgrade handler ────────────────────────────────────────────

  private readonly handleUpgrade = (
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    // Robot transaction WS: /ws/elevator/transaction/{id}
    if (url.pathname.startsWith(this.robotWsPathPrefix)) {
      const transactionId = url.pathname.slice(this.robotWsPathPrefix.length);
      if (!transactionId) {
        socket.destroy();
        return;
      }

      // Verify transaction exists
      try {
        this.elevatorService.getTransaction(transactionId);
      } catch {
        socket.destroy();
        return;
      }

      this.robotWss?.handleUpgrade(request, socket, head, (client) => {
        (request as IncomingMessage & { transactionId?: string }).transactionId =
          transactionId;
        this.robotWss?.emit('connection', client, request);
      });
      return;
    }

    // Operator WS: /ws/elevator/operators
    if (url.pathname === this.operatorWsPath) {
      if (!this.isOriginAllowed(request.headers.origin)) {
        socket.destroy();
        return;
      }

      const user = this.authenticate(request);
      if (!user) {
        socket.destroy();
        return;
      }

      this.operatorWss?.handleUpgrade(request, socket, head, (client) => {
        (request as IncomingMessage & { user?: JwtUser }).user = user;
        this.operatorWss?.emit('connection', client, request);
      });
      return;
    }

    // Not our path — do not destroy; let other handlers process it
  };

  // ─── Robot connection ───────────────────────────────────────────

  private readonly handleRobotConnection = (
    client: WebSocket,
    request: IncomingMessage,
  ) => {
    const transactionId = (
      request as IncomingMessage & { transactionId?: string }
    ).transactionId;
    if (!transactionId) {
      client.close(1008, 'missing_transaction_id');
      return;
    }

    let transaction: Transaction;
    try {
      transaction = this.elevatorService.getTransaction(transactionId);
    } catch {
      client.close(1008, 'transaction_not_found');
      return;
    }

    if (isTerminalState(transaction.state)) {
      client.close(1008, 'transaction_already_ended');
      return;
    }

    // Replace existing robot client for this transaction
    const existing = this.robotClients.get(transactionId);
    if (existing) {
      existing.ws.close(1000, 'replaced');
    }

    this.robotClients.set(transactionId, { ws: client, transactionId });

    this.logger.log(
      JSON.stringify({
        event: 'elevator.ws.robot.connected',
        transactionId,
        robotId: transaction.robotId,
      }),
    );

    // Send transaction-start
    this.sendToRobot(transactionId, {
      messageType: 'transaction-step',
      step: 'transaction-start',
    });

    // Send initial elevator state
    this.sendElevatorState(transactionId, transaction.startFloor);

    client.on('message', (raw) => {
      this.onRobotMessage(transactionId, raw);
    });

    client.on('close', () => {
      this.onRobotDisconnect(transactionId);
    });

    client.on('error', (error) => {
      this.logger.warn(
        JSON.stringify({
          event: 'elevator.ws.robot.error',
          transactionId,
          message: error.message,
        }),
      );
    });
  };

  // ─── Operator connection ────────────────────────────────────────

  private readonly handleOperatorConnection = (
    client: WebSocket,
    request: IncomingMessage,
  ) => {
    const user = (request as IncomingMessage & { user?: JwtUser }).user;
    if (!user) {
      client.close(1008, 'unauthorized');
      return;
    }

    const connectionId = randomUUID();
    this.operatorClients.set(client, { ws: client, user, connectionId });

    this.logger.log(
      JSON.stringify({
        event: 'elevator.ws.operator.connected',
        connectionId,
        userId: user.userId,
        username: user.username,
      }),
    );

    this.sendToOperator(client, {
      type: 'CONNECTION_READY',
      connectionId,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
      },
    });

    // Send active transactions
    const activeTransactions = this.elevatorService.getActiveTransactions();
    for (const t of activeTransactions) {
      this.sendToOperator(client, {
        type: 'ELEVATOR_REQUEST',
        transactionId: t.id,
        robotId: t.robotId,
        buildingId: t.buildingId,
        from: t.startFloor,
        to: t.endFloor,
        state: t.state,
        assignedUserId: t.assignedUserId ?? null,
      });
    }

    client.on('message', (raw) => {
      this.onOperatorMessage(client, raw);
    });

    client.on('close', () => {
      this.onOperatorDisconnect(client);
    });

    client.on('error', (error) => {
      const opClient = this.operatorClients.get(client);
      this.logger.warn(
        JSON.stringify({
          event: 'elevator.ws.operator.error',
          connectionId: opClient?.connectionId,
          message: error.message,
        }),
      );
    });
  };

  // ─── Robot message handling ─────────────────────────────────────

  private onRobotMessage(transactionId: string, raw: RawData): void {
    const command = this.parseJson<RobotCommand>(raw);
    if (!command?.action || !VALID_ROBOT_ACTIONS.has(command.action)) {
      this.sendToRobot(transactionId, {
        messageType: 'error',
        reason: 'Invalid action',
      });
      return;
    }

    try {
      const { transaction, robotStep } = this.elevatorService.processRobotAction(
        transactionId,
        command.action as RobotAction,
      );

      // Affirm the action back to robot
      this.sendToRobot(transactionId, {
        messageType: 'affirm-action',
        action: command.action,
        actionTs: command.timestamp ?? Date.now(),
      });

      // Send step if FSM produced one
      if (robotStep) {
        this.sendToRobot(transactionId, {
          messageType: 'transaction-step',
          step: robotStep,
        });
      }

      // Notify assigned operator
      this.notifyAssignedOperator(transaction, {
        type: 'ROBOT_ACTION',
        transactionId,
        action: command.action,
        state: transaction.state,
      });

      // If terminal, clean up
      if (isTerminalState(transaction.state)) {
        this.endTransaction(transactionId, transaction);
      }
    } catch (error) {
      this.sendToRobot(transactionId, {
        messageType: 'error',
        reason: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  }

  private onRobotDisconnect(transactionId: string): void {
    this.robotClients.delete(transactionId);

    this.logger.log(
      JSON.stringify({
        event: 'elevator.ws.robot.disconnected',
        transactionId,
      }),
    );
  }

  // ─── Operator message handling ──────────────────────────────────

  private onOperatorMessage(client: WebSocket, raw: RawData): void {
    const opClient = this.operatorClients.get(client);
    if (!opClient) return;

    const command = this.parseJson<OperatorCommand>(raw);
    if (!command?.type || !VALID_OPERATOR_ACTIONS.has(command.type)) {
      this.sendToOperator(client, {
        type: 'ERROR',
        reason: 'Invalid command type',
      });
      return;
    }

    if (!command.transactionId) {
      this.sendToOperator(client, {
        type: 'ERROR',
        reason: 'transactionId is required',
      });
      return;
    }

    // Handle claim separately
    if (command.type === 'CLAIM_TRANSACTION') {
      this.handleClaim(client, opClient, command.transactionId);
      return;
    }

    // All other actions require the operator to be assigned
    this.handleOperatorAction(client, opClient, command);
  }

  private handleClaim(
    client: WebSocket,
    opClient: OperatorClient,
    transactionId: string,
  ): void {
    try {
      const transaction = this.elevatorService.claimTransaction(
        transactionId,
        opClient.user.userId,
      );

      this.sendToOperator(client, {
        type: 'CLAIM_ACCEPTED',
        transactionId,
        transaction: this.serializeTransaction(transaction),
      });

      // Broadcast assignment to all operators
      this.broadcastToOperators({
        type: 'TRANSACTION_ASSIGNED',
        transactionId,
        assignedUserId: opClient.user.userId,
        assignedUsername: opClient.user.username,
      });
    } catch (error) {
      this.sendToOperator(client, {
        type: 'CLAIM_REJECTED',
        transactionId,
        reason: error instanceof Error ? error.message : 'Claim failed',
      });
    }
  }

  private handleOperatorAction(
    client: WebSocket,
    opClient: OperatorClient,
    command: OperatorCommand,
  ): void {
    try {
      const { transaction, robotStep } =
        this.elevatorService.processOperatorAction(
          command.transactionId!,
          command.type as OperatorAction,
          opClient.user.userId,
        );

      // Send step to robot
      if (robotStep) {
        this.sendToRobot(command.transactionId!, {
          messageType: 'transaction-step',
          step: robotStep,
        });
      }

      // Send elevator state to robot if operator provides floor info
      if (command.currentFloorName) {
        this.sendElevatorState(
          command.transactionId!,
          command.currentFloorName,
          command.currentFloor,
        );
      }

      // Confirm to operator
      this.sendToOperator(client, {
        type: 'TRANSACTION_UPDATE',
        transactionId: command.transactionId,
        state: transaction.state,
        action: command.type,
      });

      // Broadcast state update to all operators
      this.broadcastToOperators({
        type: 'TRANSACTION_UPDATE',
        transactionId: command.transactionId,
        state: transaction.state,
      });

      // If terminal, clean up
      if (isTerminalState(transaction.state)) {
        this.endTransaction(command.transactionId!, transaction);
      }
    } catch (error) {
      this.sendToOperator(client, {
        type: 'ERROR',
        transactionId: command.transactionId,
        reason: error instanceof Error ? error.message : 'Action failed',
      });
    }
  }

  private onOperatorDisconnect(client: WebSocket): void {
    const opClient = this.operatorClients.get(client);
    this.operatorClients.delete(client);

    if (!opClient) return;

    this.logger.log(
      JSON.stringify({
        event: 'elevator.ws.operator.disconnected',
        connectionId: opClient.connectionId,
        userId: opClient.user.userId,
      }),
    );

    // If operator had an active transaction, fail it
    const activeTransaction = this.elevatorService.getActiveTransactionForOperator(
      opClient.user.userId,
    );
    if (activeTransaction) {
      try {
        this.elevatorService.processOperatorAction(
          activeTransaction.id,
          'FAIL',
          opClient.user.userId,
        );

        this.sendToRobot(activeTransaction.id, {
          messageType: 'transaction-step',
          step: 'transaction-failed',
        });

        this.broadcastToOperators({
          type: 'TRANSACTION_ENDED',
          transactionId: activeTransaction.id,
          state: TransactionState.FAILED,
          reason: 'operator_disconnected',
        });
      } catch {
        // Already in terminal state
      }
    }
  }

  // ─── Broadcasting ───────────────────────────────────────────────

  /**
   * Broadcast a new elevator request to all connected operators.
   * Called from the REST controller after creating a transaction.
   */
  broadcastNewRequest(transaction: Transaction): void {
    this.broadcastToOperators({
      type: 'ELEVATOR_REQUEST',
      transactionId: transaction.id,
      robotId: transaction.robotId,
      buildingId: transaction.buildingId,
      from: transaction.startFloor,
      to: transaction.endFloor,
      state: transaction.state,
    });
  }

  /**
   * Broadcast a cancellation to operators and close robot WS.
   */
  broadcastCancellation(transactionId: string): void {
    this.sendToRobot(transactionId, {
      messageType: 'transaction-step',
      step: 'transaction-cancel',
    });

    const robotClient = this.robotClients.get(transactionId);
    if (robotClient) {
      robotClient.ws.close(1000, 'transaction_cancelled');
      this.robotClients.delete(transactionId);
    }

    this.broadcastToOperators({
      type: 'TRANSACTION_ENDED',
      transactionId,
      state: TransactionState.CANCELLED,
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private endTransaction(transactionId: string, transaction: Transaction): void {
    // Close robot connection
    const robotClient = this.robotClients.get(transactionId);
    if (robotClient) {
      setTimeout(() => {
        robotClient.ws.close(1000, 'transaction_ended');
        this.robotClients.delete(transactionId);
      }, 1000);
    }

    // Notify all operators
    this.broadcastToOperators({
      type: 'TRANSACTION_ENDED',
      transactionId,
      state: transaction.state,
    });
  }

  private sendElevatorState(
    transactionId: string,
    floorName: string,
    floorNumber?: number,
  ): void {
    let transaction: Transaction;
    try {
      transaction = this.elevatorService.getTransaction(transactionId);
    } catch {
      return;
    }

    this.sendToRobot(transactionId, {
      messageType: 'elevator-state',
      state: {
        elevatorId: transaction.elevatorId,
        currentFloor: floorNumber ?? (parseInt(floorName, 10) || 0),
        currentFloorName: floorName,
        timestamp: Date.now(),
      },
    });
  }

  private sendToRobot(
    transactionId: string,
    payload: Record<string, unknown>,
  ): void {
    const client = this.robotClients.get(transactionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    client.ws.send(JSON.stringify(payload));
  }

  private sendToOperator(
    client: WebSocket,
    payload: Record<string, unknown>,
  ): void {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }

  private broadcastToOperators(payload: Record<string, unknown>): void {
    for (const opClient of this.operatorClients.values()) {
      this.sendToOperator(opClient.ws, payload);
    }
  }

  private notifyAssignedOperator(
    transaction: Transaction,
    payload: Record<string, unknown>,
  ): void {
    if (!transaction.assignedUserId) return;

    for (const opClient of this.operatorClients.values()) {
      if (opClient.user.userId === transaction.assignedUserId) {
        this.sendToOperator(opClient.ws, payload);
        break;
      }
    }
  }

  private serializeTransaction(transaction: Transaction) {
    return {
      id: transaction.id,
      robotId: transaction.robotId,
      buildingId: transaction.buildingId,
      startFloor: transaction.startFloor,
      endFloor: transaction.endFloor,
      elevatorId: transaction.elevatorId,
      state: transaction.state,
      assignedUserId: transaction.assignedUserId ?? null,
      createdAt: transaction.createdAt.toISOString(),
    };
  }

  private parseJson<T>(raw: RawData): T | null {
    const text = this.toText(raw);
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed as T;
    } catch {
      return null;
    }
  }

  private toText(raw: RawData): string {
    if (typeof raw === 'string') return raw;
    if (raw instanceof Buffer) return raw.toString('utf8');
    if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString('utf8');
    if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
    return '';
  }

  // ─── Auth (mirrors autoxing-ws-bridge pattern) ──────────────────

  private authenticate(request: IncomingMessage): JwtUser | null {
    const refreshToken = this.extractRefreshTokenCookie(request);
    if (refreshToken && this.refreshTokenSecret) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          this.refreshTokenSecret,
        ) as JwtPayload;
        if (this.isJwtPayload(decoded)) {
          return {
            userId: decoded.sub,
            username: decoded.username,
            role: decoded.role,
          };
        }
      } catch {
        // fall through
      }
    }

    if (this.jwtSecret) {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) {
        try {
          const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
          if (this.isJwtPayload(decoded)) {
            return {
              userId: decoded.sub,
              username: decoded.username,
              role: decoded.role,
            };
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
    if (!cookieHeader) return null;

    const parts = cookieHeader.split(';').map((item: string) => item.trim());
    for (const part of parts) {
      if (!part) continue;
      const [key, ...rest] = part.split('=');
      if (key === 'refreshToken') {
        return decodeURIComponent(rest.join('='));
      }
    }
    return null;
  }

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') return false;
    const p = payload as Partial<JwtPayload>;
    return (
      typeof p.sub === 'string' &&
      typeof p.username === 'string' &&
      (p.role === Role.ADMIN || p.role === Role.CLIENT)
    );
  }

  private isOriginAllowed(origin: string | undefined): boolean {
    if (!origin || !this.corsOrigin) return true;
    return origin === this.corsOrigin;
  }
}
