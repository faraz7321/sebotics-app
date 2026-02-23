import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';
import api from '../api/axios';
import { getErrorMessage } from './sliceHelpers';

import type { CreateTaskRequest, TaskState } from '../types/TaskTypes';

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

export const executeTask = createAsyncThunk(
  "task/execute",
  async (taskId: string, thunkAPI) => {
    try {
      const url = `${API_ENDPOINTS.TASK.EXECUTE}/${taskId}/execute`;
      const response = await api.post(url);

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
      const url = `${API_ENDPOINTS.TASK.CANCEL}/${taskId}/cancel`;

      const response = await api.post(url, { taskId });

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(listTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.tasks = action.payload.data.list;
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

export default TaskSlice.reducer;
