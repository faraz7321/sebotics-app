import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store';
import { ROUTES } from '@/config/routes';
import { ROLES } from '@/config/constants';
import { Loader } from '../ui/loader';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { accessToken } = useAppSelector((state) => state.auth);
  
  // If NO token AND keepSignedIn is false, redirect to Sign In
  if (!accessToken && localStorage.getItem('keepLoggedIn') !== "true") {
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

export function AdminRoute() {
  const { user } = useAppSelector((state) => state.user);

  // We know ProtectedRoute already verified the token.
  if (!user) {
    return <Loader variant="fullscreen" />;
  }

  // 2. Now that we HAVE a user, check the role.
  if (user.role !== ROLES.ADMIN) {
    return <Navigate to={ROUTES.DASHBOARD.HOME} replace />;
  }

  return <Outlet />;
}