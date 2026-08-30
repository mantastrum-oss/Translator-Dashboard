const COMMON_TIMEZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Kolkata'];

interface TimezonePickerProps {
  timezone: string;
  onChange: (value: string) => void;
}

export function TimezonePicker({ timezone, onChange }: TimezonePickerProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink" htmlFor="timezone-picker">
      Timezone
      <select
        id="timezone-picker"
        value={timezone}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink/20 bg-white px-3 py-2"
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </label>
  );
}
