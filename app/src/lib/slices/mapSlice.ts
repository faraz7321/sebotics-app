import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';
import api from '../api/axios';
import { getErrorMessage } from './sliceHelpers';

import type { MapState } from '../types/MapTypes';

export const listPointsOfInterest = createAsyncThunk(
  "map/pois/list",
  async (businessId: string, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.MAP.POINTS_OF_INTEREST.LIST, {
        businessId,
      });

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list points of interest'));
    }
  }
);

const initialState: MapState = {
  loading: false,
  error: null,

  pointsOfInterest: []
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listPointsOfInterest.pending, (state) => {
        state.loading = true;
      })
      .addCase(listPointsOfInterest.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.pointsOfInterest = action.payload.data.list;
      })
      .addCase(listPointsOfInterest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export default mapSlice.reducer;
