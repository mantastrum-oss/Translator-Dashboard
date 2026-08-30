import type { RateLimitAbuserRow } from '../types/metrics';
import { formatNumber } from '../lib/format';

interface RateLimitAbusersTableProps {
  rows: RateLimitAbuserRow[];
}

export function RateLimitAbusersTable({ rows }: RateLimitAbusersTableProps) {
  async function copyId(userId: string) { await navigator.clipboard?.writeText(userId); }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Rate-Limit Abusers</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/70">
              <th className="py-2">Rank</th>
              <th className="py-2">User ID</th>
              <th className="py-2">Blocked Attempts</th>
              <th className="py-2">Guilds</th>
              <th className="py-2">First Seen</th>
              <th className="py-2">Last Seen</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="py-4 text-center text-ink/50">No rate-limited attempts in this range</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.user_id} className="border-b border-ink/5">
                  <td className="py-2">{row.rank}</td>
                  <td className="py-2"><span className="mr-2 font-mono">{row.user_id}</span></td>
                  <td className="py-2">{formatNumber(row.blocked_attempts)}</td>
                  <td className="py-2">{formatNumber(row.guild_count)}</td>
                  <td className="py-2">{new Date(row.first_blocked_at).toLocaleString()}</td>
                  <td className="py-2">{new Date(row.last_blocked_at).toLocaleString()}</td>
                  <td className="py-2 text-right"><button type="button" onClick={() => void copyId(row.user_id)} title="Copy user ID" aria-label={`Copy ${row.user_id}`} className="rounded-md border border-ink/20 px-2 py-1 text-xs font-semibold text-ink/70 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30">Copy</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
