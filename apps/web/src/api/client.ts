import { getSessionToken, setSession } from './session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired. Log in again.');
    this.name = 'UnauthorizedError';
  }
}

export function withQuery(path: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  return `${API_BASE_URL}${path}?${search.toString()}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(url: string, init: RequestInit): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init.headers }
      });
      if (response.status === 401) {
        // Expired or revoked session: back to the login screen, no retries.
        setSession(null);
        throw new UnauthorizedError();
      }
      if (!response.ok) throw new Error(`Request failed: ${response.status} (${url})`);
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      lastError = error instanceof TypeError
        ? new Error(`Network/CORS error while requesting ${url}. Confirm the API is running at ${API_BASE_URL}.`)
        : (error as Error);
      if (attempt < 2) await sleep((attempt + 1) * 300);
    }
  }
  throw lastError ?? new Error('Unknown request error');
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(`${API_BASE_URL}${path}`, { method: 'POST', body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(`${API_BASE_URL}${path}`, { method: 'DELETE' });
}

export function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  return apiRequest<T>(withQuery(path, params), { method: 'GET', cache: 'no-store' });
}

export type LoginResult = 'ok' | 'wrong_password' | 'too_many_attempts' | 'unavailable';

/** Exchanges the dashboard password for a session token. */
export async function login(password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  } catch {
    return 'unavailable';
  }
  if (response.status === 401) return 'wrong_password';
  if (response.status === 429) return 'too_many_attempts';
  if (!response.ok) return 'unavailable';
  const body = (await response.json()) as { token: string; expires_at: number };
  setSession({ token: body.token, expiresAt: body.expires_at });
  return 'ok';
}

export function logout(): void {
  setSession(null);
}
