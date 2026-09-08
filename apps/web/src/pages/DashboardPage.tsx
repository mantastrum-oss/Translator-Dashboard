import { useEffect, useState } from 'react';

import { MetricCard } from '../components/MetricCard';
import { MonthPicker } from '../components/MonthPicker';
import { TopServersTable } from '../components/TopServersTable';
import { TopUsersTable } from '../components/TopUsersTable';
import { RateLimitAbusersTable } from '../components/RateLimitAbusersTable';
import { TopAbusersTable } from '../components/TopAbusersTable';
import { BlockedUsersPanel } from '../components/BlockedUsersPanel';
import { BotStatus } from '../components/BotStatus';
import { ThemeToggle } from '../components/ThemeToggle';
import { useMetrics } from '../hooks/useMetrics';
import { apiDelete, apiGet, apiPost } from '../api/client';
import type { BlockedUserRow, BlockedUsersResponse } from '../types/metrics';
import { currentMonthUTC, formatNumber } from '../lib/format';

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonthUTC());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRow[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [serversPage, setServersPage] = useState(1);

  const { overview, users, servers, rateLimitAbusers, topAbusers, loading, error, refresh } = useMetrics(
    month,
    'UTC',
    usersPage,
    serversPage,
    10
  );

  async function loadBlockedUsers() {
    setBlockedLoading(true);
    try {
      const response = await apiGet<BlockedUsersResponse>('/api/blocks/users', { page: 1, page_size: 50 });
      setBlockedUsers(response.rows);
      setBlockedError(null);
    } catch (loadError) {
      setBlockedError((loadError as Error).message);
    } finally {
      setBlockedLoading(false);
    }
  }

  useEffect(() => { void loadBlockedUsers(); }, []);

  async function toggleUserBlock(userId: string, blocked: boolean) {
    if (blocked) {
      await apiPost('/api/blocks/users', { user_id: userId });
    } else {
      await apiDelete(`/api/blocks/users/${userId}`);
    }
    await loadBlockedUsers();
  }

  function changeMonth(nextMonth: string) {
    setMonth(nextMonth);
    setUsersPage(1);
    setServersPage(1);
  }

  return (
    <main className="min-h-screen bg-surf font-body text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-heading text-3xl sm:text-4xl">Translator Analytics</h1><div className="flex items-center gap-3"><BotStatus /><ThemeToggle /></div></div>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <MonthPicker month={month} onChange={changeMonth} />
            <button
              type="button"
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-white transition hover:bg-accent/90 disabled:cursor-wait disabled:opacity-70"
              onClick={() => refresh()}
              disabled={loading}
              aria-busy={loading}
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" role="status" aria-label="Refreshing" />}
              <span>{loading ? 'Refreshing...' : 'Refresh Now'}</span>
            </button>
          </div>
        </header>

        {error && <div className="mb-4 rounded-xl bg-coral/15 p-3 text-sm text-coral">API error: {error}</div>}

        {loading && !overview ? (
          <p className="text-sm text-ink/70">Loading metrics...</p>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Characters Translated" value={formatNumber(overview?.totals.total_characters ?? 0)} tone="accent" />
              <MetricCard label="Total Translations" value={formatNumber(overview?.totals.total_events ?? 0)} tone="default" />
              <MetricCard label="Failed" value={formatNumber(overview?.totals.failed_events ?? 0)} tone="warn" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <TopUsersTable rows={users?.rows ?? []} page={users?.page ?? usersPage} pageSize={users?.page_size ?? 10} totalRows={users?.total_rows ?? 0} onPageChange={setUsersPage} blockedUserIds={new Set(blockedUsers.map((row) => row.user_id))} onToggleBlock={toggleUserBlock} />
              <TopServersTable rows={servers?.rows ?? []} page={servers?.page ?? serversPage} pageSize={servers?.page_size ?? 10} totalRows={servers?.total_rows ?? 0} onPageChange={setServersPage} />
            </section>

            <section className="mt-6">
              <RateLimitAbusersTable rows={rateLimitAbusers?.rows ?? []} />
            </section>

            <section className="mt-6">
              <TopAbusersTable rows={topAbusers?.rows ?? []} />
            </section>

            <BlockedUsersPanel rows={blockedUsers} loading={blockedLoading} error={blockedError} onBlock={async (userId) => { await apiPost('/api/blocks/users', { user_id: userId }); await loadBlockedUsers(); }} onUnblock={async (userId) => { await apiDelete(`/api/blocks/users/${userId}`); await loadBlockedUsers(); }} />
          </>
        )}
      </div>
    </main>
  );
}
