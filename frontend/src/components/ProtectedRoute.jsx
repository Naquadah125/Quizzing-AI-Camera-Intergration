import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
};

export default ProtectedRoute;
