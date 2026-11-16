import type { ServerRow, UserRow } from '../types/metrics';
import { formatNumber } from '../lib/format';
import { IdCell } from './IdCell';
import { Pager, Panel, Table, td, tdNum, th, thNum } from './Panel';
import { RowMenu } from './RowMenu';
import { SearchInput } from './SearchInput';

interface Paged<Row> {
  rows: Row[];
  page: number;
  pageSize: number;
  totalRows: number;
  query: string;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
}

export function UsersTable({
  rows,
  page,
  pageSize,
  totalRows,
  query,
  onPageChange,
  onSearch,
  blockedIds,
  onToggleBlock
}: Paged<UserRow> & { blockedIds: Set<string>; onToggleBlock: (userId: string, block: boolean) => void }) {
  return (
    <Panel title="Users" count={totalRows}>
      <SearchInput label="Search all user IDs" value={query} onSearch={onSearch} />
      <Table
        empty={rows.length === 0 ? (query ? `No user ID contains “${query}”.` : 'No users this month.') : undefined}
        head={
          <>
            <th className={th}>User ID</th>
            <th className={thNum} aria-sort="descending">
              Chars ↓
            </th>
            <th className={thNum}>Failed</th>
            <th className="w-10" aria-label="Actions" />
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.user_id} className="border-b border-ink/5">
            <td className={td}>
              <IdCell id={row.user_id} blocked={blockedIds.has(row.user_id)} />
            </td>
            <td className={tdNum}>{formatNumber(row.translated_characters)}</td>
            <td className={tdNum}>{formatNumber(row.failed_events)}</td>
            <td className="py-1.5 text-right">
              <RowMenu userId={row.user_id} blocked={blockedIds.has(row.user_id)} onToggleBlock={onToggleBlock} />
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={onPageChange} />
    </Panel>
  );
}

export function ServersTable({ rows, page, pageSize, totalRows, query, onPageChange, onSearch }: Paged<ServerRow>) {
  return (
    <Panel title="Servers" count={totalRows}>
      <SearchInput label="Search all server IDs" value={query} onSearch={onSearch} />
      <Table
        empty={rows.length === 0 ? (query ? `No server ID contains “${query}”.` : 'No servers this month.') : undefined}
        head={
          <>
            <th className={th}>Server ID</th>
            <th className={thNum} aria-sort="descending">
              Chars ↓
            </th>
            <th className={thNum}>Failed</th>
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.guild_id} className="border-b border-ink/5">
            <td className={td}>
              <IdCell id={row.guild_id} />
            </td>
            <td className={tdNum}>{formatNumber(row.translated_characters)}</td>
            <td className={tdNum}>{formatNumber(row.failed_events)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={onPageChange} />
    </Panel>
  );
}
