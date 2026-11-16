import type { ReactNode } from 'react';

/** A white card with a title row; `aside` sits on the title row's right. */
export function Panel({ title, count, aside, children }: { title: string; count?: number; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg text-ink">
          {title}
          {count !== undefined && <span className="rounded-full bg-ink/5 px-2 py-0.5 font-body text-sm font-semibold text-ink/70">{count}</span>}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const th = 'py-2 font-medium';
export const thNum = 'py-2 pl-4 text-right font-medium';
export const td = 'py-1.5';
export const tdNum = 'py-1.5 pl-4 text-right tabular-nums';

export function Table({ head, children, empty }: { head: ReactNode; children: ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-ink/70">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <p className="py-6 text-center text-sm text-ink/70">{empty}</p>}
    </div>
  );
}

export function Pager({ page, pageSize, totalRows, onPageChange }: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(totalRows / pageSize));
  const button = 'rounded-md border border-ink/20 px-3 py-1.5 text-ink transition hover:border-ink/40 disabled:border-ink/10 disabled:text-ink/40';
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-ink/70">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={button}>
          ‹ Prev
        </button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pages} className={button}>
          Next ›
        </button>
      </div>
    </div>
  );
}

export function ShowAllButton({ expanded, total, onToggle }: { expanded: boolean; total: number; onToggle: () => void }) {
  return (
    <div className="mt-3 text-right">
      <button type="button" onClick={onToggle} className="text-sm font-medium text-ink/70 transition hover:text-ink">
        {expanded ? 'Show top 10' : `Show all ${total} ›`}
      </button>
    </div>
  );
}
