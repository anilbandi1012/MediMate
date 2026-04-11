// api.ts - Axios client for Pillio FastAPI backend
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const API_BASE_URL =  'https://medimate-k4yl.onrender.com/api/v1';

// ---------------- Token helpers ----------------
const getToken = (storageType: 'local' | 'session') =>
  (storageType === 'local' ? localStorage : sessionStorage).getItem('auth_token');

const getRefreshToken = (storageType: 'local' | 'session') =>
  (storageType === 'local' ? localStorage : sessionStorage).getItem('refresh_token');

const setTokens = (storageType: 'local' | 'session', accessToken: string, refreshToken: string) => {
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  storage.setItem('auth_token', accessToken);
  storage.setItem('refresh_token', refreshToken);
};

const clearTokens = (storageType: 'local' | 'session') => {
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  storage.removeItem('auth_token');
  storage.removeItem('refresh_token');
  storage.removeItem('user');
};

const getAuthStorageType = (): 'local' | 'session' | null => {
  if (localStorage.getItem('auth_token')) return 'local';
  if (sessionStorage.getItem('auth_token')) return 'session';
  return null;
};

// ---------------- Axios instance ----------------
const api = axios.create({
  baseURL: API_BASE_URL, // Already includes /api/v1
  headers: { 'Content-Type': 'application/json' },
});


// Add Authorization token to requests
api.interceptors.request.use((config) => {
  const storageType = getAuthStorageType();
  const token = storageType ? getToken(storageType) : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const storageType = getAuthStorageType();
      const refreshToken = storageType ? getRefreshToken(storageType) : null;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = response.data;
          if (storageType) setTokens(storageType, access_token, refresh_token);
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          if (storageType) clearTokens(storageType);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---------------- Helper to get error messages ----------------
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { detail?: string })?.detail || error.message || 'An error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
};

// ---------------- Authentication functions ----------------
export const login = async (email: string, password: string, rememberMe = false) => {
  const response = await api.post('/auth/login', { email, password });
  const { access_token, refresh_token, user } = response.data;
  setTokens(rememberMe ? 'local' : 'session', access_token, refresh_token);
  if (rememberMe) localStorage.setItem('user', JSON.stringify(user));
  else sessionStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const register = async (name: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// ---------------- Export default Axios instance ----------------
export default api;