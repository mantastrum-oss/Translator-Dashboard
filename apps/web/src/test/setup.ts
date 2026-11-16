import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error test shim
global.ResizeObserver = ResizeObserverMock;

// jsdom has no matchMedia; ThemeToggle reads the OS colour scheme.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  }) as MediaQueryList;

import { setSession } from '../api/session';

// Tests start logged in; login tests log out themselves.
beforeEach(() => {
  setSession({ token: 'test-token', expiresAt: Math.floor(Date.now() / 1000) + 3600 });
});
