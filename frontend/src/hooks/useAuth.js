import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// A custom hook to simplify the usage of the AuthContext.
// Instead of importing both useContext and AuthContext in every component,
// you can just import and call useAuth().
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
