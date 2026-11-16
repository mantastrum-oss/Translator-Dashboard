import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { getSessionToken, setSession } from '../api/session';

describe('Login', () => {
  beforeEach(() => setSession(null));
  afterEach(() => vi.restoreAllMocks());

  it('shows the login form when logged out', () => {
    render(<App />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('shows an error for a wrong password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    render(<App />);
    await userEvent.type(screen.getByLabelText('Password'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password.');
    expect(getSessionToken()).toBeNull();
  });

  it('stores the session after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'abc', expires_at: Math.floor(Date.now() / 1000) + 3600 }), { status: 200 })
    );
    render(<App />);
    await userEvent.type(screen.getByLabelText('Password'), 'right');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Log out');
    expect(getSessionToken()).toBe('abc');
  });
});
