import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';
import api from '../api/axios';
import { getErrorMessage } from './sliceHelpers';

import type { CreateTaskRequest, Task, TaskState } from '../types/TaskTypes';

export const listTasks = createAsyncThunk(
  API_ENDPOINTS.TASK.LIST,
  async ({ businessId, startTime, endTime }: { businessId: string, startTime: number, endTime: number }, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.TASK.LIST, {
        // default pagination parameters, can be adjusted as needed
        pageSize: 20,
        pageNum: 1,
        businessId: businessId,
        startTime: startTime,
        endTime: endTime
      });

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list tasks'));
    }
  }
);

export const getTask = createAsyncThunk(
  "task/get",
  async (taskId: string, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.TASK.GET.replace(`{taskId}`, taskId));

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to get task'));
    }
  }
);

export const createTask = createAsyncThunk(
  "task/create",
  async (task: CreateTaskRequest, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.TASK.CREATE, task);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to create task'));
    }
  }
);

export const createTaskv3 = createAsyncThunk(
  "task/createV3",
  async (task: CreateTaskRequest, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.TASK.CREATE_V3, task);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to create task'));
    }
  }
);

export const executeTask = createAsyncThunk(
  "task/execute",
  async (taskId: string, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.TASK.EXECUTE.replace(`{taskId}`, taskId));

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to execute task'));
    }
  }
);

export const cancelTask = createAsyncThunk(
  "task/cancel",
  async (taskId: string, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.TASK.CANCEL.replace(`{taskId}`, taskId));

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to cancel task'));
    }
  }
);

const initialState: TaskState = {
  loading: false,
  error: null,

  tasks: []
};

const TaskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    updateTask: (state, action) => {
      const { taskId, patch, actType } = action.payload;

      const index = state.tasks.findIndex(t => t.taskId === taskId);
      if (index === -1) return;

      const existing = state.tasks[index];

      state.tasks[index] = {
        ...existing,
        ...patch,

        // only update actType if provided
        actType: actType ?? existing.actType,
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(listTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const incoming = action.payload.data.list;

        state.tasks = incoming.map((task: Task) => {
          const existing = state.tasks.find(t => t.taskId === task.taskId);

          return {
            ...task,
            actType: existing?.actType ?? task.actType,
          };
        });
      })
      .addCase(getTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const task = action.payload.data;

        state.tasks = state.tasks.map(t => t.taskId === task.taskId ? task : t);
      })
      .addCase(getTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(listTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        console.log("Task created successfully:", action.payload.data);

        // state.tasks.push(action.payload.data);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create V3
      .addCase(createTaskv3.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTaskv3.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        console.log("Task created successfully (V3):", action.payload.data);
      })
      .addCase(createTaskv3.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Execute
      .addCase(executeTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(executeTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        console.log("Task executed successfully:", action.payload.message);
      })
      .addCase(executeTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel
      .addCase(cancelTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        console.log("Task cancelled successfully:", action.payload.message);
        // const cancelledTaskId = action.payload.data.taskId;
        // state.tasks = state.tasks.filter(task => task.taskId !== cancelledTaskId);
      })
      .addCase(cancelTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateTask } = TaskSlice.actions;
export default TaskSlice.reducer;
