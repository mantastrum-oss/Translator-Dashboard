import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { SourceRow } from '../types/metrics';

export function SourceChart({ rows }: { rows: SourceRow[] }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Translation sources</h3>
      {rows.length === 0 ? <p className="py-20 text-center text-sm text-ink/60">No source data in this range.</p> : <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" /><XAxis dataKey="source" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#D49A1A" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>}
    </section>
  );
}