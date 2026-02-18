import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '@/config/routes';

import api from '../api/axios';
import type { UserState } from '../types/UserTypes';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
};

export const listUsers = createAsyncThunk(
  API_ENDPOINTS.USER.LIST,
  async (_, thunkAPI) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.LIST);

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Failed to list users'));
    }
  }
);


const initialState: UserState = {
  loading: false,
  error: null,

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
  },
});

export default userSlice.reducer;
