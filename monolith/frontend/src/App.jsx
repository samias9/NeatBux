import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './Pages/DashBoard/dashboard.jsx';
import TransactionsPage from './Pages/Transactions/TransactionsPage.jsx';
import AppLayout from './components/Layout/AppLayout';
import AuthPage from './Pages/Auth/AuthPage.jsx';
import PrivateRoute from './components/PrivateRoute';

// Composant pour rediriger si déjà connecté
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Route d'authentification unique */}
      <Route path='/auth/*' element={
        <AuthRedirect>
          <AuthPage />
        </AuthRedirect>
      } />

      {/* Routes protégées de l'app */}
      <Route path="/" element={
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<TransactionsPage />} />
      </Route>

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
