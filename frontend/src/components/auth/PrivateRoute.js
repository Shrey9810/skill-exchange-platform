import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If the initial authentication check is still in progress, show a loading spinner.
  // This prevents a brief flash of the login page for already authenticated users.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If loading is finished and there is no user, redirect to the login page.
  // We also pass the original location in the state, so after logging in,
  // the user can be redirected back to the page they were trying to access.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the child components (the protected page).
  return children;
};

export default PrivateRoute;
