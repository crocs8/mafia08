import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('m42_token');
    const userData = localStorage.getItem('m42_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username) => {
    const res = await axios.post(`${API}/auth/guest`, { username });
    const { token, userId, username: uname } = res.data;
    localStorage.setItem('m42_token', token);
    localStorage.setItem('m42_user', JSON.stringify({ userId, username: uname }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ userId, username: uname });
    return { userId, username: uname };
  };

  const logout = () => {
    localStorage.removeItem('m42_token');
    localStorage.removeItem('m42_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const getToken = () => localStorage.getItem('m42_token');

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
