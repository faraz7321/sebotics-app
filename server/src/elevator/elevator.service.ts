import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Transaction,
  TransactionState,
  RobotAction,
  OperatorAction,
} from './types/elevator.types';
import {
  applyOperatorAction,
  applyRobotAction,
  isTerminalState,
} from './fsm/elevator.fsm';

@Injectable()
export class ElevatorService {
  private readonly logger = new Logger(ElevatorService.name);
  private readonly transactions = new Map<string, Transaction>();

  createTransaction(
    robotId: string,
    buildingId: string,
    startFloor: string,
    endFloor: string,
  ): Transaction {
    const transaction: Transaction = {
      id: randomUUID(),
      robotId,
      buildingId,
      startFloor,
      endFloor,
      elevatorId: randomUUID().substring(0, 12).toUpperCase(),
      state: TransactionState.WAITING_FOR_OPERATOR,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    this.logger.log(
      JSON.stringify({
        event: 'elevator.transaction.created',
        transactionId: transaction.id,
        robotId,
        buildingId,
        startFloor,
        endFloor,
      }),
    );

    return transaction;
  }

  getTransaction(transactionId: string): Transaction {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  getActiveTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).filter(
      (t) => !isTerminalState(t.state),
    );
  }

  getActiveTransactionForOperator(userId: string): Transaction | undefined {
    return Array.from(this.transactions.values()).find(
      (t) => t.assignedUserId === userId && !isTerminalState(t.state),
    );
  }

  /**
   * Atomic claim: assigns an operator to a transaction.
   * Returns the transaction if successful, throws otherwise.
   */
  claimTransaction(transactionId: string, userId: string): Transaction {
    const transaction = this.getTransaction(transactionId);

    if (isTerminalState(transaction.state)) {
      throw new ConflictException('Transaction is already completed');
    }

    if (transaction.assignedUserId) {
      if (transaction.assignedUserId === userId) {
        return transaction;
      }
      throw new ConflictException('Transaction is already claimed by another operator');
    }

    // Check if operator already has an active transaction
    const existing = this.getActiveTransactionForOperator(userId);
    if (existing) {
      throw new ConflictException('Operator already has an active transaction');
    }

    transaction.assignedUserId = userId;

    this.logger.log(
      JSON.stringify({
        event: 'elevator.transaction.claimed',
        transactionId,
        userId,
      }),
    );

    return transaction;
  }

  /**
   * Process an operator UI action through the FSM.
   */
  processOperatorAction(
    transactionId: string,
    action: OperatorAction,
    userId: string,
  ): { transaction: Transaction; robotStep?: string } {
    const transaction = this.getTransaction(transactionId);

    if (transaction.assignedUserId !== userId) {
      throw new BadRequestException('You are not assigned to this transaction');
    }

    const result = applyOperatorAction(transaction.state, action);
    if (!result) {
      throw new BadRequestException(
        `Invalid action '${action}' for state '${transaction.state}'`,
      );
    }

    const previousState = transaction.state;
    transaction.state = result.nextState;

    this.logger.log(
      JSON.stringify({
        event: 'elevator.transaction.operator_action',
        transactionId,
        action,
        previousState,
        newState: transaction.state,
        robotStep: result.robotStep,
      }),
    );

    return { transaction, robotStep: result.robotStep };
  }

  /**
   * Process a robot action through the FSM.
   */
  processRobotAction(
    transactionId: string,
    action: RobotAction,
  ): { transaction: Transaction; robotStep?: string } {
    const transaction = this.getTransaction(transactionId);

    const result = applyRobotAction(transaction.state, action);
    if (!result) {
      throw new BadRequestException(
        `Invalid robot action '${action}' for state '${transaction.state}'`,
      );
    }

    const previousState = transaction.state;
    transaction.state = result.nextState;

    this.logger.log(
      JSON.stringify({
        event: 'elevator.transaction.robot_action',
        transactionId,
        action,
        previousState,
        newState: transaction.state,
        robotStep: result.robotStep,
      }),
    );

    return { transaction, robotStep: result.robotStep };
  }

  cancelTransaction(transactionId: string): Transaction {
    const transaction = this.getTransaction(transactionId);

    if (isTerminalState(transaction.state)) {
      return transaction;
    }

    transaction.state = TransactionState.CANCELLED;

    this.logger.log(
      JSON.stringify({
        event: 'elevator.transaction.cancelled',
        transactionId,
      }),
    );

    return transaction;
  }

  removeTransaction(transactionId: string): void {
    this.transactions.delete(transactionId);
  }
}
