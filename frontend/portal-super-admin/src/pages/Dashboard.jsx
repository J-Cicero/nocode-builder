import { useEffect, useState } from 'react';
import { authedFetch, fetchMe } from '../lib/authedFetch';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        if (user.role !== 'super_admin') {
          setError('This portal is restricted to super_admin accounts.');
          return;
        }
        const res = await authedFetch('/tenants/');
        if (res.ok) setTenants(await res.json());
        else setError('Could not load tenants.');
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  if (error) return <p style={styles.error}>{error}</p>;
  if (!me) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={styles.page}>
      <h1>Super Admin Portal</h1>
      <p>Signed in as {me.email}</p>

      <section style={styles.section}>
        <h2>All tenants ({tenants.length})</h2>
        {tenants.length === 0 && <p>No tenants yet.</p>}
        <table style={styles.table}>
          <thead>
            <tr><th style={styles.th}>Name</th><th style={styles.th}>Slug</th><th style={styles.th}>Plan</th><th style={styles.th}>Active</th></tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>{t.slug}</td>
                <td style={styles.td}>{t.plan}</td>
                <td style={styles.td}>{t.is_active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const styles = {
  page: { padding: 24, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' },
  section: { marginTop: 24 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 12 },
  th: { textAlign: 'left', borderBottom: '2px solid #ddd', padding: 8 },
  td: { borderBottom: '1px solid #eee', padding: 8 },
  error: { padding: 40, color: '#c0392b' },
};
