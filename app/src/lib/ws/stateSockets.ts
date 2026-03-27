import { store } from "@/store";
import { updateRobot } from "../slices/RobotSlice";
import { StateSocket } from "./stateSocket";
import { updateTask } from "../slices/TaskSlice";
import type { Robot } from "../types/RobotTypes";
import { type ActType } from "../types/TaskTypes";

type UnknownRecord = Record<string, unknown>;

type RobotWsError = {
  message?: string;
};

type RobotWsTask = {
  isFinish?: boolean;
};

type RobotWsState = {
  battery?: number;
  businessId?: string;
  isCharging?: boolean;
  isEmergencyStop?: boolean;
  isManualMode?: boolean;
  isRemoteMode?: boolean;
  x?: number;
  y?: number;
  yaw?: number;
  taskObj?: RobotWsTask | null;
  errors?: RobotWsError[];
};

type RobotWsPayload = {
  deviceId?: string;
  state?: RobotWsState;
};

type TaskWsEntry = {
  data?: {
    taskId?: string;
    isTaskCancel?: boolean;
  };
  actType?: number;
};

type TaskWsPayload = {
  lists?: TaskWsEntry[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getEnvelopePayload<T>(data: unknown): T | null {
  if (!isRecord(data)) return null;

  const payload = isRecord(data.payload) ? data.payload : data;
  return payload as T;
}

function mapRobotState(payload: RobotWsPayload): Partial<Robot> {
  const s = payload.state;
  if (!s) {
    return {};
  }

  const errors = Array.isArray(s.errors)
    ? s.errors.map((e) => (typeof e?.message === "string" ? e.message : "")).filter(Boolean)
    : [];

  return {
    battery: s.battery,
    businessId: s.businessId,
    isCharging: s.isCharging,
    isEmergencyStop: s.isEmergencyStop,
    isManualMode: s.isManualMode,
    isRemoteMode: s.isRemoteMode,
    x: s.x,
    y: s.y,
    yaw: s.yaw,

    // derive flags
    isTask: !!s.taskObj && !s.taskObj.isFinish,
    isOnLine: true,

    // convert errors
    errors,
    isError: errors.length > 0,
  };
}

function mapTaskSocket(payload: TaskWsEntry) {
  const d = payload.data;
  if (!d?.taskId) return null;

  return {
    taskId: d.taskId,
    isTaskCancel: d.isTaskCancel ?? false,
  };
}

const getToken = () => store.getState().auth.accessToken ?? null;

export const robotStateSocket = new StateSocket(
  "subscribe.robot.state",
  "unsubscribe.robot.state",
  (data: unknown) => {
    const payload = getEnvelopePayload<RobotWsPayload>(data);
    if (!payload?.state || !payload.deviceId) return;

    const robotId = payload.deviceId;
    const patch = mapRobotState(payload);

    store.dispatch(updateRobot({ robotId, patch }));
  },
  getToken
);

export const taskStateSocket = new StateSocket(
  "subscribe.task.state",
  "unsubscribe.task.state",
  (data: unknown) => {
    const payload = getEnvelopePayload<TaskWsPayload>(data);
    if (!payload?.lists) return;

    payload.lists.forEach((item) => {
      const patch = mapTaskSocket(item);
      if (!patch) return;

      store.dispatch(updateTask({
        taskId: patch.taskId,
        patch,
        actType: item.actType as ActType | undefined
      }));
    });
  },
  getToken
);
