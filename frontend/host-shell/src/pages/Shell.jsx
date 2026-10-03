import RequireAuth from '../components/RequireAuth';
import { logout } from '../lib/authClient';

// Phase 1 note: the existing nocode-builder React app is not yet split into
// portal-user as its own module-federated remote — that's a Phase 1 follow-up
// once host-shell/gateway/IAM are proven out. For now it's reverse-proxied at
// /portal-user by svc-api-gateway-adjacent infra (see infra/docker-compose.yml)
// and embedded here, so end users already get a single authenticated entry
// point today instead of two separate logins.
const PORTAL_BY_ROLE = {
  user: { label: 'Workspace', url: '/portal-user/' },
  admin: { label: 'Admin Portal', url: '/portal-admin/' },
  super_admin: { label: 'Super Admin Portal', url: '/portal-super-admin/' },
  customer_service: { label: 'Customer Service', url: '/portal-customer-service/' },
  service_desk_l1: { label: 'Service Desk', url: '/portal-service-desk/' },
  service_desk_l2: { label: 'Service Desk', url: '/portal-service-desk/' },
  service_desk_l3: { label: 'Service Desk', url: '/portal-service-desk/' },
};

export default function Shell() {
  return (
    <RequireAuth>
      {(user) => {
        const portal = PORTAL_BY_ROLE[user.role] || PORTAL_BY_ROLE.user;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <header style={styles.header}>
              <strong>Platform</strong>
              <span style={{ flex: 1 }} />
              <span>{user.email} · {user.role}</span>
              <button onClick={logout} style={styles.logout}>Sign out</button>
            </header>
            {portal.url ? (
              <iframe title={portal.label} src={portal.url} style={{ flex: 1, border: 'none' }} />
            ) : (
              <div style={{ padding: 40 }}>
                <h2>{portal.label}</h2>
                <p>This portal is scheduled for a later build phase — see the architecture blueprint.</p>
              </div>
            )}
          </div>
        );
      }}
    </RequireAuth>
  );
}

const styles = {
  header: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px',
    borderBottom: '1px solid #e0e0e0', fontFamily: 'sans-serif',
  },
  logout: { padding: '6px 12px', cursor: 'pointer' },
};
