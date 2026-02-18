import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';

import api from '../api/axios';
import type { BusinessState } from '../types/BusinessTypes';
import { getErrorMessage } from './sliceHelpers';

export const listBusinesses = createAsyncThunk(
  API_ENDPOINTS.BUSINESS.LIST,
  async (_, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.BUSINESS.LIST);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list businesses'));
    }
  }
);

export const assignBusiness = createAsyncThunk(
  API_ENDPOINTS.BUSINESS.ASSIGN,
  async ({ businessId, userId }: { businessId: string; userId: string }, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.BUSINESS.ASSIGN, {
        businessId,
        userId,
      })

      return response.data;
    }
    catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to assign business'));
    }
  }
);

export const unassignBusiness = createAsyncThunk(
  API_ENDPOINTS.BUSINESS.UNASSIGN,
  async ({ businessId, userId }: { businessId: string; userId: string }, thunkAPI) => {
    try {
      const response = await api.post(API_ENDPOINTS.BUSINESS.UNASSIGN, {
        businessId,
        userId,
      })

      return response.data;
    }
    catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to unassign business'));
    }
  }
);

const initialState: BusinessState = {
  loading: false,
  error: null,

  selectedbusinessId: null,

  businesses: []
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setSelectedBusinessId(state, action) {
      state.selectedbusinessId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listBusinesses.pending, (state) => {
        state.loading = true;
      })
      .addCase(listBusinesses.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.businesses = action.payload.data.lists;
      })
      .addCase(listBusinesses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assign
      .addCase(assignBusiness.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.businesses = state.businesses.map((b) =>
          b.id === action.payload.businessId 
            ? { ...b, userIds: [...b.userIds, action.payload.userId] }
            : b
        );
      })
      .addCase(assignBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Unassign
      .addCase(unassignBusiness.pending, (state) => {
        state.loading = true;
      })
      .addCase(unassignBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.businesses = state.businesses.map((b) =>
          b.id === action.payload.businessId 
            ? { ...b, userIds: b.userIds.filter(id => id !== action.payload.userId) }
            : b
        );
      })
      .addCase(unassignBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { setSelectedBusinessId } = businessSlice.actions;
export default businessSlice.reducer;
