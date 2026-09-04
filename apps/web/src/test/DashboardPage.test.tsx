import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    return { start: '2026-08-01', end: '2026-08-31', page: 1, page_size: 10, total_rows: 21, rows: [{ guild_id: 'g1', translations: 8, successful: 8, characters: 1000 }] };
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
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Next' })).toHaveLength(2);
    expect(screen.getByText(/Characters Translated/i)).toBeInTheDocument();
    expect(screen.queryByText(/Error Distribution/i)).not.toBeInTheDocument();
  });

  it('shows refresh progress until all metrics requests complete', async () => {
    const user = userEvent.setup();
    let fetchCount = 0;
    let releaseRefresh!: () => void;
    const refreshPending = new Promise<void>((resolve) => { releaseRefresh = resolve; });

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      fetchCount += 1;
      const response = () => new Response(JSON.stringify(mockResponse(String(input))), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      if (fetchCount > 6) return refreshPending.then(response);
      return Promise.resolve(response());
    });

    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh Now' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Refresh Now' }));

    expect(screen.getByRole('button', { name: /Refreshing/i })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Refreshing' })).toBeInTheDocument();

    releaseRefresh();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh Now' })).toBeEnabled());
    expect(screen.queryByRole('status', { name: 'Refreshing' })).not.toBeInTheDocument();
  });
});
