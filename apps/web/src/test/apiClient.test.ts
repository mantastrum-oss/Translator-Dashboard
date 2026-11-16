import { apiGet, withQuery } from '../api/client';
import { getSessionToken, setSession } from '../api/session';

describe('apiGet', () => {
  it('builds dashboard URLs with the IPv4 API host', () => {
    expect(withQuery('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' })).toBe(
      'http://127.0.0.1:8000/api/dashboard/summary?start=2026-08-01&end=2026-08-31'
    );
  });

  it('sends the session token, never an API key', async () => {
    setSession({ token: 'session-token', expiresAt: Math.floor(Date.now() / 1000) + 3600 });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await apiGet('/v1/metrics/overview', { month: '2026-08', tz: 'UTC' });

    expect(fetchMock).toHaveBeenCalled();
    const [, options] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer session-token');
    expect(headers['X-API-Key']).toBeUndefined();
    expect(options.cache).toBe('no-store');
  });

  it('logs out on 401 without retrying', async () => {
    setSession({ token: 'expired', expiresAt: Math.floor(Date.now() / 1000) + 3600 });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));

    await expect(apiGet('/api/dashboard/summary', {})).rejects.toThrow('Session expired');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getSessionToken()).toBeNull();
  });

  it('includes the request URL in HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(apiGet('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' }))
      .rejects.toThrow('Request failed: 500 (http://127.0.0.1:8000/api/dashboard/summary?start=2026-08-01&end=2026-08-31)');
  });

  it('reports a useful network error without exposing secrets', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiGet('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' }))
      .rejects.toThrow('Network/CORS error while requesting http://127.0.0.1:8000/api/dashboard/summary');
  });
});
