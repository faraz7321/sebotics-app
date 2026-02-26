import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/auth.service';
import { type AuthResult, type AuthState, type LoginCreds, type RegisterCreds } from '../types/AuthTypes';
import { getErrorMessage } from './sliceHelpers';

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
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
