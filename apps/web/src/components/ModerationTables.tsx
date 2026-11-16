import { useState } from 'react';

import type { RateLimitAbuserRow, TopAbuserRow } from '../types/metrics';
import { formatNumber, formatPercent, formatUtcShort } from '../lib/format';
import { UserCell } from './IdCell';
import { Panel, ShowAllButton, Table, td, tdNum, th, thNum } from './Panel';
import { RowMenu } from './RowMenu';

const TOP = 10;

interface ModerationProps<Row> {
  rows: Row[];
  blockedIds: Set<string>;
  onToggleBlock: (userId: string, block: boolean) => void;
}

/** Users who hit the bot's rate limit (also retries while the bot was down). */
export function RateLimitedTable({ rows, blockedIds, onToggleBlock }: ModerationProps<RateLimitAbuserRow>) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, TOP);
  return (
    <Panel title="Rate-limited">
      <Table
        empty={rows.length === 0 ? 'No rate-limited requests this month.' : undefined}
        head={
          <>
            <th className={th}>User</th>
            <th className={thNum} aria-sort="descending">
              Hits ↓
            </th>
            <th className={thNum}>Chars</th>
            <th className={thNum}>Last (UTC)</th>
            <th className="w-10" aria-label="Actions" />
          </>
        }
      >
        {shown.map((row) => (
          <tr key={row.user_id} className="border-b border-ink/5">
            <td className={td}>
              <UserCell id={row.user_id} blocked={blockedIds.has(row.user_id)} />
            </td>
            <td className={tdNum}>{formatNumber(row.blocked_attempts)}</td>
            <td className={tdNum}>{formatNumber(row.attempted_characters)}</td>
            <td className={`${tdNum} whitespace-nowrap`}>{formatUtcShort(row.last_blocked_at)}</td>
            <td className="py-1.5 text-right">
              <RowMenu userId={row.user_id} blocked={blockedIds.has(row.user_id)} onToggleBlock={onToggleBlock} />
            </td>
          </tr>
        ))}
      </Table>
      {rows.length > TOP && <ShowAllButton expanded={expanded} total={rows.length} onToggle={() => setExpanded((value) => !value)} />}
    </Panel>
  );
}

export function TopRequestersTable({ rows, blockedIds, onToggleBlock }: ModerationProps<TopAbuserRow>) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, TOP);
  return (
    <Panel title="Top requesters">
      <Table
        empty={rows.length === 0 ? 'No requests this month.' : undefined}
        head={
          <>
            <th className={th}>User</th>
            <th className={thNum} aria-sort="descending">
              Requests ↓
            </th>
            <th className={thNum}>Success</th>
            <th className="w-10" aria-label="Actions" />
          </>
        }
      >
        {shown.map((row) => (
          <tr key={row.user_id} className="border-b border-ink/5">
            <td className={td}>
              <UserCell id={row.user_id} blocked={blockedIds.has(row.user_id)} />
            </td>
            <td className={tdNum}>{formatNumber(row.request_count)}</td>
            <td className={tdNum}>{formatPercent(row.success_rate)}</td>
            <td className="py-1.5 text-right">
              <RowMenu userId={row.user_id} blocked={blockedIds.has(row.user_id)} onToggleBlock={onToggleBlock} />
            </td>
          </tr>
        ))}
      </Table>
      {rows.length > TOP && <ShowAllButton expanded={expanded} total={rows.length} onToggle={() => setExpanded((value) => !value)} />}
    </Panel>
  );
}
