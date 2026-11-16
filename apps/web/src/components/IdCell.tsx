import { useState } from 'react';

import { useDiscordUser } from '../hooks/useDiscordUsers';
import { CheckIcon, CopyIcon } from './icons';

function CopyButton({ id }: { id: string }) {
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
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? `Copied ${id}` : `Copy ${id}`}
      title={copied ? 'Copied' : 'Copy ID'}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink/60 transition hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function BlockedBadge() {
  return <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">Blocked</span>;
}

/** A Discord ID with a copy button (servers, or users not looked up). */
export function IdCell({ id, blocked = false }: { id: string; blocked?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="font-mono text-xs">{id}</span>
      <CopyButton id={id} />
      {blocked && <BlockedBadge />}
    </span>
  );
}

/**
 * A user: avatar and display name with the ID under it, once the name has
 * been looked up from Discord; until then (or without one), the ID alone.
 */
export function UserCell({ id, blocked = false }: { id: string; blocked?: boolean }) {
  const user = useDiscordUser(id);
  if (!user) return <IdCell id={id} blocked={blocked} />;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={user.avatar_url} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" className="h-7 w-7 shrink-0 rounded-full bg-ink/10" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium" title={user.username === user.display_name ? user.username : `${user.display_name} (@${user.username})`}>
            {user.display_name}
          </span>
          {blocked && <BlockedBadge />}
        </span>
        <span className="inline-flex items-center whitespace-nowrap">
          <span className="font-mono text-xs text-ink/70">{id}</span>
          <CopyButton id={id} />
        </span>
      </span>
    </span>
  );
}
