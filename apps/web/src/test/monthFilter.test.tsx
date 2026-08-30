import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../hooks/useMetrics', () => ({
  useMetrics: () => ({
    overview: {
      month: '2026-08',
      timezone: 'UTC',
      generated_at: new Date().toISOString(),
      totals: {
        total_events: 10,
        successful_events: 8,
        failed_events: 2,
        success_rate: 0.8,
        total_characters: 1000,
        unique_users: 4,
        unique_servers: 3
      }
    },
    users: { month: '2026-08', timezone: 'UTC', page: 1, page_size: 10, total_rows: 0, rows: [] },
    servers: { month: '2026-08', timezone: 'UTC', page: 1, page_size: 10, total_rows: 0, rows: [] },
    errors: { month: '2026-08', timezone: 'UTC', generated_at: new Date().toISOString(), rows: [] },
    languages: { month: '2026-08', timezone: 'UTC', generated_at: new Date().toISOString(), rows: [] },
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refresh: vi.fn()
  })
}));

import { DashboardPage } from '../pages/DashboardPage';

describe('Month filter', () => {
  it('updates selected month in state', () => {
    render(<DashboardPage />);

    const input = screen.getByLabelText(/Month/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-09' } });

    expect(input.value).toBe('2026-09');
  });
});
