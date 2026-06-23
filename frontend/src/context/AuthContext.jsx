import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('vitalsalud_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vitalsalud_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginUser = (tokenVal, userVal) => {
    localStorage.setItem('vitalsalud_token', tokenVal);
    localStorage.setItem('vitalsalud_user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const logoutUser = () => {
    localStorage.removeItem('vitalsalud_token');
    localStorage.removeItem('vitalsalud_user');
    localStorage.removeItem('vitalsalud_countdown_expire'); // Limpiar temporizador también
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserVal) => {
    const newUserData = { ...user, ...updatedUserVal };
    localStorage.setItem('vitalsalud_user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loginUser, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
