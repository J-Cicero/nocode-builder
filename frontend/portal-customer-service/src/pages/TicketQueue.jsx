import { useEffect, useState } from 'react';
import { authedFetch, fetchMe } from '../lib/authedFetch';

export default function TicketQueue() {
  const [me, setMe] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  async function loadTickets() {
    const res = await authedFetch('/support/tickets/');
    if (res.ok) setTickets(await res.json());
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        if (!['customer_service', 'admin', 'super_admin'].includes(user.role)) {
          setError('This portal is restricted to customer service staff.');
          return;
        }
        await loadTickets();
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  async function updateStatus(id, status) {
    await authedFetch(`/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadTickets();
  }

  async function escalate(id) {
    await authedFetch(`/support/tickets/${id}/escalate`, { method: 'POST' });
    loadTickets();
  }

  if (error) return <p style={styles.error}>{error}</p>;
  if (!me) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={styles.page}>
      <h1>Customer Service Queue</h1>
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
            <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
            <button onClick={() => escalate(t.id)} style={styles.escalateBtn}>Escalate to Service Desk</button>
          </div>
        </div>
      ))}
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
