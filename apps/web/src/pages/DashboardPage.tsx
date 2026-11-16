import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlockedUsersPanel } from '../components/BlockedUsersPanel';
import { BotStatus } from '../components/BotStatus';
import { FreeLimitCard } from '../components/FreeLimitCard';
import { KpiCard } from '../components/KpiCard';
import { RateLimitedTable, TopRequestersTable } from '../components/ModerationTables';
import { MonthPicker } from '../components/MonthPicker';
import { RefreshIcon } from '../components/icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { Toast, type ToastMessage } from '../components/Toast';
import { TrendChart } from '../components/TrendChart';
import { ServersTable, UsersTable } from '../components/UsageTables';
import { useDashboardData } from '../hooks/useMetrics';
import { DiscordUsersContext, useDiscordUsers } from '../hooks/useDiscordUsers';
import { apiDelete, apiGet, apiPost, logout } from '../api/client';
import type { BlockedUserRow, BlockedUsersResponse } from '../types/metrics';
import { currentMonthUTC, formatMoney, formatNumber, formatPercent, formatUtcTime, shortId } from '../lib/format';

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonthUTC());
  const [usersPage, setUsersPage] = useState(1);
  const [usersQuery, setUsersQuery] = useState('');
  const [serversPage, setServersPage] = useState(1);
  const [serversQuery, setServersQuery] = useState('');

  const data = useDashboardData({ month, usersPage, usersQuery, serversPage, serversQuery });
  const summary = data.month?.summary ?? null;
  const billing = data.month?.billing ?? null;

  // Blocked users: all of them, so every table can mark blocked rows.
  const [blocked, setBlocked] = useState<BlockedUserRow[]>([]);
  const [blockedTotal, setBlockedTotal] = useState(0);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);
  // IDs with a block or unblock request in flight: ignore repeat clicks.
  const pending = useRef(new Set<string>());

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    try {
      const response = await apiGet<BlockedUsersResponse>('/api/blocks/users', { page: 1, page_size: 200 });
      setBlocked(response.rows);
      setBlockedTotal(response.total_rows);
      setBlockedError(null);
    } catch (error) {
      setBlockedError((error as Error).message);
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlocked();
  }, [loadBlocked]);

  const blockedIds = useMemo(() => new Set(blocked.map((row) => row.user_id)), [blocked]);

  // Every user ID on the page, for usernames and avatars.
  const visibleUserIds = [
    ...(data.users?.rows ?? []).map((row) => row.user_id),
    ...(data.month?.rateLimited.rows ?? []).map((row) => row.user_id),
    ...(data.month?.topRequesters.rows ?? []).map((row) => row.user_id),
    ...blocked.map((row) => row.user_id)
  ];
  const discordUsers = useDiscordUsers(visibleUserIds);

  const showToast = useCallback((text: string, undo?: () => void) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, undo });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  const setBlock = useCallback(
    async (userId: string, block: boolean, withUndo = true): Promise<void> => {
      if (pending.current.has(userId)) return;
      pending.current.add(userId);
      try {
        if (block) await apiPost('/api/blocks/users', { user_id: userId });
        else await apiDelete(`/api/blocks/users/${userId}`);
        await loadBlocked();
        const name = discordUsers.get(userId)?.display_name ?? `User ${shortId(userId)}`;
        showToast(
          `${name} ${block ? 'blocked' : 'unblocked'}.`,
          withUndo ? () => void setBlock(userId, !block, false) : undefined
        );
      } catch (error) {
        showToast(`Couldn't ${block ? 'block' : 'unblock'} ${shortId(userId)}: ${(error as Error).message}`);
        throw error;
      } finally {
        pending.current.delete(userId);
      }
    },
    [loadBlocked, showToast, discordUsers]
  );

  const toggleBlock = useCallback((userId: string, block: boolean) => {
    setBlock(userId, block).catch(() => undefined);
  }, [setBlock]);

  function changeMonth(nextMonth: string) {
    setMonth(nextMonth);
    setUsersPage(1);
    setServersPage(1);
  }

  const searchUsers = useCallback((query: string) => {
    setUsersQuery(query);
    setUsersPage(1);
  }, []);
  const searchServers = useCallback((query: string) => {
    setServersQuery(query);
    setServersPage(1);
  }, []);

  const refreshing = data.loading;

  return (
    <DiscordUsersContext.Provider value={discordUsers}>
    <main className="min-h-screen bg-surf font-body text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-heading text-3xl sm:text-4xl">Translator Analytics</h1>
            <div className="flex items-center gap-3">
              <BotStatus />
              <ThemeToggle />
              <button type="button" onClick={logout} className="text-sm text-ink/70 transition hover:text-ink">
                Log out
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthPicker month={month} onChange={changeMonth} />
            <span className="text-sm text-ink/70">{data.month ? `Updated ${formatUtcTime(data.month.loadedAt)} UTC` : ''}</span>
            <button
              type="button"
              onClick={() => void Promise.all([data.refresh(), loadBlocked()])}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label={refreshing ? 'Refreshing' : 'Refresh'}
              title="Refresh"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink/70 transition hover:border-ink/40 hover:text-ink disabled:cursor-wait"
            >
              <RefreshIcon spinning={refreshing} />
            </button>
          </div>
        </header>

        {data.error && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            <span>Couldn't load data. {data.error}</span>
            <button type="button" onClick={() => void data.refresh()} className="font-semibold text-coral hover:underline">
              Retry
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" aria-label="Key numbers">
          <KpiCard label="Characters" value={summary && formatNumber(summary.total_characters)} />
          <KpiCard label="Translations" value={summary && formatNumber(summary.total_translations)} />
          <KpiCard
            label="Success rate"
            value={summary && (summary.total_translations ? formatPercent(summary.success_rate) : '—')}
            detail={summary && `${formatNumber(summary.failed_translations)} failed`}
          />
          <KpiCard label="Users" value={summary && formatNumber(summary.unique_users)} detail={summary && `${formatNumber(summary.unique_guilds)} servers`} />
          <KpiCard
            label="Revenue"
            value={billing?.available ? formatMoney(billing.revenue_cents, billing.currency) : data.month ? '—' : null}
            detail={billing?.available ? `${formatNumber(billing.packs_sold)} ${billing.packs_sold === 1 ? 'pack' : 'packs'}` : null}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendChart rows={data.month?.timeseries.rows ?? null} />
          </div>
          <FreeLimitCard billing={billing} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <UsersTable
            rows={data.users?.rows ?? []}
            page={usersPage}
            pageSize={10}
            totalRows={data.users?.total_rows ?? 0}
            query={usersQuery}
            onPageChange={setUsersPage}
            onSearch={searchUsers}
            blockedIds={blockedIds}
            onToggleBlock={toggleBlock}
          />
          <ServersTable
            rows={(data.servers?.rows ?? []).map((row) => ({
              guild_id: row.guild_id,
              translated_characters: row.characters,
              successful_events: row.successful,
              failed_events: row.translations - row.successful
            }))}
            page={serversPage}
            pageSize={10}
            totalRows={data.servers?.total_rows ?? 0}
            query={serversQuery}
            onPageChange={setServersPage}
            onSearch={searchServers}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <RateLimitedTable rows={data.month?.rateLimited.rows ?? []} blockedIds={blockedIds} onToggleBlock={toggleBlock} />
          <TopRequestersTable rows={data.month?.topRequesters.rows ?? []} blockedIds={blockedIds} onToggleBlock={toggleBlock} />
        </section>

        <section className="mt-6">
          <BlockedUsersPanel
            rows={blocked}
            total={blockedTotal}
            loading={blockedLoading}
            error={blockedError}
            onBlock={(userId) => setBlock(userId, true)}
            onUnblock={(userId) => toggleBlock(userId, false)}
          />
        </section>
      </div>
      <Toast toast={toast} onClose={closeToast} />
    </main>
    </DiscordUsersContext.Provider>
  );
}
