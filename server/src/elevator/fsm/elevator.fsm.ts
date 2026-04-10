import {
  TransactionState,
  TransactionStep,
  RobotAction,
  OperatorAction,
} from '../types/elevator.types';

type FsmTransition = {
  nextState: TransactionState;
  robotStep?: TransactionStep;
};

/**
 * Operator-driven transitions: operator UI action → state change + robot step.
 */
const operatorTransitions: Record<string, FsmTransition> = {
  // Operator calls the elevator
  [`${TransactionState.WAITING_FOR_OPERATOR}:CALL_ELEVATOR`]: {
    nextState: TransactionState.WAITING_FOR_ELEVATOR,
    robotStep: 'wait-enter',
  },
  // Elevator arrived at entry floor
  [`${TransactionState.WAITING_FOR_ELEVATOR}:ARRIVED_ENTRY`]: {
    nextState: TransactionState.ARRIVED_ENTRY,
    robotStep: 'arrived-enter-floor',
  },
  // Elevator dispatched (doors closed, moving to exit floor)
  [`${TransactionState.INSIDE}:DISPATCHED`]: {
    nextState: TransactionState.ARRIVED_EXIT,
    robotStep: 'wait-exit',
  },
  // Elevator arrived at exit floor
  [`${TransactionState.ARRIVED_EXIT}:ARRIVED_EXIT`]: {
    nextState: TransactionState.ARRIVED_EXIT,
    robotStep: 'arrived-exit-floor',
  },
  // Operator marks complete
  [`${TransactionState.ARRIVED_EXIT}:COMPLETE`]: {
    nextState: TransactionState.COMPLETED,
    robotStep: 'transaction-success',
  },
  // Operator marks failure from any active state
  ...Object.fromEntries(
    [
      TransactionState.WAITING_FOR_OPERATOR,
      TransactionState.WAITING_FOR_ELEVATOR,
      TransactionState.ARRIVED_ENTRY,
      TransactionState.ENTERING,
      TransactionState.INSIDE,
      TransactionState.ARRIVED_EXIT,
      TransactionState.EXITING,
    ].map((state) => [
      `${state}:FAIL`,
      { nextState: TransactionState.FAILED, robotStep: 'transaction-failed' as TransactionStep },
    ]),
  ),
};

/**
 * Robot-driven transitions: robot action → state change.
 */
const robotTransitions: Record<string, FsmTransition> = {
  // Robot starts entering
  [`${TransactionState.ARRIVED_ENTRY}:start-enter`]: {
    nextState: TransactionState.ENTERING,
  },
  // Robot finished entering
  [`${TransactionState.ENTERING}:enter-success`]: {
    nextState: TransactionState.INSIDE,
    robotStep: 'enter-success',
  },
  // Robot failed to enter
  [`${TransactionState.ENTERING}:enter-failed`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  // Robot gave up entering
  [`${TransactionState.ARRIVED_ENTRY}:give-up-enter`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  [`${TransactionState.ENTERING}:give-up-enter`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  // Robot starts exiting
  [`${TransactionState.ARRIVED_EXIT}:start-exit`]: {
    nextState: TransactionState.EXITING,
  },
  // Robot finished exiting
  [`${TransactionState.EXITING}:exit-success`]: {
    nextState: TransactionState.COMPLETED,
    robotStep: 'transaction-success',
  },
  // Robot failed to exit
  [`${TransactionState.EXITING}:exit-failed`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  // Robot gave up exiting
  [`${TransactionState.ARRIVED_EXIT}:give-up-exit`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  [`${TransactionState.EXITING}:give-up-exit`]: {
    nextState: TransactionState.FAILED,
    robotStep: 'transaction-failed',
  },
  // Robot cancels from any active state
  ...Object.fromEntries(
    [
      TransactionState.WAITING_FOR_OPERATOR,
      TransactionState.WAITING_FOR_ELEVATOR,
      TransactionState.ARRIVED_ENTRY,
      TransactionState.ENTERING,
      TransactionState.INSIDE,
      TransactionState.ARRIVED_EXIT,
      TransactionState.EXITING,
    ].map((state) => [
      `${state}:cancel-transaction`,
      { nextState: TransactionState.CANCELLED, robotStep: 'transaction-cancel' as TransactionStep },
    ]),
  ),
};

export function applyOperatorAction(
  currentState: TransactionState,
  action: OperatorAction,
): FsmTransition | null {
  return operatorTransitions[`${currentState}:${action}`] ?? null;
}

export function applyRobotAction(
  currentState: TransactionState,
  action: RobotAction,
): FsmTransition | null {
  return robotTransitions[`${currentState}:${action}`] ?? null;
}

export function isTerminalState(state: TransactionState): boolean {
  return (
    state === TransactionState.COMPLETED ||
    state === TransactionState.FAILED ||
    state === TransactionState.CANCELLED
  );
}
