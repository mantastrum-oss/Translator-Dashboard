import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';

const USER = '123456789012345678';

function rateLimitedRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    rank: index + 1,
    user_id: `5000000000000000${String(index).padStart(2, '0')}`,
    blocked_attempts: 20 - index,
    attempted_characters: 1846,
    guild_count: 1,
    first_blocked_at: '2026-08-02T10:00:00Z',
    last_blocked_at: '2026-08-14T20:10:00Z'
  }));
}

let blockedRows: { user_id: string; blocked_at: string }[] = [];
let discordAvailable = false;

function mockResponse(url: string, init?: RequestInit) {
  if (url.includes('/api/blocks/users')) {
    if (init?.method === 'POST') {
      const { user_id } = JSON.parse(String(init.body)) as { user_id: string };
      blockedRows = [{ user_id, blocked_at: '2026-08-14T20:10:00Z' }];
      return { status: 'blocked' };
    }
    if (init?.method === 'DELETE') {
      blockedRows = [];
      return { status: 'unblocked' };
    }
    return { page: 1, page_size: 200, total_rows: blockedRows.length, rows: blockedRows };
  }
  if (url.includes('/summary')) {
    return {
      start: '2026-08-01', end: '2026-08-31', generated_at: new Date().toISOString(),
      total_translations: 5785, successful_translations: 5663, failed_translations: 122,
      total_characters: 622679, success_rate: 0.9789, unique_users: 400, unique_guilds: 132
    };
  }
  if (url.includes('/billing')) {
    return {
      month: '2026-08', available: true, free_monthly_chars: 15000, packs_sold: 5, revenue_cents: 2300,
      currency: 'eur', users_reached_free_limit: 12, users_reached_and_bought: 4
    };
  }
  if (url.includes('/dashboard/users')) {
    return { month: '2026-08', timezone: 'UTC', page: 1, page_size: 10, total_rows: 1, rows: [{ user_id: USER, translated_characters: 37256, successful_events: 8, failed_events: 7 }] };
  }
  if (url.includes('/guilds')) {
    return { start: '2026-08-01', end: '2026-08-31', page: 1, page_size: 10, total_rows: 1, rows: [{ guild_id: '900000000000000001', translations: 8, successful: 8, characters: 216289 }] };
  }
  if (url.includes('/timeseries')) return { start: '2026-08-01', end: '2026-08-31', rows: [] };
  if (url.includes('/rate-limit-abusers')) return { start: '2026-08-01', end: '2026-08-31', rows: rateLimitedRows(20) };
  if (url.includes('/top-abusers')) return { start: '2026-08-01', end: '2026-08-31', rows: [] };
  if (url.includes('/api/discord/users')) {
    if (!discordAvailable) return { available: false, users: {} };
    return {
      available: true,
      users: { [USER]: { id: USER, username: 'alice', display_name: 'Alice', avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png' } }
    };
  }
  if (url.includes('/bot/status')) return { status: 'ok', online: true, guild_count: 1, last_heartbeat_utc: null };
  return {};
}

function mockApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(mockResponse(String(input), init)), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    blockedRows = [];
    discordAvailable = false;
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the key numbers, formatted', async () => {
    mockApi();
    render(<App />);
    const kpis = within(screen.getByRole('region', { name: 'Key numbers' }));
    expect(await kpis.findByText('622,679')).toBeInTheDocument();
    expect(kpis.getByText('97.9%')).toBeInTheDocument();
    expect(kpis.getByText('122 failed')).toBeInTheDocument();
    expect(kpis.getByText('132 servers')).toBeInTheDocument();
    expect(kpis.getByText('€23')).toBeInTheDocument();
    expect(kpis.getByText('5 packs')).toBeInTheDocument();
    expect(await screen.findByText('37,256')).toBeInTheDocument();
    expect(screen.getByText('12 users')).toBeInTheDocument();
  });

  it('shows dashes and Retry instead of zeros when loading fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Retry' }, { timeout: 4000 })).toBeInTheDocument();
    const kpis = within(screen.getByRole('region', { name: 'Key numbers' }));
    expect(kpis.getAllByText('—').length).toBeGreaterThanOrEqual(4);
    expect(kpis.queryByText('0')).not.toBeInTheDocument();
  });

  it('blocks from the row menu and can undo it', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi();
    render(<App />);
    await screen.findByText('37,256');

    await user.click(screen.getAllByRole('button', { name: `Actions for ${USER}` })[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Block user' }));

    expect(await screen.findByText('User …5678 blocked.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/api/blocks/users') && init?.method === 'POST')).toBe(true);
    expect(await screen.findAllByText('Blocked')).not.toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith(`/api/blocks/users/${USER}`) && init?.method === 'DELETE')).toBe(true)
    );
  });

  it('searches users on the server', async () => {
    const fetchMock = mockApi();
    render(<App />);
    await screen.findByText('37,256');

    fireEvent.change(screen.getByPlaceholderText('Search all user IDs'), { target: { value: '5678' } });
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/dashboard/users') && String(url).includes('q=5678'))).toBe(true));
  });

  it('shows the top 10 rate-limited users until Show all', async () => {
    const user = userEvent.setup();
    mockApi();
    render(<App />);
    const show = await screen.findByRole('button', { name: 'Show all 20 ›' });
    expect(screen.queryByText('500000000000000015')).not.toBeInTheDocument();
    await user.click(show);
    expect(screen.getByText('500000000000000015')).toBeInTheDocument();
  });

  it('keeps the month in the picker', async () => {
    mockApi();
    render(<App />);
    const input = screen.getByLabelText('Month') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-09' } });
    expect(input.value).toBe('2026-09');
    await screen.findByText('37,256');
  });

  it('shows usernames and avatars when the API has them', async () => {
    const user = userEvent.setup();
    discordAvailable = true;
    const fetchMock = mockApi();
    render(<App />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(USER)).toBeInTheDocument();
    const lookup = fetchMock.mock.calls.map(([url]) => String(url)).find((url) => url.includes('/api/discord/users'));
    expect(lookup).toContain(USER);

    await user.click(screen.getAllByRole('button', { name: `Actions for ${USER}` })[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Block user' }));
    expect(await screen.findByText('Alice blocked.')).toBeInTheDocument();
  });
});
