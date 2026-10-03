import { useEffect, useState } from 'react';

const GATEWAY_BASE = import.meta.env.VITE_GATEWAY_URL || '/api';
const SESSION_KEY = 'rgpd.session_id';

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function recordConsent(purpose, granted) {
  const token = localStorage.getItem('platform.access_token'); // present if the visitor happens to be logged in
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  await fetch(`${GATEWAY_BASE}/legal/consent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ purpose, granted, session_id: token ? undefined : getOrCreateSessionId() }),
  });
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decided = localStorage.getItem('rgpd.cookie_decision');
    if (!decided) setVisible(true);
  }, []);

  async function decide(granted) {
    await recordConsent('analytics_cookies', granted);
    localStorage.setItem('rgpd.cookie_decision', granted ? 'accepted' : 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={styles.banner}>
      <p style={styles.text}>
        We use cookies for analytics. You can accept or reject this — necessary
        cookies for login and security are used regardless, since those aren't
        optional under GDPR. See our <a href="/cookie-policy" style={styles.link}>cookie policy</a>.
      </p>
      <div style={styles.actions}>
        <button onClick={() => decide(false)} style={styles.reject}>Reject</button>
        <button onClick={() => decide(true)} style={styles.accept}>Accept</button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1a', color: '#fff',
    padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap', fontFamily: 'sans-serif', zIndex: 1000,
  },
  text: { margin: 0, fontSize: 14, maxWidth: 640 },
  link: { color: '#8ab4f8' },
  actions: { display: 'flex', gap: 8 },
  reject: { padding: '8px 16px', background: 'transparent', border: '1px solid #666', color: '#fff', cursor: 'pointer' },
  accept: { padding: '8px 16px', background: '#3B82F6', border: 'none', color: '#fff', cursor: 'pointer' },
};
