import { Routes, Route, Link } from 'react-router-dom';
import CookieBanner from './components/CookieBanner';
import DSARForm from './components/DSARForm';

function Nav() {
  return (
    <nav style={styles.nav}>
      <Link to="/privacy-policy" style={styles.link}>Privacy Policy</Link>
      <Link to="/cookie-policy" style={styles.link}>Cookie Policy</Link>
      <Link to="/your-data" style={styles.link}>Your Data Rights</Link>
    </nav>
  );
}

function PrivacyPolicy() {
  return (
    <article style={styles.article}>
      <h1>Privacy Policy</h1>
      <p>
        This is placeholder policy content -- the real text needs legal review
        before this site goes anywhere near production. It should cover: what
        data each portal collects, which svc-* stores it (svc-iam for
        identity, svc-billing for payment history, svc-customer-service /
        svc-service-desk for support interactions), retention periods per
        data category, and the legal basis for each processing purpose.
      </p>
    </article>
  );
}

function CookiePolicy() {
  return (
    <article style={styles.article}>
      <h1>Cookie Policy</h1>
      <p>
        Necessary cookies (session, CSRF protection, login state) are used
        regardless of consent, since GDPR doesn't treat those as optional.
        Analytics cookies are only set if you accept the banner -- your
        choice is recorded in svc-consent-dsar and can be changed any time by
        clearing the banner decision.
      </p>
    </article>
  );
}

function YourDataRights() {
  return (
    <article style={styles.article}>
      <h1>Your Data Rights</h1>
      <p>You have the right to access, correct, delete, or export your data. Submit a request below.</p>
      <DSARForm />
    </article>
  );
}

export default function App() {
  return (
    <div>
      <Nav />
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/your-data" element={<YourDataRights />} />
        <Route path="/*" element={<PrivacyPolicy />} />
      </Routes>
      <CookieBanner />
    </div>
  );
}

const styles = {
  nav: { display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #eee', fontFamily: 'sans-serif' },
  link: { color: '#3B82F6', textDecoration: 'none' },
  article: { maxWidth: 640, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif', lineHeight: 1.6 },
};
