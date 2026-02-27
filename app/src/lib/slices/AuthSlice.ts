import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/auth.service';
import { type AuthResult, type AuthState, type LoginCreds, type RegisterCreds } from '../types/AuthTypes';
import { getErrorMessage } from './sliceHelpers';
import { API_ENDPOINTS } from '@/config/routes';

import api from '@/lib/api/axios';
import axios from 'axios';
import { API_BASE_URL } from '../runtime-config';

type ApiErrorPayload = {
  message?: string | string[];
};

function getApiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorPayload>(err)) {
    const message = err.response?.data?.message;

    if (Array.isArray(message)) {
      const joined = message.filter(Boolean).join(', ');
      if (joined) return joined;
    } else if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return getErrorMessage(err, fallback);
}

export const registerUser = createAsyncThunk<AuthResult, RegisterCreds, { rejectValue: string }>(
  "auth/register",
  async (credentials: RegisterCreds, thunkAPI) => {
    try {
      return await authService.register(credentials);
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Registration failed'));
    }
  }
);

export const loginUser = createAsyncThunk<AuthResult, LoginCreds, { rejectValue: string }>(
  "auth/login",
  async (credentials: LoginCreds, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Login failed'));
    }
  }
);

export const refreshToken = createAsyncThunk<string, void, { rejectValue: string }>(
  "auth/refresh",
  async (_, thunkAPI) => {
    try {
      return await authService.refreshToken();
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(err, 'Token refresh failed'));
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, thunkAPI) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getApiErrorMessage(err, 'Password change failed'));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, thunkAPI) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

      return response.data;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getApiErrorMessage(err, 'Failed to send reset OTP'));
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, resetToken, otp, newPassword }: { email: string; resetToken: string; otp: string; newPassword: string }, thunkAPI) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { email, resetToken, otp, newPassword });
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(getApiErrorMessage(err, 'Failed to reset password'));
    }
  }
);


const initialState: AuthState = {
  user: null,
  accessToken: null,

  resetToken: null,

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
    logout(state) {
      state.user = null;
      state.accessToken = '';
      localStorage.removeItem('keepLoggedIn');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResult>) => {
        const { user, accessToken } = action.payload;

        state.user = user;
        state.accessToken = accessToken;

        localStorage.setItem('keepLoggedIn', "true");

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
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResult>) => {
        const { user, accessToken } = action.payload;

        state.user = user;
        state.accessToken = accessToken;

        localStorage.setItem('keepLoggedIn', "true");

        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Refresh
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action: PayloadAction<string>) => {
        const accessToken = action.payload;

        state.accessToken = accessToken;

        localStorage.setItem('keepLoggedIn', "true");

        state.loading = false;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accessToken = '';
        state.user = null;
        localStorage.removeItem('keepLoggedIn');
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;

        state.resetToken = action.payload.resetToken;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetToken = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
