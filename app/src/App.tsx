import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App
