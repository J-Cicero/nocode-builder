import { useEffect, useState } from 'react';
import { authedFetch, fetchMe } from '../lib/authedFetch';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        if (!user.tenant_id) {
          setError('This account has no tenant assigned -- billing and tickets are scoped per tenant.');
          return;
        }
        const [subRes, invRes, ticketsRes] = await Promise.all([
          authedFetch(`/billing/subscriptions/${user.tenant_id}`),
          authedFetch(`/billing/tenants/${user.tenant_id}/invoices`),
          authedFetch('/support/tickets/'),
        ]);
        if (subRes.ok) setSubscription(await subRes.json());
        if (invRes.ok) setInvoices(await invRes.json());
        if (ticketsRes.ok) setTickets(await ticketsRes.json());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  if (error) return <p style={styles.error}>{error}</p>;
  if (!me) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={styles.page}>
      <h1>Admin Portal</h1>
      <p>Signed in as {me.email} · tenant {me.tenant_id}</p>

      <section style={styles.section}>
        <h2>Subscription</h2>
        {subscription ? (
          <p>Plan: <strong>{subscription.plan}</strong> · Status: {subscription.status} · ${subscription.monthly_price}/mo</p>
        ) : (
          <p>No subscription found for this tenant yet.</p>
        )}
      </section>

      <section style={styles.section}>
        <h2>Invoices</h2>
        {invoices.length === 0 && <p>No invoices yet.</p>}
        <ul>
          {invoices.map((inv) => (
            <li key={inv.id}>${inv.amount} — {inv.status} {inv.paid_at ? `(paid ${inv.paid_at})` : ''}</li>
          ))}
        </ul>
      </section>

      <section style={styles.section}>
        <h2>Support tickets (all in this org)</h2>
        {tickets.length === 0 && <p>No tickets yet.</p>}
        <ul>
          {tickets.map((t) => (
            <li key={t.id}>{t.subject} — {t.status} ({t.priority})</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const styles = {
  page: { padding: 24, fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto' },
  section: { marginTop: 24, paddingTop: 16, borderTop: '1px solid #e0e0e0' },
  error: { padding: 40, color: '#c0392b' },
};
