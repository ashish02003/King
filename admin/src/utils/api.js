// Central API base for the frontend.
// If `VITE_API_URL` is not set, we default to localhost backend (port 5000) for dev.
const fallbackLocal =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:5000/api'
      : '/api';

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : fallbackLocal;

export default API_BASE;

