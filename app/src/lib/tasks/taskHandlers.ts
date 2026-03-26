import { listTasks, createTask, executeTask, cancelTask, createTaskv3 } from "@/lib/slices/TaskSlice";
import { TaskType, RunType, RouteMode, type CreateTaskRequest, DispatchType } from "@/lib/types/TaskTypes";
import { PoiType, type PointOfInterest } from "@/lib/types/MapTypes";
import type { AppDispatch } from "@/store";
import { getCestTimestamp } from "@/lib/utils";

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

export async function handleCreateTask(
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

  const config = getTaskConfigByPoi(poi.type as PoiType);
  if (!config) {
    console.warn("Unsupported POI type for task creation");
    return;
  }

  const task: CreateTaskRequest = {
    name: `Go to ${poi.name || poi.id}`,
    robotId: robotId || "",
    businessId,
    ...config,
    taskPts: [
      {
        areaId: poi.areaId || "",
        poiId: poi.id,
        ...(isV3 && {
          ext: { name: poi.name || "", id: poi.id }
        })
      }
    ],
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      await dispatch(executeTask(response.payload.data.taskId));
    }
    await refreshTasks(dispatch, businessId);
  } else {
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
  // For multi-point tasks, we only support ShelfPoint POIs
  const hasNonShelfPoint = pois.some(p => p.type !== PoiType.ShelfPoint);
  if (hasNonShelfPoint) {
    console.warn("Multi-point tasks are only supported for ShelfPoint POIs");
    return;
  }

  const task: CreateTaskRequest = {
    name: `Drop Off: ${pois.map(p => p.name || p.id).join(' -> ')}`,
    robotId: robotId || "",
    businessId,
    // Hardcoded config for multi-point ShelfPoint tasks
    routeMode: RouteMode.ShortestDistanceRouting,
    taskType: TaskType.Factory,
    runType: RunType.Lifting,
    taskPts: pois.map(poi => ({
      areaId: poi.areaId || "",
      poiId: poi.id,
      ...(isV3 && {
        ext: { name: poi.name || "", id: poi.id }
      })
    })),
    ...(isV3 && { dispatchType: priority ? DispatchType.Ordinary : DispatchType.Queue })
  };

  const actionCreator = isV3 ? createTaskv3 : createTask;
  const response = await dispatch(actionCreator(task));

  if (actionCreator.fulfilled.match(response)) {
    if (execute) {
      await dispatch(executeTask(response.payload.data.taskId));
    }
    await refreshTasks(dispatch, businessId);
  } else {
    console.error(`Failed to create multi-point task ${isV3 ? 'v3' : 'v1'}`, response.payload);
  }
}

export async function handleExecuteTask(
  { dispatch, businessId, taskId }:
    { dispatch: AppDispatch, businessId: string, taskId: string }) {
  await performTaskAction(() => dispatch(executeTask(taskId)), () => refreshTasks(dispatch, businessId));
}

export async function handleCancelTask(
  { dispatch, businessId, taskId }:
    { dispatch: AppDispatch, businessId: string, taskId: string }) {
  await performTaskAction(() => dispatch(cancelTask(taskId)), () => refreshTasks(dispatch, businessId));
}

function getTaskConfigByPoi(type: PoiType) {
  const mapping: Record<string, { routeMode: RouteMode; taskType: TaskType; runType: RunType }> = {
    [PoiType.ChargingPile]: {
      routeMode: RouteMode.ShortestDistanceRouting,
      taskType: TaskType.ReturnToChargingStation,
      runType: RunType.ChargingStation,
    },
    [PoiType.TableNumber]: {
      routeMode: RouteMode.ShortestDistanceRouting,
      taskType: TaskType.Delivery,
      runType: RunType.DirectDelivery,
    },
    [PoiType.StandbyPoint]: {
      routeMode: RouteMode.ShortestDistanceRouting,
      taskType: TaskType.Restaurant,
      runType: RunType.Return,
    },
    // Single-point task config for ShelfPoint
    [PoiType.ShelfPoint]: {
      routeMode: RouteMode.ShortestDistanceRouting,
      taskType: TaskType.Delivery,
      runType: RunType.DirectDelivery,
    },
  };

  return mapping[type] || null;
}
