import { useState } from 'react';

export function ConsolePanel() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-ink/20 px-3 py-2 text-sm text-ink transition hover:border-accent hover:text-accent">View Console</button>
    {open && <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink/30 p-4" role="dialog" aria-modal="true" aria-label="Console">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between"><h2 className="font-heading text-xl">Console</h2><button type="button" onClick={() => setOpen(false)} className="text-ink/60 hover:text-ink" aria-label="Close console">Close</button></div>
        <p className="mt-4 rounded-lg bg-surf p-4 font-mono text-xs text-ink/70">Console logs are limited to sanitized operational events. No message or translation content is displayed.</p>
      </div>
    </div>}
  </>;
}
