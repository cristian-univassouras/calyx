import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => clearToken().catch(() => {}))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { access_token } = await api.login(email, password);
    await setToken(access_token);
    const me = await api.me();
    setUser(me);
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
