import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ROUTES } from './config/routes';
import { ProtectedRoute, PublicRoute } from './components/auth/AuthGuards';

import { FileQuestion } from 'lucide-react';
import { Button } from './components/ui/button';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';

import RootLayout from './RootLayout';
import DashBoard from './pages/dashboard/Dashboard';

function App() {

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.AUTH.SIGN_IN} element={<SignIn />} />
          <Route path={ROUTES.AUTH.SIGN_UP} element={<SignUp />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD.HOME} replace />} />
            <Route path={ROUTES.DASHBOARD.HOME} element={<DashBoard />} />
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
