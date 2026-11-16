import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { apiGet } from '../api/client';

export interface DiscordUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface DiscordUsersResponse {
  available: boolean;
  users: Record<string, DiscordUser | null>;
}

const CHUNK = 100;

/**
 * Usernames and avatars for the user IDs on screen. Each ID is asked for once
 * per page load; the API keeps them in memory (never stored). Missing or
 * failed lookups simply leave the ID on its own.
 */
export function useDiscordUsers(ids: string[]): Map<string, DiscordUser | null> {
  const [users, setUsers] = useState<Map<string, DiscordUser | null>>(() => new Map());
  const requested = useRef(new Set<string>());
  const key = [...new Set(ids)].sort().join(',');

  useEffect(() => {
    const missing = key ? key.split(',').filter((id) => !requested.current.has(id)) : [];
    if (missing.length === 0) return;
    missing.forEach((id) => requested.current.add(id));
    for (let start = 0; start < missing.length; start += CHUNK) {
      const chunk = missing.slice(start, start + CHUNK);
      apiGet<DiscordUsersResponse>('/api/discord/users', { ids: chunk.join(',') })
        .then((response) => {
          if (!response.available) return;
          setUsers((current) => {
            const next = new Map(current);
            Object.entries(response.users).forEach(([id, user]) => next.set(id, user));
            return next;
          });
        })
        .catch(() => {
          // Allow another try on the next refresh of these rows.
          chunk.forEach((id) => requested.current.delete(id));
        });
    }
  }, [key]);

  return users;
}

export const DiscordUsersContext = createContext<Map<string, DiscordUser | null>>(new Map());

export function useDiscordUser(id: string): DiscordUser | null {
  return useContext(DiscordUsersContext).get(id) ?? null;
}
