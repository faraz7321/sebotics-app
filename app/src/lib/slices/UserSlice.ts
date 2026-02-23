import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';

import api from '../api/axios';
import type { UserState } from '../types/UserTypes';
import { getErrorMessage } from './sliceHelpers';

export const listUsers = createAsyncThunk(
  "users/list",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.LIST);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list users'));
    }
  }
);

export const fetchUser = createAsyncThunk(
  "users/me",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.ME);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to get user info'));
    }
  }
);

const initialState: UserState = {
  loading: false,
  error: null,

  user: null,

  users: []
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // List
      .addCase(listUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(listUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.users = action.payload;
      })
      .addCase(listUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Me
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export default userSlice.reducer;
