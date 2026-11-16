import { useCallback, useEffect, useRef, useState } from 'react';

import { apiGet } from '../api/client';
import type {
  BillingResponse,
  DashboardSummaryResponse,
  GuildsResponse,
  PaginatedUsersResponse,
  RateLimitAbusersResponse,
  TimeseriesResponse,
  TopAbusersResponse
} from '../types/metrics';

interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Runs `load` whenever `key` changes and on `reload()`. Keeps the previous
 * data while reloading; a stale response (key changed meanwhile) is dropped.
 */
function useRequest<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<RequestState<T>>({ data: null, loading: true, error: null });
  const loadRef = useRef(load);
  loadRef.current = load;
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const ticket = ++latest.current;
    setState((current) => ({ ...current, loading: true }));
    try {
      const data = await loadRef.current();
      if (ticket === latest.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (ticket === latest.current) setState((current) => ({ ...current, loading: false, error: (error as Error).message }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [key, reload]);

  return { ...state, reload };
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end };
}

export interface MonthData {
  summary: DashboardSummaryResponse;
  timeseries: TimeseriesResponse;
  rateLimited: RateLimitAbusersResponse;
  topRequesters: TopAbusersResponse;
  /** null when the billing endpoint failed; the rest of the page still loads. */
  billing: BillingResponse | null;
  loadedAt: string;
}

export function useDashboardData({
  month,
  usersPage,
  usersQuery,
  serversPage,
  serversQuery,
  pageSize = 10
}: {
  month: string;
  usersPage: number;
  usersQuery: string;
  serversPage: number;
  serversQuery: string;
  pageSize?: number;
}) {
  const range = monthRange(month);

  const monthData = useRequest<MonthData>(month, async () => {
    const [summary, timeseries, rateLimited, topRequesters, billing] = await Promise.all([
      apiGet<DashboardSummaryResponse>('/api/dashboard/summary', range),
      apiGet<TimeseriesResponse>('/api/dashboard/timeseries', range),
      apiGet<RateLimitAbusersResponse>('/api/dashboard/rate-limit-abusers', { ...range, limit: 20 }),
      apiGet<TopAbusersResponse>('/api/dashboard/top-abusers', { ...range, limit: 20 }),
      apiGet<BillingResponse>('/api/dashboard/billing', { month }).catch(() => null)
    ]);
    return { summary, timeseries, rateLimited, topRequesters, billing, loadedAt: new Date().toISOString() };
  });

  const users = useRequest<PaginatedUsersResponse>(`${month}|${usersPage}|${usersQuery}`, () =>
    apiGet<PaginatedUsersResponse>('/api/dashboard/users', { ...range, page: usersPage, page_size: pageSize, ...(usersQuery ? { q: usersQuery } : {}) })
  );

  const servers = useRequest<GuildsResponse>(`${month}|${serversPage}|${serversQuery}`, () =>
    apiGet<GuildsResponse>('/api/dashboard/guilds', { ...range, page: serversPage, page_size: pageSize, ...(serversQuery ? { q: serversQuery } : {}) })
  );

  const { reload: reloadMonth } = monthData;
  const { reload: reloadUsers } = users;
  const { reload: reloadServers } = servers;
  const refresh = useCallback(async () => {
    await Promise.all([reloadMonth(), reloadUsers(), reloadServers()]);
  }, [reloadMonth, reloadUsers, reloadServers]);

  return {
    month: monthData.data,
    users: users.data,
    servers: servers.data,
    loading: monthData.loading || users.loading || servers.loading,
    error: monthData.error ?? users.error ?? servers.error,
    refresh
  };
}
