import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ROUTES } from './config/routes';
import { AdminRoute, ProtectedRoute, PublicRoute } from './components/auth/AuthGuards';

import { FileQuestion } from 'lucide-react';
import { Loader } from './components/ui/loader';
import { Button } from './components/ui/button';

import RootLayout from './RootLayout';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';

import DashBoard from './pages/dashboard/Dashboard';
import Businesses from './pages/businesses/Businesses';
import Profile from './pages/profile/Profile';

import { useAppSelector } from './store';

function App() {
  const isAuthLoading = useAppSelector((state) => state.auth.loading);

  return (
    <BrowserRouter>
      {isAuthLoading && <Loader variant="fullscreen" />}
      <Routes>

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.AUTH.SIGN_IN} element={<SignIn />} />
          <Route path={ROUTES.AUTH.SIGN_UP} element={<SignUp />} />
          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD.HOME} replace />} />
            <Route path={ROUTES.DASHBOARD.HOME} element={<DashBoard />} />
            <Route element={<AdminRoute />}>
              <Route path={ROUTES.BUSINESSES.PAGE} element={<Businesses />} />
            </Route>
            <Route path={ROUTES.USER.PROFILE} element={<Profile />} />
          </Route>
        </Route>

        {/* 404 FallBack  */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">404 - Not Found</h1>
            <Button asChild variant="outline">
              <Link to={ROUTES.DASHBOARD.HOME}>Return Home</Link>
            </Button>
          </div>
        } />

      </Routes>
    </BrowserRouter >
  );
}

export default App;
