import React, { createContext, useContext } from 'react';

// Temporary AuthContext to prevent import errors
const AuthContext = createContext(null);

export const useAuth = () => {
  return {
    user: null,
    isAuthenticated: false,
    loading: false
  };
};

export default AuthContext;