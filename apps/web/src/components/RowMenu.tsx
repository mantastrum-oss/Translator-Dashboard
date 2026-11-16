import { useEffect, useRef, useState } from 'react';

import { MoreIcon } from './icons';

const MENU_WIDTH = 176;

/**
 * "⋯" at the end of a user row: Copy ID, then Block / Unblock last and in
 * red. Blocking is rare, so it lives here instead of a button on every row.
 * The menu is fixed-positioned so scrolling table boxes can't clip it.
 */
export function RowMenu({
  userId,
  blocked,
  onToggleBlock
}: {
  userId: string;
  blocked: boolean;
  onToggleBlock: (userId: string, block: boolean) => void;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = position !== null;

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    function close() {
      setPosition(null);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
  }

  async function copy() {
    setPosition(null);
    try {
      await navigator.clipboard?.writeText(userId);
    } catch {
      // Clipboard blocked: nothing else to do.
    }
  }

  const itemClass = 'block w-full px-3 py-2 text-left text-sm transition hover:bg-ink/5 focus:bg-ink/5 focus:outline-none';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Actions for ${userId}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink/70 transition hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <MoreIcon />
      </button>
      {position && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${userId}`}
          style={{ position: 'fixed', top: position.top, left: position.left, width: MENU_WIDTH }}
          className="z-50 overflow-hidden rounded-lg border border-ink/10 bg-white py-1 shadow-panel"
        >
          <button type="button" role="menuitem" onClick={() => void copy()} className={itemClass}>
            Copy ID
          </button>
          <div className="my-1 border-t border-ink/10" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPosition(null);
              onToggleBlock(userId, !blocked);
            }}
            className={`${itemClass} ${blocked ? '' : 'text-coral'}`}
          >
            {blocked ? 'Unblock user' : 'Block user'}
          </button>
        </div>
      )}
    </>
  );
}
