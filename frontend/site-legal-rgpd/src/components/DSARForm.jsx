import { useState } from 'react';

const GATEWAY_BASE = import.meta.env.VITE_GATEWAY_URL || '/api';

export default function DSARForm() {
  const [type, setType] = useState('access');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(null); // null | 'submitting' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('platform.access_token');
    if (!token) {
      setStatus('error');
      setErrorMsg('You need to be signed in to submit a data request -- we have to know whose data this is.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(`${GATEWAY_BASE}/legal/dsar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request_type: type, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Request failed');
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'done') {
    return <p style={styles.success}>Your request has been received. We'll follow up by email.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Exercise your data rights</h2>
      <p style={styles.hint}>Under GDPR you can request a copy of your data, its deletion, or a portable export.</p>

      <label style={styles.label}>
        Request type
        <select value={type} onChange={(e) => setType(e.target.value)} style={styles.input}>
          <option value="access">Access -- send me a copy of my data</option>
          <option value="erasure">Erasure -- delete my data</option>
          <option value="portability">Portability -- export my data</option>
        </select>
      </label>

      <label style={styles.label}>
        Additional details (optional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.textarea} rows={4} />
      </label>

      <button type="submit" disabled={status === 'submitting'} style={styles.submit}>
        {status === 'submitting' ? 'Submitting…' : 'Submit request'}
      </button>

      {status === 'error' && <p style={styles.error}>{errorMsg}</p>}
    </form>
  );
}

const styles = {
  form: { maxWidth: 480, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'sans-serif' },
  hint: { color: '#555', fontSize: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 },
  input: { padding: 8, fontSize: 14 },
  textarea: { padding: 8, fontSize: 14, fontFamily: 'inherit' },
  submit: { padding: '10px 16px', background: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer' },
  error: { color: '#c0392b' },
  success: { padding: 40, textAlign: 'center', fontFamily: 'sans-serif' },
};
