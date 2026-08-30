import { render, screen, waitFor } from '@testing-library/react';

import App from '../App';

function mockResponse(url: string) {
  if (url.includes('/summary')) {
    return {
      start: '2026-08-01', end: '2026-08-31',
      generated_at: new Date().toISOString(),
      total_translations: 10, successful_translations: 8, failed_translations: 2,
      total_characters: 1000, success_rate: 0.8, unique_users: 4, unique_guilds: 3
    };
  }
  if (url.includes('/blocks')) return { page: 1, page_size: 50, total_rows: 0, rows: [] };
  if (url.includes('/users')) {
    return { month: '2026-08', timezone: 'UTC', page: 1, page_size: 10, total_rows: 1, rows: [{ user_id: '123456789012345678', translated_characters: 1000, successful_events: 8, failed_events: 1 }] };
  }
  if (url.includes('/guilds')) {
    return { month: '2026-08', timezone: 'UTC', page: 1, page_size: 10, total_rows: 1, rows: [{ guild_id: 'g1', translated_characters: 1000, successful_events: 8, failed_events: 1 }] };
  }
  if (url.includes('/errors')) {
    return { start: '2026-08-01', end: '2026-08-31', rows: [{ error_code: 'RATE_LIMIT', count: 2 }] };
  }
  if (url.includes('/languages')) return { start: '2026-08-01', end: '2026-08-31', rows: [{ source: 'es', count: 7 }] };
  if (url.includes('/timeseries')) return { start: '2026-08-01', end: '2026-08-31', rows: [] };
  return { start: '2026-08-01', end: '2026-08-31', rows: [{ guild_id: 'g1', translations: 8, successful: 8, characters: 1000 }] };
}

describe('DashboardPage', () => {
  it('renders key sections', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const payload = mockResponse(String(input));
      return Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Translator Analytics/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/^Users$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Servers$/i)).toBeInTheDocument();
    expect(screen.getByText(/Characters Translated/i)).toBeInTheDocument();
    expect(screen.queryByText(/Error Distribution/i)).not.toBeInTheDocument();
  });
});
