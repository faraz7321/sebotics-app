import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';
import api from '../api/axios';
import { getErrorMessage } from './sliceHelpers';

import type { MapState } from '../types/MapTypes';

export const listAreas = createAsyncThunk(
  "map/areas/list",
  async (businessId: string, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.MAP.AREAS.LIST, {
        businessId,
      });

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list areas'));
    }
  }
);

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

export const getBaseMap = createAsyncThunk(
  "map/areas/base-map",
  async (areaId: string, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.MAP.AREAS.BASE_MAP.replace('{areaId}', areaId));

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to get base map'));
    }
  }
);

const initialState: MapState = {
  loading: false,
  error: null,

  pointsOfInterest: [],
  areas: [],

  baseMap: null,
  mapMeta: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    clearBaseMap: (state) => {
      state.baseMap = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List POIs
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

      // List Areas
      .addCase(listAreas.pending, (state) => {
        state.loading = true;
      })
      .addCase(listAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.areas = action.payload.data.list;
      })
      .addCase(listAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Base Map
      .addCase(getBaseMap.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBaseMap.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.baseMap = action.payload.base64;
        state.mapMeta = action.payload.mapMeta;
      })
      .addCase(getBaseMap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { clearBaseMap } = mapSlice.actions;
export default mapSlice.reducer;
