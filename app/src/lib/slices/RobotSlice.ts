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

const initialState: RobotState = {
  loading: false,
  error: null,

  robots: []
};

const robotSlice = createSlice({
  name: 'robot',
  initialState,
  reducers: {},
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
  },
});

export default robotSlice.reducer;
