import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './config/routes';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import DashBoard from './pages/dashboard/Dashboard';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.AUTH.SIGN_IN} element={<SignIn />} />
        <Route path={ROUTES.AUTH.SIGN_UP} element={<SignUp />} />

        <Route path={ROUTES.DASHBOARD.HOME} element={<DashBoard />} />
      
    </Routes>
    </BrowserRouter >
  );
}

export default App
