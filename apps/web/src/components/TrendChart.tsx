import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { TimeseriesRow } from '../types/metrics';

export function TrendChart({ rows }: { rows: TimeseriesRow[] }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise lg:col-span-2">
      <h3 className="mb-3 font-heading text-lg text-ink">Translations over time</h3>
      {rows.length === 0 ? <p className="py-20 text-center text-sm text-ink/60">No translations in this range.</p> : <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows}>
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E847F" stopOpacity={0.35} /><stop offset="95%" stopColor="#1E847F" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
            <XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip />
            <Area type="monotone" dataKey="total" stroke="#1E847F" fill="url(#trendFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>}
    </section>
  );
}