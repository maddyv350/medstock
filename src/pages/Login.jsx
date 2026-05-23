import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@medical.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) navigate('/', { replace: true });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ECONNABORTED') {
        setError('The server is waking up (free hosting). Please try again in a few seconds.');
      } else {
        setError('Cannot reach the server. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo"><span className="dot">✚</span> MedStock</div>
        <div className="tagline">Stock & Shortage Management</div>

        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="hint">
          Demo · admin@medical.com / admin123<br />
          staff@medical.com / staff123
        </div>
      </form>
    </div>
  );
}
