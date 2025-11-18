import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading spinner here if you want
    return <div>Loading session...</div>;
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to the home page (which has the login form)
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())) {
    // If the user's role (case-insensitive) is not in the allowed list, redirect to home.
    // You could also redirect to a specific 'unauthorized' page.
    return <Navigate to="/" replace />;
  }

  // If authenticated and has the correct role (or no specific role is required), render the child components
  return <Outlet />;
};

export default ProtectedRoute;

