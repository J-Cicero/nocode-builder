import { useEffect, useState } from 'react';
import { authedFetch, fetchMe } from '../lib/authedFetch';

const LEVEL_BY_ROLE = {
  service_desk_l1: 'l1',
  service_desk_l2: 'l2',
  service_desk_l3: 'l3',
};

export default function ServiceDeskQueue() {
  const [me, setMe] = useState(null);
  const [level, setLevel] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  async function loadTickets(lvl) {
    const res = await authedFetch(`/service-desk/queue/${lvl}`);
    if (res.ok) setTickets(await res.json());
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        const lvl = LEVEL_BY_ROLE[user.role] || (['admin', 'super_admin'].includes(user.role) ? 'l1' : null);
        if (!lvl) {
          setError('This portal is restricted to service desk staff (L1/L2/L3).');
          return;
        }
        setLevel(lvl);
        await loadTickets(lvl);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  async function escalate(id) {
    await authedFetch(`/service-desk/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Escalated from agent portal' }),
    });
    loadTickets(level);
  }

  if (error) return <p style={styles.error}>{error}</p>;
  if (!me || !level) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={styles.page}>
      <h1>Service Desk — {level.toUpperCase()} Queue</h1>
      <p>{tickets.length} ticket(s)</p>
      {tickets.map((t) => (
        <div key={t.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <strong>{t.subject}</strong>
            <span style={styles.badge}>{t.priority}</span>
          </div>
          <p style={styles.desc}>{t.description}</p>
          <div style={styles.actions}>
            <span>Status: <strong>{t.status}</strong></span>
            {level !== 'l3' && (
              <button onClick={() => escalate(t.id)} style={styles.escalateBtn}>
                Escalate to {level === 'l1' ? 'L2' : 'L3'}
              </button>
            )}
          </div>
        </div>
      ))}
      {tickets.length === 0 && <p>No tickets in this queue.</p>}
    </div>
  );
}

const styles = {
  page: { padding: 24, fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto' },
  card: { border: '1px solid #e0e0e0', borderRadius: 6, padding: 16, marginTop: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { background: '#eef', padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  desc: { color: '#555', fontSize: 14 },
  actions: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 },
  escalateBtn: { padding: '4px 10px', cursor: 'pointer' },
  error: { padding: 40, color: '#c0392b' },
};
