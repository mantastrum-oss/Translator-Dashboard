import { useState } from 'react';

import type { BlockedUserRow } from '../types/metrics';

const userIdPattern = /^\d{17,20}$/;

interface BlockedUsersPanelProps {
  rows: BlockedUserRow[];
  loading: boolean;
  error: string | null;
  onBlock: (userId: string) => Promise<void>;
  onUnblock: (userId: string) => Promise<void>;
}

export function BlockedUsersPanel({ rows, loading, error, onBlock, onUnblock }: BlockedUsersPanelProps) {
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function block() {
    if (!userIdPattern.test(userId)) {
      setActionError('Enter a valid Discord user ID (17 to 20 digits).');
      return;
    }
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      await onBlock(userId);
      setUserId('');
      setMessage('User blocked.');
    } catch (saveError) {
      setActionError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function unblock(id: string) {
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      await onUnblock(id);
      setMessage('User unblocked.');
    } catch (saveError) {
      setActionError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-panel animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h3 className="font-heading text-lg text-ink">Blocked Users</h3><p className="mt-1 text-sm text-ink/60">Blocked users cannot use the Translator bot.</p></div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="block-user-id">Discord user ID</label>
          <input id="block-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Discord user ID" inputMode="numeric" className="w-48 rounded-lg border border-ink/20 px-3 py-2 text-sm" />
          <button type="button" onClick={() => void block()} disabled={saving} className="rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Block user</button>
        </div>
      </div>
      {message && <p className="mt-3 text-sm text-accent">{message}</p>}
      {(error || actionError) && <p className="mt-3 text-sm text-coral">{error || actionError}</p>}
      {loading ? <p className="mt-4 text-sm text-ink/60">Loading blocked users...</p> : rows.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ink/10 text-left text-ink/70"><th className="py-2">User ID</th><th className="py-2">Date blocked</th><th className="py-2 text-right">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.user_id} className="border-b border-ink/5"><td className="py-2 font-mono text-xs">{row.user_id}</td><td className="py-2">{new Date(row.blocked_at).toLocaleString()}</td><td className="py-2 text-right"><button type="button" onClick={() => void unblock(row.user_id)} disabled={saving} className="rounded-md border border-accent/30 px-2 py-1 text-xs font-semibold text-accent hover:border-coral hover:text-coral disabled:opacity-50">Unblock</button></td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-ink/60">No blocked users.</p>}
    </section>
  );
}