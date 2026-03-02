import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';
import api from '../api/axios';
import { getErrorMessage } from './sliceHelpers';

import type { RobotState } from '../types/RobotTypes';

export const listRobots = createAsyncThunk(
  "robot/list",
  async (_, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.ROBOT.LIST);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list robots'));
    }
  }
);

export const getRobot = createAsyncThunk(
  "robot/get",
  async (robotId: string, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.ROBOT.GET.replace('{robotId}', robotId));

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to get robot'));
    }
  }
);

const initialState: RobotState = {
  loading: false,
  error: null,

  robots: []
};

const robotSlice = createSlice({
  name: 'robot',
  initialState,
  reducers: {
    updateRobot: (state, action) => {
      const { robotId, patch } = action.payload;

      const robot = state.robots.find(r => r.robotId === robotId);
      if (!robot) return;

      Object.assign(robot, patch);
    }
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listRobots.pending, (state) => {
        state.loading = true;
      })
      .addCase(listRobots.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.robots = action.payload.data.list;
      })
      .addCase(listRobots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getRobot.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRobot.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const robot = action.payload.data;

        state.robots = state.robots.map(r => r.robotId === robot.robotId ? robot : r);
      })
      .addCase(getRobot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { updateRobot } = robotSlice.actions;
export default robotSlice.reducer;
