import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import apiClient from './services/apiClient';
import './index.css'
import App from './App';
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}


// Global latency interceptor for Axios
axios.interceptors.request.use(async (config) => {
  const latency = localStorage.getItem('dev_api_latency');
  if (latency && Number(latency) > 0) {
    await new Promise((resolve) => setTimeout(resolve, Number(latency)));
  }
  return config;
});

// Latency interceptor for centralized apiClient
apiClient.interceptors.request.use(async (config) => {
  const latency = localStorage.getItem('dev_api_latency');
  if (latency && Number(latency) > 0) {
    await new Promise((resolve) => setTimeout(resolve, Number(latency)));
  }
  return config;
});

// Global latency interceptor for Fetch API
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const latency = localStorage.getItem('dev_api_latency');
  if (latency && Number(latency) > 0) {
    await new Promise((resolve) => setTimeout(resolve, Number(latency)));
  }
  return originalFetch.apply(this, [input, init]);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
