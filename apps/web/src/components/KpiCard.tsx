/** One headline number. `value` null = not loaded (shown as "—", never 0). */
export function KpiCard({ label, value, detail }: { label: string; value: string | null; detail?: string | null }) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4 shadow-panel">
      <p className="text-xs font-medium uppercase tracking-wider text-ink/70">{label}</p>
      <p className="mt-1 font-heading text-3xl tabular-nums text-ink">{value ?? '—'}</p>
      <p className="mt-1 min-h-5 text-sm text-ink/70">{value === null ? '' : detail}</p>
    </article>
  );
}
