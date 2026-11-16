import { useState, type FormEvent } from 'react';

import { login, type LoginResult } from '../api/client';

const messages: Record<Exclude<LoginResult, 'ok'>, string> = {
  wrong_password: 'Wrong password.',
  too_many_attempts: 'Too many attempts. Try again in a minute.',
  unavailable: "Can't reach the server. Try again."
};

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    const result = await login(password);
    setPending(false);
    if (result !== 'ok') setError(messages[result]);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surf px-4 font-body text-ink">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-6 shadow-panel">
        <h1 className="font-heading text-2xl">Translator Analytics</h1>
        <label htmlFor="dashboard-password" className="mt-6 block text-sm text-ink/70">Password</label>
        <input
          id="dashboard-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/20 bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
        {error && <p role="alert" className="mt-2 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={pending || !password}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-white transition hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
