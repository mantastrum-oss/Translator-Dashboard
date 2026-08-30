export interface OverviewResponse {
  month: string;
  timezone: string;
  generated_at: string;
  totals: {
    total_events: number;
    successful_events: number;
    failed_events: number;
    success_rate: number;
    total_characters: number;
    unique_users: number;
    unique_servers: number;
  };
}

export interface UserRow {
  user_id: string;
  translated_characters: number;
  successful_events: number;
  failed_events: number;
}

export interface ServerRow {
  guild_id: string;
  translated_characters: number;
  successful_events: number;
  failed_events: number;
}

export interface ErrorRow {
  error_code: string;
  count: number;
}

export interface LanguageRow {
  target_lang: string;
  successful_characters: number;
}

export interface PaginatedUsersResponse {
  month: string;
  timezone: string;
  page: number;
  page_size: number;
  total_rows: number;
  rows: UserRow[];
}

export interface PaginatedServersResponse {
  month: string;
  timezone: string;
  page: number;
  page_size: number;
  total_rows: number;
  rows: ServerRow[];
}

export interface ErrorsResponse {
  month: string;
  timezone: string;
  generated_at: string;
  rows: ErrorRow[];
}

export interface LanguagesResponse {
  month: string;
  timezone: string;
  generated_at: string;
  rows: LanguageRow[];
}

export interface TimeseriesRow {
  date: string;
  total: number;
  successful: number;
  failed: number;
  characters: number;
}

export interface TimeseriesResponse {
  start: string;
  end: string;
  rows: TimeseriesRow[];
}

export interface SourceRow {
  source: string;
  count: number;
}

export interface SourcesResponse {
  start: string;
  end: string;
  rows: SourceRow[];
}

export interface DashboardSummaryResponse {
  start: string;
  end: string;
  guild_id?: string | null;
  generated_at: string;
  total_translations: number;
  successful_translations: number;
  failed_translations: number;
  total_characters: number;
  success_rate: number;
  unique_users: number;
  unique_guilds: number;
}

export interface GuildsResponse {
  start: string;
  end: string;
  rows: Array<{ guild_id: string; translations: number; successful: number; characters: number }>;
}

export interface RateLimitAbuserRow {
  rank: number;
  user_id: string;
  blocked_attempts: number;
  guild_count: number;
  first_blocked_at: string;
  last_blocked_at: string;
}

export interface RateLimitAbusersResponse {
  start: string;
  end: string;
  rows: RateLimitAbuserRow[];
}

export interface TopAbuserRow {
  rank: number;
  user_id: string;
  request_count: number;
  successful_count: number;
  failed_count: number;
  success_rate: number;
}

export interface TopAbusersResponse {
  start: string;
  end: string;
  rows: TopAbuserRow[];
}

export interface BlockedUserRow {
  user_id: string;
  blocked_at: string;
}

export interface BlockedUsersResponse {
  rows: BlockedUserRow[];
  page: number;
  page_size: number;
  total_rows: number;
}
