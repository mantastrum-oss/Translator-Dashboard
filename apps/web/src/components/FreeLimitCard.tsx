import type { BillingResponse } from '../types/metrics';
import { formatNumber, formatPercent } from '../lib/format';
import { Panel } from './Panel';

/** How many users used up the free monthly characters, and how many of them bought a pack. */
export function FreeLimitCard({ billing }: { billing: BillingResponse | null }) {
  const ready = billing?.available ?? false;
  const reached = billing?.users_reached_free_limit ?? 0;
  const bought = billing?.users_reached_and_bought ?? 0;
  return (
    <Panel title="Free limit">
      <dl className="grid gap-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink/70">Reached {billing ? `${formatNumber(billing.free_monthly_chars / 1000)}k` : 'limit'}</dt>
          <dd className="font-heading text-2xl tabular-nums">{ready ? `${formatNumber(reached)} users` : '—'}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink/70">Bought a pack</dt>
          <dd className="font-heading text-2xl tabular-nums">
            {ready ? (
              <>
                {formatNumber(bought)}
                {reached > 0 && <span className="ml-2 font-body text-sm text-ink/70">({formatPercent(bought / reached)})</span>}
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      {billing && !billing.available && <p className="mt-3 text-xs text-ink/70">Needs the Supabase connection.</p>}
    </Panel>
  );
}
