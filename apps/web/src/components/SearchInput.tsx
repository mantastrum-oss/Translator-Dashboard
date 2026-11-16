import { useEffect, useState } from 'react';

import { SearchIcon } from './icons';

/** Searches on the server (all pages), 300 ms after typing stops. */
export function SearchInput({ label, value, onSearch }: { label: string; value: string; onSearch: (value: string) => void }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (text.trim() === value) return;
    const timer = window.setTimeout(() => onSearch(text.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <label className="relative mb-3 block">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/60">
        <SearchIcon />
      </span>
      <input
        type="search"
        inputMode="numeric"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={label}
        className="w-full rounded-lg border border-ink/20 bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-ink/60 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
