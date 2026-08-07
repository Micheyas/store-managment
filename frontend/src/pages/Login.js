import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏪</div>
        <h1 className="login-title">StoreMS</h1>
        <p className="login-sub">Store Management System</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@store.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo-title">🔑 Demo Accounts</p>
          <table className="login-demo-table">
            <thead>
              <tr><th>Role</th><th>Email</th><th>Password</th><th></th></tr>
            </thead>
            <tbody>
              {[
                { role: '👑 Owner',   email: 'admin@store.com',   password: 'admin123' },
                { role: '🔧 Manager', email: 'manager@store.com', password: 'manager123' },
                { role: '🛒 Cashier', email: 'cashier@store.com', password: 'cashier123' },
              ].map(a => (
                <tr key={a.email}>
                  <td>{a.role}</td>
                  <td><code>{a.email}</code></td>
                  <td><code>{a.password}</code></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => { setEmail(a.email); setPassword(a.password); }}
                    >
                      Use
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
