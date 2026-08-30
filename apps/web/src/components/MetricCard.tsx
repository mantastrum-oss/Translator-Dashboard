interface MetricCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'warn';
}

export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  const toneClass =
    tone === 'accent'
      ? 'from-accent/20 to-white'
      : tone === 'warn'
        ? 'from-coral/20 to-white'
        : 'from-amber/20 to-white';

  return (
    <article className={`rounded-2xl bg-gradient-to-br ${toneClass} p-5 shadow-panel animate-rise`}>
      <p className="text-xs uppercase tracking-wider text-ink/70">{label}</p>
      <p className="mt-2 text-3xl font-heading text-ink">{value}</p>
    </article>
  );
}
