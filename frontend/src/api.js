/**
 * Base URL for the Express API. Vite exposes only variables prefixed with
 * `VITE_`; the fallback keeps the app usable with the documented local setup.
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** Read the current session token from browser storage. */
export const getToken = () => localStorage.getItem('token');

/** Persist a newly issued JWT for subsequent API requests. */
export const setToken = (t) => localStorage.setItem('token', t);

/** Remove the current session during logout or session cleanup. */
export const clearToken = () => localStorage.removeItem('token');

/**
 * Sends a JSON request to the API and attaches the current JWT when present.
 * The backend's `{ error }` response is converted into a regular Error so
 * feature components can display one consistent message to the user.
 *
 * @param {string} path API path below `/api`, such as `/notes`.
 * @param {{ method?: string, body?: object }} options Request method and JSON body.
 * @returns {Promise<object|null>} Parsed response data, or null for HTTP 204.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
