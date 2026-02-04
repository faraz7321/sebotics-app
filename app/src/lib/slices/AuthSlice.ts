import { createSlice } from '@reduxjs/toolkit';
import { type AuthUser } from '../types/AuthTypes';

const initialState: AuthUser = {
    id: '',
    email: '',
    name: '',
    token: '',

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
});

export default authSlice.reducer;