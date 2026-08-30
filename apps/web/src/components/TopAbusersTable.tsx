import type { TopAbuserRow } from '../types/metrics';
import { formatNumber } from '../lib/format';

interface TopAbusersTableProps {
  rows: TopAbuserRow[];
}

export function TopAbusersTable({ rows }: TopAbusersTableProps) {
  async function copyId(userId: string) { await navigator.clipboard?.writeText(userId); }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Top Requesters</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/70">
              <th className="py-2">Rank</th>
              <th className="py-2">User ID</th>
              <th className="py-2">Requests</th>
              <th className="py-2">Success Rate</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-ink/50">No requests in this range</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.user_id} className="border-b border-ink/5">
                  <td className="py-2">{row.rank}</td>
                  <td className="py-2"><span className="mr-2 font-mono">{row.user_id}</span></td>
                  <td className="py-2">{formatNumber(row.request_count)}</td>
                  <td className="py-2">{(row.success_rate * 100).toFixed(1)}%</td>
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
