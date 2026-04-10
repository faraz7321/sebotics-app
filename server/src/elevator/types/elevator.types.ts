/** Transaction states (FSM) */
export enum TransactionState {
  CREATED = 'CREATED',
  WAITING_FOR_OPERATOR = 'WAITING_FOR_OPERATOR',
  WAITING_FOR_ELEVATOR = 'WAITING_FOR_ELEVATOR',
  ARRIVED_ENTRY = 'ARRIVED_ENTRY',
  ENTERING = 'ENTERING',
  INSIDE = 'INSIDE',
  ARRIVED_EXIT = 'ARRIVED_EXIT',
  EXITING = 'EXITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/** Transaction step values sent to robot via WS */
export type TransactionStep =
  | 'transaction-start'
  | 'wait-enter'
  | 'arrived-enter-floor'
  | 'enter-success'
  | 'wait-exit'
  | 'arrived-exit-floor'
  | 'exit-success'
  | 'transaction-success'
  | 'transaction-failed'
  | 'transaction-cancel'
  | 'transaction-expired';

/** Robot → Server action values */
export type RobotAction =
  | 'start-enter'
  | 'enter-success'
  | 'enter-failed'
  | 'give-up-enter'
  | 'start-exit'
  | 'exit-success'
  | 'exit-failed'
  | 'give-up-exit'
  | 'cancel-transaction';

/** Operator → Server UI action values */
export type OperatorAction =
  | 'CLAIM_TRANSACTION'
  | 'CALL_ELEVATOR'
  | 'ARRIVED_ENTRY'
  | 'DISPATCHED'
  | 'ARRIVED_EXIT'
  | 'COMPLETE'
  | 'FAIL';

/** Server → Robot messages */
export type RobotElevatorStateMessage = {
  messageType: 'elevator-state';
  state: {
    elevatorId: string;
    currentFloor: number;
    currentFloorName: string;
    timestamp: number;
  };
};

export type RobotTransactionStepMessage = {
  messageType: 'transaction-step';
  step: TransactionStep;
};

export type RobotAffirmActionMessage = {
  messageType: 'affirm-action';
  action: RobotAction;
  actionTs: number;
};

export type RobotMessage =
  | RobotElevatorStateMessage
  | RobotTransactionStepMessage
  | RobotAffirmActionMessage;

/** Robot → Server messages */
export type RobotCommand = {
  action: RobotAction;
  timestamp: number;
};

/** Operator → Server messages */
export type OperatorCommand = {
  type: OperatorAction;
  transactionId?: string;
  currentFloor?: number;
  currentFloorName?: string;
};

/** Server → Operator messages */
export type OperatorEventType =
  | 'ELEVATOR_REQUEST'
  | 'CLAIM_ACCEPTED'
  | 'CLAIM_REJECTED'
  | 'TRANSACTION_ASSIGNED'
  | 'TRANSACTION_UPDATE'
  | 'TRANSACTION_ENDED'
  | 'ROBOT_ACTION'
  | 'CONNECTION_READY'
  | 'ERROR';

export type OperatorEvent = {
  type: OperatorEventType;
  [key: string]: unknown;
};

/** In-memory transaction */
export interface Transaction {
  id: string;
  robotId: string;
  buildingId: string;
  startFloor: string;
  endFloor: string;
  elevatorId: string;
  assignedUserId?: string;
  state: TransactionState;
  createdAt: Date;
}
