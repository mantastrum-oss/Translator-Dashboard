import { useEffect, useState } from 'react';

import { getSessionToken, onSessionChange } from './api/session';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [token, setToken] = useState(getSessionToken);
  useEffect(() => onSessionChange(() => setToken(getSessionToken())), []);
  return token ? <DashboardPage /> : <LoginPage />;
}
