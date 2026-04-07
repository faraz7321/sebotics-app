import { listTasks, createTask, executeTask, cancelTask, createTaskv3 } from "@/lib/slices/TaskSlice";
import { TaskType, RunType, RouteMode, type CreateTaskRequest, DispatchType, ActType, RunMode, type TaskPoint } from "@/lib/types/TaskTypes";
import { type PointOfInterest } from "@/lib/types/MapTypes";
import type { AppDispatch } from "@/store";
import { getCestTimestamp } from "@/lib/utils";
import { toast } from "sonner";
import i18n from "@/i18n";

export async function refreshTasks(dispatch: AppDispatch, businessId: string) {
  const now = getCestTimestamp();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  await dispatch(listTasks({
    businessId,
    startTime: twoHoursAgo,
    endTime: now
  }));
}

export async function performTaskAction(
  action: () => Promise<unknown>,
  refresh: () => Promise<void>
) {
  try {
    await action();
    await refresh();
  } catch (e) {
    console.error("Task action failed", e);
  }
}

export async function handleCreateDeliveryTask(
  { dispatch, businessId, poi, robotId, speed, returnDest, backPt, pauseTime, execute = false, priority = false, isV3 = true }:
    {
      dispatch: AppDispatch,
      businessId: string,
      poi: PointOfInterest,
      robotId?: string,
      speed?: number,
      returnDest?: number,
      backPt?: TaskPoint,
      pauseTime?: number,
      execute: boolean,
      priority: boolean,
      isV3: boolean
    }
) {

  const task: CreateTaskRequest = {
    name: `Go to ${poi.name || poi.id}`,
    robotId: robotId || "",
    businessId,
    runNum: 1,
    taskType: TaskType.Delivery,
    runType: RunType.MultiPointMealDelivery,
    routeMode: RouteMode.ShortestDistanceRouting,
    runMode: RunMode.FlexibleObstacleAvoidance,
    ignorePublicSite: false,
    speed,
    returnDest,
    backPt,
    taskPts: [
      {
        stopRadius: 1,
        areaId: poi.areaId || "",
        poiId: poi.id,
        ...(isV3 && {
          ext: { name: poi.name || "", id: poi.id }
        }),
        ...(pauseTime !== undefined && pauseTime > 0 ? {
          stepActs: [
            {
              type: ActType.TaskPaused,
              data: {
                pauseTime: pauseTime
              }
            }
          ]
        } : {})
      }
    ],
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      const res = await dispatch(executeTask(response.payload.data.taskId));
      if (executeTask.fulfilled.match(res)) {
        toast.success(i18n.t('tasks.notifications.executed', { defaultValue: 'Task executed' }));
      } else {
        toast.error(i18n.t('tasks.notifications.executeFailed', { defaultValue: 'Failed to execute task' }));
      }
    }
    await refreshTasks(dispatch, businessId);
  } else {
    toast.error(i18n.t('tasks.notifications.createFailed', { defaultValue: 'Failed to create task' }));
    console.error(`Failed to create task ${isV3 ? 'v3' : 'v1'}`, response.payload);
  }
}

export async function handleCreateMultiPointTask(
  { dispatch, businessId, pois, robotId, execute = false, priority = false, isV3 = true }:
    {
      dispatch: AppDispatch,
      businessId: string,
      pois: PointOfInterest[],
      robotId?: string,
      execute: boolean,
      priority: boolean,
      isV3: boolean
    }
) {
  const task: CreateTaskRequest = {
    name: "Multi-point Task",
    robotId: robotId || "",
    businessId,
    taskType: TaskType.Restaurant,
    runType: RunType.MultiPointMealDelivery,
    routeMode: RouteMode.ShortestDistanceRouting,
    runMode: RunMode.FlexibleObstacleAvoidance,
    taskPts: pois.map((poi) => ({
      areaId: poi.areaId || "",
      ext: {
        name: poi.name || "",
        id: poi.id
      },
      stepActs: [
        {
          type: ActType.TaskPaused,
          data: {
            pauseTime: 10 // stop for two mins after reaching dest
          }
        }
      ]
    })),
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      const res = await dispatch(executeTask(response.payload.data.taskId));
      if (executeTask.fulfilled.match(res)) {
        toast.success(i18n.t('tasks.notifications.executed', { defaultValue: 'Task executed' }));
      } else {
        toast.error(i18n.t('tasks.notifications.executeFailed', { defaultValue: 'Failed to execute task' }));
      }
    }
    await refreshTasks(dispatch, businessId);
  } else {
    toast.error(i18n.t('tasks.notifications.createFailed', { defaultValue: 'Failed to create task' }));
    console.error(`Failed to create multi-point task ${isV3 ? 'v3' : 'v1'}`, response.payload);
  }
}

export async function handleCreateDropOffTask(
  { dispatch, businessId, pickup, dropoff, robotId, execute = false, priority = false, isV3 = true }:
    {
      dispatch: AppDispatch,
      businessId: string,
      pickup: PointOfInterest,
      dropoff: PointOfInterest,
      robotId?: string,
      execute: boolean,
      priority: boolean,
      isV3: boolean
    }
) {

  const task: CreateTaskRequest = {
    name: `Drop Off: ${pickup.name || pickup.id} -> ${dropoff.name || dropoff.id}`,
    robotId: robotId || "",
    businessId,
    routeMode: RouteMode.ShortestDistanceRouting,
    taskType: TaskType.Factory,
    runType: RunType.Lifting,
    runMode: 1,
    runNum: 1,
    ignorePublicSite: false,
    taskPts: [
      {
        areaId: pickup.areaId || "",
        poiId: pickup.id,
        x: pickup.coordinate[0],
        y: pickup.coordinate[1],
        stepActs: [{
          type: ActType.JackingLift,
          data: {}
        }],
        ...(isV3 && {
          ext: { name: pickup.name || "", id: pickup.id }
        })
      },
      {
        areaId: dropoff.areaId || "",
        poiId: dropoff.id,
        x: dropoff.coordinate[0],
        y: dropoff.coordinate[1],
        stepActs: [{
          type: ActType.JackingLower,
          data: {}
        }],
        ...(isV3 && {
          ext: { name: dropoff.name || "", id: dropoff.id }
        })
      }
    ],
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      const res = await dispatch(executeTask(response.payload.data.taskId));
      if (executeTask.fulfilled.match(res)) {
        toast.success(i18n.t('tasks.notifications.executed', { defaultValue: 'Task executed' }));
      } else {
        toast.error(i18n.t('tasks.notifications.executeFailed', { defaultValue: 'Failed to execute task' }));
      }
    }
    await refreshTasks(dispatch, businessId);
  } else {
    toast.error(i18n.t('tasks.notifications.createFailed', { defaultValue: 'Failed to create task' }));
    console.error(`Failed to create multi-point task ${isV3 ? 'v3' : 'v1'}`, response.payload);
  }
}

export async function handleCreateDockingTask(
  { dispatch, businessId, poi, robotId, execute = false, priority = false, isV3 = true }:
    {
      dispatch: AppDispatch,
      businessId: string,
      poi: PointOfInterest,
      robotId?: string,
      execute: boolean,
      priority: boolean,
      isV3: boolean
    }
) {
  const task: CreateTaskRequest = {
    name: `Return to Dock: ${poi.name || poi.id}`,
    robotId: robotId || "",
    businessId,
    taskType: TaskType.ReturnToChargingStation,
    runType: RunType.ChargingStation,
    routeMode: RouteMode.ShortestDistanceRouting,
    runMode: RunMode.FlexibleObstacleAvoidance,
    ignorePublicSite: false,
    taskPts: [
      {
        x: poi.coordinate[0],
        y: poi.coordinate[1],
        areaId: poi.areaId || "",
        poiId: poi.id,
        ...(isV3 && {
          ext: { name: poi.name || "", id: poi.id }
        }),
      }
    ],
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      const res = await dispatch(executeTask(response.payload.data.taskId));
      if (executeTask.fulfilled.match(res)) {
        toast.success(i18n.t('tasks.notifications.executed', { defaultValue: 'Task executed' }));
      } else {
        toast.error(i18n.t('tasks.notifications.executeFailed', { defaultValue: 'Failed to execute task' }));
      }
    }
    await refreshTasks(dispatch, businessId);
  } else {
    toast.error(i18n.t('tasks.notifications.createFailed', { defaultValue: 'Failed to create task' }));
    console.error(`Failed to create docking task ${isV3 ? 'v3' : 'v1'}`, response.payload);
  }
}

export async function handleExecuteTask(
  { dispatch, businessId, taskId }:
    { dispatch: AppDispatch, businessId: string, taskId: string }) {
  await performTaskAction(async () => {
    await dispatch(executeTask(taskId));
  }, () => refreshTasks(dispatch, businessId));
}

export async function handleCancelTask(
  { dispatch, businessId, taskId }:
    { dispatch: AppDispatch, businessId: string, taskId: string }) {
  await performTaskAction(async () => {
    const response = await dispatch(cancelTask(taskId));
    if (cancelTask.fulfilled.match(response)) {
      toast.success(i18n.t('tasks.notifications.cancelled', { defaultValue: 'Task cancelled' }));
    } else {
      toast.error(i18n.t('tasks.notifications.cancelFailed', { defaultValue: 'Failed to cancel task' }));
    }
  }, () => refreshTasks(dispatch, businessId));
}
