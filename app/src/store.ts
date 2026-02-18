import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

import authReducer from './lib/slices/AuthSlice';
import businessReducer from './lib/slices/BusinessSlice';
import userReducer from './lib/slices/UserSlice';
import robotReducer from './lib/slices/RobotSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    user: userReducer,
    robot: robotReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;