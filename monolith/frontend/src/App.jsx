// App.jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // ← Ajoute ça
import Dashboard from './Pages/DashBoard/dashboard.jsx';
import AppLayout from './components/Layout/AppLayout';
import AuthLayout from './components/Layout/AuthLayout.jsx';
import LoginForm from './components/Auth/LoginForm/LoginForm.jsx';
import RegisterForm from './components/Auth/RegisterForm/RegisterForm.jsx';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes Auth */}
          <Route path='auth' element={<AuthLayout />}>
            <Route path='login' element={<LoginForm />} />
            <Route path='register' element={<RegisterForm />} />
          </Route>

          {/* App Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
