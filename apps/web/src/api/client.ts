export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const DASHBOARD_API_KEY = import.meta.env.VITE_DASHBOARD_API_KEY ?? '';

export function withQuery(path: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  return `${API_BASE_URL}${path}?${search.toString()}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest<T>(url: string, init: RequestInit): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DASHBOARD_API_KEY, ...init.headers }
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status} (${url})`);
      return (await response.json()) as T;
    } catch (error) {
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

export async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = withQuery(path, params);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': DASHBOARD_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} (${url})`);
      }

      return (await response.json()) as T;
    } catch (error) {
      const message = error instanceof TypeError
        ? `Network/CORS error while requesting ${url}. Confirm the API is running at ${API_BASE_URL}.`
        : (error as Error).message;
      lastError = new Error(message);
      if (attempt < 2) {
        await sleep((attempt + 1) * 300);
      }
    }
  }

  throw lastError ?? new Error('Unknown request error');
}
