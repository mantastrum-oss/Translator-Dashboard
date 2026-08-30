interface MonthPickerProps {
  month: string;
  onChange: (value: string) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink" htmlFor="month-picker">
      Month
      <input
        id="month-picker"
        type="month"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink/20 bg-white px-3 py-2"
      />
    </label>
  );
}
