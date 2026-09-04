import { useMemo, useState } from 'react';

import type { UserRow } from '../types/metrics';
import { ConsolePanel } from './ConsolePanel';

interface TopUsersTableProps {
  rows: UserRow[];
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  blockedUserIds: Set<string>;
  onToggleBlock: (userId: string, blocked: boolean) => Promise<void>;
}

export function TopUsersTable({ rows, page, pageSize, totalRows, onPageChange, blockedUserIds, onToggleBlock }: TopUsersTableProps) {
  const [query, setQuery] = useState('');
  const [ascending, setAscending] = useState(false);
  const filteredRows = useMemo(() => rows.filter((row) => String(row.user_id ?? '').includes(query.trim())), [rows, query]);
  const sortedRows = [...filteredRows].sort((a, b) => ascending
    ? a.translated_characters - b.translated_characters
    : b.translated_characters - a.translated_characters);
  async function copyId(userId: string) { await navigator.clipboard?.writeText(userId); }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <div className="mb-3 flex items-center justify-start gap-3"><h3 className="font-heading text-lg text-ink">Users</h3><span className="rounded-full bg-accent/10 px-2.5 py-1 text-md font-semibold text-accent">{totalRows}</span></div>
      <input aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user IDs" className="mb-3 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/70">
              <th className="py-2">User ID</th>
              <th className="py-2"><button type="button" onClick={() => setAscending((value) => !value)}>Characters</button></th>
              <th className="py-2">Failed</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.user_id} className="border-b border-ink/5">
                <td className="py-2"><span className="mr-2 font-mono">{row.user_id}</span><button type="button" onClick={() => void copyId(row.user_id)} title="Copy user ID" aria-label={`Copy ${row.user_id}`} className="rounded-md border border-ink/20 px-2 py-1 text-xs font-semibold text-ink/70 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30">Copy</button></td>
                <td className="py-2">{row.translated_characters}</td>
                <td className="py-2">{row.failed_events}</td>
                <td className="py-2 text-right"><div className="flex justify-end gap-2"><ConsolePanel /><button type="button" onClick={() => void onToggleBlock(row.user_id, !blockedUserIds.has(row.user_id))} className={`rounded-md border px-2 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30 ${blockedUserIds.has(row.user_id) ? 'border-accent/30 text-accent hover:border-coral hover:text-coral' : 'border-coral/30 text-coral hover:bg-coral/10'}`}>{blockedUserIds.has(row.user_id) ? 'Unblock' : 'Block'}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-ink/70"><span>Page {page} of {Math.max(1, Math.ceil(totalRows / pageSize))}</span><div className="flex gap-2"><button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="rounded-md border border-ink/20 px-2 py-1 disabled:opacity-40">Previous</button><button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(totalRows / pageSize)} className="rounded-md border border-ink/20 px-2 py-1 disabled:opacity-40">Next</button></div></div>
    </section>
  );
}
