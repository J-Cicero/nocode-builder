import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchMe } from '../lib/authClient';

// Wraps any portal entry point. Confirms the access token is actually valid
// (not just present) by hitting /auth/me through the gateway once per mount.
export default function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | fail
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setStatus('ok');
      })
      .catch(() => setStatus('fail'));
  }, []);

  if (status === 'checking') return <p style={{ padding: 40 }}>Checking session…</p>;
  if (status === 'fail') return <Navigate to="/login" replace />;
  return children(user);
}
