import React, { createContext, useContext, useState, useEffect } from 'react';
import { queryClient } from '../../utils/tanstack';
import apiRequest from '../../utils/apiRequestUrl';

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = 'umi_auth_token';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  const login = (userData) => {
    setToken(userData.token);
  };

  const logout = () => {
    // Revoke the token server-side. Fire-and-forget: local sign-out must not wait on the network.
    const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (currentToken) {
      apiRequest
        .post('/management/logout', null, { headers: { Authorization: `Bearer ${currentToken}` } })
        .catch(() => {});
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('role');
    queryClient.clear();
    setToken(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
