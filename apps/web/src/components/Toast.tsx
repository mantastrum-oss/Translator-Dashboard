import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  undo?: () => void;
}

/** Bottom-right notice after an action, with an optional Undo. */
export function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] justify-end">
      {toast && (
        <div className="pointer-events-auto flex items-center gap-4 rounded-lg bg-ink px-4 py-3 text-sm text-surf shadow-panel">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                onClose();
              }}
              className="font-semibold underline-offset-2 hover:underline"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
