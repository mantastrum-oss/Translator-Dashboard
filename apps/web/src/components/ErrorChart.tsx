import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { ErrorRow } from '../types/metrics';

const COLORS = ['#DA5A5A', '#D49A1A', '#1E847F', '#2B4E6B', '#6A8CAF'];

interface ErrorChartProps {
  rows: ErrorRow[];
}

export function ErrorChart({ rows }: ErrorChartProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Error Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="error_code" outerRadius={110} label>
              {rows.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
