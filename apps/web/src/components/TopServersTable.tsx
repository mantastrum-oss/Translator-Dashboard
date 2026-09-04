import { useMemo, useState } from 'react';

import type { ServerRow } from '../types/metrics';

interface TopServersTableProps {
  rows: ServerRow[];
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function TopServersTable({ rows, page, pageSize, totalRows, onPageChange }: TopServersTableProps) {
  const [query, setQuery] = useState('');
  const [ascending, setAscending] = useState(false);
  const filteredRows = useMemo(() => rows.filter((row) => String(row.guild_id ?? '').includes(query.trim())), [rows, query]);
  const sortedRows = [...filteredRows].sort((a, b) => ascending
    ? a.translated_characters - b.translated_characters
    : b.translated_characters - a.translated_characters);
  async function copyId(guildId: string) { await navigator.clipboard?.writeText(guildId); }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <div className="mb-3 flex items-center justify-start gap-3"><h3 className="font-heading text-lg text-ink">Servers</h3><span className="rounded-full bg-accent/10 px-2.5 py-1 text-md font-semibold text-accent">{totalRows}</span></div>
      <input aria-label="Search servers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search server IDs" className="mb-3 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/70">
              <th className="py-2">Server ID</th>
              <th className="py-2"><button type="button" onClick={() => setAscending((value) => !value)}>Characters</button></th>
              <th className="py-2">Failed</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.guild_id} className="border-b border-ink/5">
                <td className="py-2 pr-2"><span className="mr-2 font-mono">{row.guild_id}</span><button type="button" onClick={() => void copyId(row.guild_id)} title="Copy server ID" aria-label={`Copy ${row.guild_id}`} className="rounded-md border border-ink/20 px-2 py-1 text-xs font-semibold text-ink/70 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30">Copy</button></td>
                <td className="py-2">{row.translated_characters}</td>
                <td className="py-2">{row.failed_events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-ink/70"><span>Page {page} of {Math.max(1, Math.ceil(totalRows / pageSize))}</span><div className="flex gap-2"><button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="rounded-md border border-ink/20 px-2 py-1 disabled:opacity-40">Previous</button><button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(totalRows / pageSize)} className="rounded-md border border-ink/20 px-2 py-1 disabled:opacity-40">Next</button></div></div>
    </section>
  );
}
