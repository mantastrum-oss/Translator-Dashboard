import { useCallback, useEffect, useState } from 'react';

import { apiGet } from '../api/client';
import type {
  OverviewResponse,
  PaginatedServersResponse,
  PaginatedUsersResponse
  ,DashboardSummaryResponse
  ,GuildsResponse
} from '../types/metrics';

interface MetricsState {
  overview: OverviewResponse | null;
  users: PaginatedUsersResponse | null;
  servers: PaginatedServersResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export function useMetrics(month: string, tz: string, usersPage = 1, serversPage = 1, pageSize = 10) {
  const [state, setState] = useState<MetricsState>({
    overview: null,
    users: null,
    servers: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const refresh = useCallback(async () => {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthEnd = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [summary, guilds, users] = await Promise.all([
        apiGet<DashboardSummaryResponse>('/api/dashboard/summary', { start: `${month}-01`, end: monthEnd }),
        apiGet<GuildsResponse>('/api/dashboard/guilds', { start: `${month}-01`, end: monthEnd }),
        apiGet<PaginatedUsersResponse>('/api/dashboard/users', { start: `${month}-01`, end: monthEnd, page: usersPage, page_size: pageSize })
      ]);

      const overview: OverviewResponse = {
        month,
        timezone: tz,
        generated_at: summary.generated_at,
        totals: {
          total_events: summary.total_translations,
          successful_events: summary.successful_translations,
          failed_events: summary.failed_translations,
          success_rate: summary.success_rate,
          total_characters: summary.total_characters,
          unique_users: summary.unique_users,
          unique_servers: summary.unique_guilds
        }
      };
      const servers: PaginatedServersResponse = {
        month, timezone: tz, page: 1, page_size: pageSize, total_rows: guilds.rows.length,
        rows: guilds.rows.map((row) => ({ guild_id: row.guild_id, translated_characters: row.characters, successful_events: row.successful, failed_events: row.translations - row.successful }))
      };

      setState({
        overview,
        users,
        servers,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (error as Error).message,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [month, tz, usersPage, serversPage, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
