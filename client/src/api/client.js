const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details || {}; }
}

export async function api(path, { method = 'GET', body, adminKey } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your connection.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.details);
  return data;
}
