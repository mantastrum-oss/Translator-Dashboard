import { useState, type FormEvent } from 'react';

import type { BlockedUserRow } from '../types/metrics';
import { formatUtcShort } from '../lib/format';
import { IdCell } from './IdCell';
import { Panel, Table, td, th, thNum } from './Panel';

const userIdPattern = /^\d{17,20}$/;

interface BlockedUsersPanelProps {
  rows: BlockedUserRow[];
  total: number;
  loading: boolean;
  error: string | null;
  onBlock: (userId: string) => Promise<void>;
  onUnblock: (userId: string) => void;
}

/** Blocked users; blocking by ID hides behind "+ Block by ID" (rarely needed). */
export function BlockedUsersPanel({ rows, total, loading, error, onBlock, onUnblock }: BlockedUsersPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function closeForm() {
    setFormOpen(false);
    setUserId('');
    setFormError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = userId.trim();
    if (!userIdPattern.test(id)) {
      setFormError('Enter a Discord user ID (17–20 digits).');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onBlock(id);
      closeForm();
    } catch (saveError) {
      setFormError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="Blocked users"
      count={total}
      aside={
        !formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className="text-sm font-medium text-ink/70 transition hover:text-ink">
            + Block by ID
          </button>
        )
      }
    >
      {formOpen && (
        <form onSubmit={submit} className="mb-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="block-user-id">
            Discord user ID
          </label>
          <input
            id="block-user-id"
            autoFocus
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Discord user ID"
            inputMode="numeric"
            className="w-56 rounded-lg border border-ink/20 bg-transparent px-3 py-2 text-sm placeholder:text-ink/60 focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={saving} className="rounded-lg border border-coral/50 px-3 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-50">
            {saving ? 'Blocking…' : 'Block'}
          </button>
          <button type="button" onClick={closeForm} className="px-2 py-2 text-sm text-ink/70 transition hover:text-ink">
            Cancel
          </button>
          {formError && (
            <p role="alert" className="w-full text-sm text-coral">
              {formError}
            </p>
          )}
        </form>
      )}
      {error && <p className="text-sm text-coral">{error}</p>}
      {loading && rows.length === 0 ? (
        <p className="text-sm text-ink/70">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/70">No blocked users.</p>
      ) : (
        <Table
          head={
            <>
              <th className={th}>User ID</th>
              <th className={thNum}>Blocked (UTC)</th>
              <th className="w-24" aria-label="Actions" />
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.user_id} className="border-b border-ink/5">
              <td className={td}>
                <IdCell id={row.user_id} />
              </td>
              <td className="py-1.5 pl-4 text-right tabular-nums">{formatUtcShort(row.blocked_at)}</td>
              <td className="py-1.5 text-right">
                <button type="button" onClick={() => onUnblock(row.user_id)} className="rounded-md px-2 py-1.5 text-sm text-ink/70 transition hover:bg-ink/5 hover:text-ink">
                  Unblock
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}
