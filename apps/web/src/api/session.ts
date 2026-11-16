// The dashboard session token (from POST /api/auth/login). Kept in localStorage
// so a reload stays logged in; reads and writes never throw (private windows).
const STORAGE_KEY = 'dashboardSession';

let token: string | null = readStored();
const listeners = new Set<() => void>();

function readStored(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; expiresAt?: number };
    if (!parsed.token || !parsed.expiresAt || parsed.expiresAt * 1000 <= Date.now()) return null;
    return parsed.token;
  } catch {
    return null;
  }
}

export function getSessionToken(): string | null {
  return token;
}

export function setSession(next: { token: string; expiresAt: number } | null): void {
  token = next?.token ?? null;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the session lasts until the tab closes.
  }
  listeners.forEach((listener) => listener());
}

export function onSessionChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
