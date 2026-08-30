import { apiGet, withQuery } from '../api/client';

describe('apiGet', () => {
  it('builds dashboard URLs with the IPv4 API host', () => {
    expect(withQuery('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' })).toBe(
      'http://127.0.0.1:8000/api/dashboard/summary?start=2026-08-01&end=2026-08-31'
    );
  });

  it('sends X-API-Key header', async () => {
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
    expect(headers['X-API-Key']).toBeDefined();
  });

  it('includes the request URL in HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));

    await expect(apiGet('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' }))
      .rejects.toThrow('Request failed: 401 (http://127.0.0.1:8000/api/dashboard/summary?start=2026-08-01&end=2026-08-31)');
  });

  it('reports a useful network error without exposing secrets', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiGet('/api/dashboard/summary', { start: '2026-08-01', end: '2026-08-31' }))
      .rejects.toThrow('Network/CORS error while requesting http://127.0.0.1:8000/api/dashboard/summary');
  });
});
