import { useState } from 'react';

import { CheckIcon, CopyIcon } from './icons';

/** A Discord ID with a small copy button beside it. */
export function IdCell({ id, blocked = false }: { id: string; blocked?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the ID is still selectable.
    }
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="font-mono text-xs">{id}</span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? `Copied ${id}` : `Copy ${id}`}
        title={copied ? 'Copied' : 'Copy ID'}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink/60 transition hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {blocked && <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">Blocked</span>}
    </span>
  );
}
