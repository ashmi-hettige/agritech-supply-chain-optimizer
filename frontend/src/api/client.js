/**
 * Axios client for the Spring Boot API. Adds the JWT to every request.
 * @author Ashmi Hettige
 */
import axios from 'axios';

const TOKEN_KEY = 'goviroute_token';

// localStorage can throw in private browsing, so every access is guarded
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage blocked: the user stays logged in until the tab closes
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // nothing to clear
    }
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// an expired or invalid token logs the user out everywhere in the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot reach the server. Please check that the backend is running.';
  }
  return error.response.data?.message ?? 'Something went wrong. Please try again.';
}

export function getFieldErrors(error) {
  return error.response?.data?.fieldErrors ?? {};
}

export default api;