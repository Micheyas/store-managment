import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('storeToken');
    const stored = localStorage.getItem('storeUser');
    if (token && stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      // Refresh from server
      api.get('/auth/me').then(r => {
        setUser(r.data);
        localStorage.setItem('storeUser', JSON.stringify(r.data));
      }).catch(() => {
        localStorage.removeItem('storeToken');
        localStorage.removeItem('storeUser');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('storeToken', res.data.token);
    localStorage.setItem('storeUser', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('storeToken');
    localStorage.removeItem('storeUser');
    setUser(null);
  };

  const can = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
