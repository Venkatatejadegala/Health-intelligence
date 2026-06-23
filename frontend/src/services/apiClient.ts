import axios from 'axios';

// Pull backend URL from environment variables with safe defaults
const API_URL = import.meta.env.VITE_API_URL?.replace(/['"]/g, '').trim() || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically append JWT authorization headers for local relative requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Only inject token if request is relative or specifically target local API (no external protocol)
    if (token && config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getErrorMessage = (error: any, fallback: string = 'Something went wrong. Please try again.'): string => {
  if (error && typeof error === 'object') {
    // 1. Try to extract specific message provided by the server response
    const serverError = error.response?.data?.error;
    if (typeof serverError === 'string') {
      return serverError;
    }
    if (serverError && typeof serverError === 'object' && typeof serverError.message === 'string') {
      return serverError.message;
    }
    if (typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }

    // 2. Fall back to standard professional HTTP status message mapping
    const status = error.response?.status;
    if (status) {
      switch (status) {
        case 400:
          return "Invalid request parameters. Please verify your entries and try again.";
        case 401:
          return "Your session has expired. Please log in again.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "Requested information was not found.";
        case 429:
          return "Too many requests. Please try again later.";
        case 500:
          return "Internal server error. Please try again.";
        default:
          break;
      }
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return "Network connection error. Please verify your internet connection.";
    }
  }
  return fallback;
};

import toast from 'react-hot-toast';

// Response Interceptor: Manage common errors (Unauthorized / Expirations / Rate Limits)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code;

      if (status === 429) {
        const message = getErrorMessage(error, 'Too many requests. Please try again later.');
        toast.error(message);
      } else if (status === 403 && errorCode === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email address first.');
      } else if (status === 403 && errorCode === 'ACCOUNT_SUSPENDED') {
        toast.error('Your account has been suspended.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 401 || status === 403) {
        console.warn('Authentication token expired or unauthorized. Logging out.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Force redirect to login page if currently browsing protected areas
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
