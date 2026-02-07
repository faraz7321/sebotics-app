import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store';
import { ROUTES } from '@/config/routes';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { accessToken } = useAppSelector((state) => state.auth);
  
  // If NO token, redirect to Sign In
  if (!accessToken) {
    return <Navigate to={ROUTES.AUTH.SIGN_IN} replace />;
  }

  // Render children (if used as a wrapper) or Outlet (if used as a layout route)
  return children ? <>{children}</> : <Outlet />;
}

export function PublicRoute({ children }: { children?: React.ReactNode }) {
  const { accessToken } = useAppSelector((state) => state.auth);

  // If token EXISTS, redirect to Dashboard
  if (accessToken) {
    return <Navigate to={ROUTES.DASHBOARD.HOME} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}