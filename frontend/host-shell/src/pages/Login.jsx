import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyMfa } from '../lib/authClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [stepUpToken, setStepUpToken] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password);
      if (result.mfa_required) {
        setStepUpToken(result.mfa_step_up_token);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMfa(e) {
    e.preventDefault();
    setError('');
    try {
      await verifyMfa(stepUpToken, code);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  if (stepUpToken) {
    return (
      <form onSubmit={handleMfa} style={styles.form}>
        <h2>Enter your 6-digit code</h2>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} />
        <button type="submit">Verify</button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} style={styles.form}>
      <h2>Sign in</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Sign in</button>
      {error && <p style={styles.error}>{error}</p>}
    </form>
  );
}

const styles = {
  form: { maxWidth: 320, margin: '80px auto', display: 'flex', flexDirection: 'column', gap: 12 },
  error: { color: '#c0392b' },
};
