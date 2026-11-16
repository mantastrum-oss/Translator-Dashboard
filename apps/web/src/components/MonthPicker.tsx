interface MonthPickerProps {
  month: string;
  onChange: (value: string) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink/70" htmlFor="month-picker">
      <span className="sr-only">Month</span>
      <input
        id="month-picker"
        type="month"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink/20 bg-transparent px-3 py-2 text-ink focus:border-accent focus:outline-none"
      />
    </label>
  );
}
