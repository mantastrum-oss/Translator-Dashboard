import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { TimeseriesRow } from '../types/metrics';
import { formatNumber } from '../lib/format';
import { Panel } from './Panel';

// Axis and grid follow the theme through the --color-ink variable.
const ink = (alpha: number) => `rgb(var(--color-ink) / ${alpha})`;

function dayLabel(date: string) {
  return String(Number(date.slice(8, 10)));
}

/** Translations per UTC day; failed ones as a second, red series. */
export function TrendChart({ rows }: { rows: TimeseriesRow[] | null }) {
  return (
    <Panel
      title="Daily translations"
      aside={
        <span className="flex items-center gap-3 text-xs text-ink/70">
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-accent" aria-hidden="true" />
            All
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm bg-coral" aria-hidden="true" />
            Failed
          </span>
        </span>
      }
    >
      {rows === null ? (
        <p className="py-16 text-center text-sm text-ink/70">—</p>
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/70">No translations this month.</p>
      ) : (
        <div className="h-56" role="img" aria-label={`Daily translations, ${rows.length} days`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={ink(0.1)} />
              <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: ink(0.7), fontSize: 12 }} axisLine={{ stroke: ink(0.2) }} tickLine={false} minTickGap={8} />
              <YAxis allowDecimals={false} tick={{ fill: ink(0.7), fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => formatNumber(value)} />
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value), name === 'total' ? 'All' : 'Failed']}
                labelFormatter={(label: string) => label}
                contentStyle={{ background: 'rgb(var(--color-surf))', border: `1px solid ${ink(0.15)}`, borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" stroke="#1E847F" fill="#1E847F" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
              <Area type="monotone" dataKey="failed" stroke="rgb(var(--color-coral))" fill="rgb(var(--color-coral))" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
