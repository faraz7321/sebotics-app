import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/auth.service';
import { API_ENDPOINTS } from '@/config/routes';
import { type AuthCreds, type AuthState } from '../types/AuthTypes';

export const registerUser = createAsyncThunk(
  API_ENDPOINTS.AUTH.REGISTER,
  async (credentials: AuthCreds, thunkAPI) => {
    try {
      return await authService.register(credentials);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  API_ENDPOINTS.AUTH.LOGIN,
  async (credentials: AuthCreds, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const initialState: AuthState = {
    user: null,
    accessToken: '',

    loading: false,
    error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
    extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
        const { user, accessToken } = action.payload;

        state.user = user;
        state.accessToken = accessToken;

        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        const { user, accessToken } = action.payload;

        state.user = user;
        state.accessToken = accessToken;

        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export default authSlice.reducer;