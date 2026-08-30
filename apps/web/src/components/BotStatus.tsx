import { useEffect, useState } from 'react';

import { apiGet } from '../api/client';

interface BotStatusResponse {
  status: string;
  online: boolean;
  guild_count: number;
  last_heartbeat_utc: string | null;
}

export function BotStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<BotStatusResponse>('/api/bot/status', {})
      .then((response) => { if (active) setOnline(response.online); })
      .catch(() => { if (active) setOnline(false); });
    return () => { active = false; };
  }, []);

  const label = online === null ? 'Checking bot' : online ? 'Bot is running' : 'Bot unavailable';
  return <span className="inline-flex items-center gap-2 text-sm text-ink/70"><span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-accent' : online === false ? 'bg-coral' : 'bg-amber'}`} />{label}</span>;
}
