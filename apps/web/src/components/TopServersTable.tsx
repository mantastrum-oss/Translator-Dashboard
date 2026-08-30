import { useMemo, useState } from 'react';

import type { ServerRow } from '../types/metrics';
import { ConsolePanel } from './ConsolePanel';

interface TopServersTableProps {
  rows: ServerRow[];
}

export function TopServersTable({ rows }: TopServersTableProps) {
  const [query, setQuery] = useState('');
  const [ascending, setAscending] = useState(false);
  const filteredRows = useMemo(() => rows.filter((row) => String(row.guild_id ?? '').includes(query.trim())), [rows, query]);
  const sortedRows = [...filteredRows].sort((a, b) => ascending
    ? a.translated_characters - b.translated_characters
    : b.translated_characters - a.translated_characters);
  async function copyId(guildId: string) { await navigator.clipboard?.writeText(guildId); }
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Servers</h3>
      <input aria-label="Search servers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search server IDs" className="mb-3 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/70">
              <th className="py-2">Server ID</th>
              <th className="py-2"><button type="button" onClick={() => setAscending((value) => !value)}>Characters</button></th>
              <th className="py-2">Failed</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.guild_id} className="border-b border-ink/5">
                <td className="py-2 pr-2"><span className="mr-2 font-mono">{row.guild_id}</span><button type="button" onClick={() => void copyId(row.guild_id)} title="Copy server ID" aria-label={`Copy ${row.guild_id}`} className="rounded-md border border-ink/20 px-2 py-1 text-xs font-semibold text-ink/70 transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30">Copy</button></td>
                <td className="py-2">{row.translated_characters}</td>
                <td className="py-2">{row.failed_events}</td>
                <td className="py-2 text-right"><ConsolePanel /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
