import { listTasks, createTask, executeTask, cancelTask } from "@/lib/slices/TaskSlice";
import { TaskType, RunType, RouteMode, type CreateTaskRequest } from "@/lib/types/TaskTypes";
import type { PointOfInterest } from "@/lib/types/MapTypes";
import type { AppDispatch } from "@/store";

export async function refreshTasks(dispatch: AppDispatch, businessId: string) {
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  await dispatch(listTasks({
    businessId,
    startTime: twoHoursAgo,
    endTime: now
  }));
}

export async function performTaskAction(
  action: () => Promise<any>,
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
  dispatch: AppDispatch,
  businessId: string,
  poi: PointOfInterest,
  robotId?: string,
  execute: boolean = false
) {
  if (!robotId) {
    console.warn("No robot available");
    return;
  }

  const task: CreateTaskRequest = {
    name: `Task to ${poi.name || poi.id}`,
    robotId: robotId,
    routeMode: RouteMode.SequentialRouting,
    taskType: TaskType.Restaurant,
    runType: RunType.DirectDelivery,
    taskPts: [{ areaId: poi.areaId || "", poiId: poi.id }]
  };

  const response = await dispatch(createTask(task));

  if (createTask.fulfilled.match(response)) {
    if (execute) {
      await dispatch(executeTask(response.payload.data.taskId));
    }
    await refreshTasks(dispatch, businessId);
  } else {
    console.error("Failed to create task", response.payload);
  }
}

export async function handleExecuteTask(dispatch: AppDispatch, businessId: string, taskId: string) {
  await performTaskAction(() => dispatch(executeTask(taskId)), () => refreshTasks(dispatch, businessId));
}

export async function handleCancelTask(dispatch: AppDispatch, businessId: string, taskId: string) {
  await performTaskAction(() => dispatch(cancelTask(taskId)), () => refreshTasks(dispatch, businessId));
}