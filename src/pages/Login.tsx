import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { runtimeConfig } from '../config/runtime';

export function Login() {
  const [email, setEmail] = useState(runtimeConfig.demoAdminEmail);
  const [password, setPassword] = useState(runtimeConfig.demoAdminPassword);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== runtimeConfig.demoAdminEmail.toLowerCase() || password !== runtimeConfig.demoAdminPassword) {
      setError('Use the configured demo credentials shown below.');
      return;
    }
    sessionStorage.setItem('safeseat-admin-auth', 'true');
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-visual__noise" />
        <div className="login-visual__content">
          <Brand />
          <div className="login-visual__copy">
            <span className="eyebrow eyebrow--light">FLEET SAFETY OPERATIONS</span>
            <h1>One clear view of every SafeSeat session.</h1>
            <p>Monitor vehicle state, review incident evidence, manage accounts, and verify hardware health without implying continuous camera surveillance.</p>
          </div>
          <div className="login-visual__status">
            <div><span>Camera policy</span><strong>Event-based only</strong></div>
            <div><span>System role</span><strong>Non-diagnostic safety utility</strong></div>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card__icon"><ShieldCheck /></div>
          <span className="eyebrow">SAFESEAT ADMIN</span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to the SafeSeat Safety Control Center.</p>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
          <label className="field"><span>Password</span><div className="input-with-icon"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button--primary button--full" type="submit">Enter Control Center <ArrowRight size={18} /></button>
          <div className="demo-credentials"><strong>Demo credentials</strong><span>{runtimeConfig.demoAdminEmail}</span><span>{runtimeConfig.demoAdminPassword}</span></div>
          <p className="login-card__note">Demo authentication only. Replace with your production authentication provider before deployment.</p>
        </form>
      </div>
    </div>
  );
}
