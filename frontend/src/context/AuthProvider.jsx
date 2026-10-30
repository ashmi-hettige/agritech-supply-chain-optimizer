/**
 * Provides login, register and logout, and restores the session on page reload.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { tokenStore } from '../api/client';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // only wait for /auth/me when a token was saved earlier
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) {
      return;
    }
    api
      .get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  function saveSession(data) {
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return saveSession(response.data);
  }

  async function register(details) {
    const response = await api.post('/auth/register', details);
    return saveSession(response.data);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}