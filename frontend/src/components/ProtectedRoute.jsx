// File: src/components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const accountStatus = localStorage.getItem('account_status');
  const role = localStorage.getItem('user_role');

  useEffect(() => {
    if (accountStatus === 'expired') {
      // Clear session data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_full_name');
      localStorage.removeItem('account_status');
    }
  }, [accountStatus]);

  if (accountStatus === 'expired') {
    alert("⛔ Your subscription has expired. Please renew.");
    return <Navigate to="/account/renew-subscription" replace />;
  }

  if (!role) {
    alert("🔐 Please login to access this page.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;