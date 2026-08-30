import { useEffect, useState } from 'react';

import { MetricCard } from '../components/MetricCard';
import { MonthPicker } from '../components/MonthPicker';
import { TopServersTable } from '../components/TopServersTable';
import { TopUsersTable } from '../components/TopUsersTable';
import { BlockedUsersPanel } from '../components/BlockedUsersPanel';
import { BotStatus } from '../components/BotStatus';
import { ConsolePanel } from '../components/ConsolePanel';
import { useMetrics } from '../hooks/useMetrics';
import { apiDelete, apiGet, apiPost } from '../api/client';
import type { BlockedUserRow, BlockedUsersResponse } from '../types/metrics';
import { currentMonthUTC, formatNumber } from '../lib/format';

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonthUTC());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRow[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState<string | null>(null);

  const { overview, users, servers, loading, error, refresh } = useMetrics(
    month,
    'UTC',
    1,
    1,
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

  return (
    <main className="min-h-screen bg-surf font-body text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-heading text-3xl sm:text-4xl">Translator Analytics</h1><BotStatus /></div>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <MonthPicker month={month} onChange={setMonth} />
            <button
              className="rounded-lg bg-accent px-4 py-2 text-white transition hover:bg-accent/90"
              onClick={() => refresh()}
            >
              Refresh Now
            </button>
            <ConsolePanel />
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
              <TopUsersTable rows={users?.rows ?? []} blockedUserIds={new Set(blockedUsers.map((row) => row.user_id))} onToggleBlock={toggleUserBlock} />
              <TopServersTable rows={servers?.rows ?? []} />
            </section>

            <BlockedUsersPanel rows={blockedUsers} loading={blockedLoading} error={blockedError} onBlock={async (userId) => { await apiPost('/api/blocks/users', { user_id: userId }); await loadBlockedUsers(); }} onUnblock={async (userId) => { await apiDelete(`/api/blocks/users/${userId}`); await loadBlockedUsers(); }} />
          </>
        )}
      </div>
    </main>
  );
}
