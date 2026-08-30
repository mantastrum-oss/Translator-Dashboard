import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { LanguageRow } from '../types/metrics';

interface LanguageChartProps {
  rows: LanguageRow[];
}

export function LanguageChart({ rows }: LanguageChartProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <h3 className="mb-3 font-heading text-lg text-ink">Language Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e1e8" />
            <XAxis dataKey="target_lang" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="successful_characters" fill="#1E847F" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
