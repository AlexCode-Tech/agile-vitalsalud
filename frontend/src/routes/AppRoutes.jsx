import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import PacienteDashboard from '../pages/PacienteDashboard';
import RecepcionDashboard from '../pages/RecepcionDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import MedicoDashboard from '../pages/MedicoDashboard';
import { getAuthenticatedDefaultRoute } from '../utils/roleRoutes';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user?.rol)) {
    return <Navigate to={getAuthenticatedDefaultRoute(user)} replace />;
  }

  return children;
};

export default function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getAuthenticatedDefaultRoute(user)} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/registro"
        element={
          isAuthenticated ? <Navigate to={getAuthenticatedDefaultRoute(user)} replace /> : <Registro />
        }
      />

      <Route
        path="/dashboard/paciente/*"
        element={
          <RoleRoute allowedRoles={['Paciente']}>
            <PacienteDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/medico/*"
        element={
          <RoleRoute allowedRoles={['Medico']}>
            <MedicoDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/recepcion/*"
        element={
          <RoleRoute allowedRoles={['Recepcionista']}>
            <RecepcionDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/admin/*"
        element={
          <RoleRoute allowedRoles={['Administrador']}>
            <AdminDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to={getAuthenticatedDefaultRoute(user)} replace /> : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? getAuthenticatedDefaultRoute(user) : '/login'} replace />} />
    </Routes>
  );
}
