import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { runtimeConfig } from '../config/runtime';
import { useAuth } from '../auth/AuthProvider';

export function Login() {
  const { ready, authenticated, signIn } = useAuth();
  const [email, setEmail] = useState(runtimeConfig.dataMode === 'demo' ? runtimeConfig.demoAdminEmail : '');
  const [password, setPassword] = useState(runtimeConfig.dataMode === 'demo' ? runtimeConfig.demoAdminPassword : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setError(''), [email, password]);

  if (ready && authenticated) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Sign-in failed.';
      setError(message.includes('auth/invalid-credential') ? 'Invalid email or password.' : message);
    } finally {
      setSubmitting(false);
    }
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
            <p>Monitor vehicle state, review incident evidence, manage accounts, and verify hardware health without exposing exact physiological readings or implying continuous camera surveillance.</p>
          </div>
          <div className="login-visual__status">
            <div><span>Camera policy</span><strong>Event-based only</strong></div>
            <div><span>Admin data policy</span><strong>Derived states only</strong></div>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card__icon"><ShieldCheck /></div>
          <span className="eyebrow">SAFESEAT ADMIN</span>
          <h2>Welcome back</h2>
          <p className="muted">{runtimeConfig.dataMode === 'firebase' ? 'Sign in with an authorized SafeSeat fleet-admin account.' : 'Sign in to the SafeSeat demonstration Control Center.'}</p>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label className="field"><span>Password</span><div className="input-with-icon"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button--primary button--full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <>Enter Control Center <ArrowRight size={18} /></>}</button>
          {runtimeConfig.dataMode === 'demo' ? (
            <>
              <div className="demo-credentials"><strong>Demo credentials</strong><span>{runtimeConfig.demoAdminEmail}</span><span>{runtimeConfig.demoAdminPassword}</span></div>
              <p className="login-card__note">Demo authentication is isolated from Firebase and is intended only for manuscript figures and UI review.</p>
            </>
          ) : (
            <p className="login-card__note">Firebase Authentication is enabled. Access also requires an active document for this UID in the configured admin collection.</p>
          )}
        </form>
      </div>
    </div>
  );
}
