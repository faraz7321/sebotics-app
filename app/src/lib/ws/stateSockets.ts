import { store } from "@/store";
import { updateRobot } from "../slices/RobotSlice";
import { StateSocket } from "./stateSocket";
import { updateTask } from "../slices/TaskSlice";

function mapRobotState(payload: any) {
  const s = payload.state;

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
    errors: (s.errors || []).map((e: any) => e.message),
    isError: (s.errors || []).length > 0,
  };
}

function mapTaskSocket(payload: any) {
  const d = payload.data;

  return {
    taskId: d.taskId,
    isTaskCancel: d.isTaskCancel ?? false,
  };
}

export const robotStateSocket = new StateSocket(
  "subscribe.robot.state",
  "unsubscribe.robot.state",
  (data: any) => {
    const payload = data.payload ?? data;

    if (!payload?.state) return;

    const robotId = payload.deviceId;
    const patch = mapRobotState(payload);

    store.dispatch(updateRobot({ robotId, patch }));
  }
);

export const taskStateSocket = new StateSocket(
  "subscribe.task.state",
  "unsubscribe.task.state",
  (data: any) => {
    const payload = data.payload ?? data;
    
    if (!payload?.lists) return;
    
    console.log("task state:", payload);
    
    payload.lists.forEach((item: any) => {
      const patch = mapTaskSocket(item);

      store.dispatch(updateTask({
        taskId: patch.taskId,
        patch,
        actType: item.actType
      }));
    });
  }
);