import type { BillingResponse } from '../types/metrics';
import { formatNumber, formatPercent } from '../lib/format';
import { Panel } from './Panel';

function users(count: number) {
  return `${formatNumber(count)} ${count === 1 ? 'user' : 'users'}`;
}

/**
 * Users who used up the free monthly characters and how many of them bought
 * a pack, plus everyone who bought one (some buy before reaching the limit).
 */
export function FreeLimitCard({ billing }: { billing: BillingResponse | null }) {
  const ready = billing?.available ?? false;
  const reached = billing?.users_reached_free_limit ?? 0;
  const reachedAndBought = billing?.users_reached_and_bought ?? 0;
  const value = 'font-heading text-2xl tabular-nums';
  return (
    <Panel title="Free limit">
      <dl className="grid gap-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink/70">Reached {billing ? `${formatNumber(billing.free_monthly_chars / 1000)}k` : 'limit'}</dt>
          <dd className={value}>{ready ? users(reached) : '—'}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pl-4">
          <dt className="text-ink/70">of them bought a pack</dt>
          <dd className={value}>
            {ready ? (
              <>
                {formatNumber(reachedAndBought)}
                {reached > 0 && <span className="ml-2 font-body text-sm text-ink/70">({formatPercent(reachedAndBought / reached)})</span>}
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-ink/10 pt-3">
          <dt className="text-ink/70">Bought a pack (anyone)</dt>
          <dd className={value}>{ready ? users(billing?.buyers ?? 0) : '—'}</dd>
        </div>
      </dl>
      {billing && !billing.available && <p className="mt-3 text-xs text-ink/70">Needs the Supabase connection.</p>}
    </Panel>
  );
}
