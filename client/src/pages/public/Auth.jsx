import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ShaderBackground from '../../components/site/ShaderBackground';
import Brand, { Arrow, BrandMark } from '../../components/site/Brand';
import { supabase } from '../../lib/supabase';
import { safeAuthDestination } from '../../lib/authRedirect';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});
const unavailable = 'Account access is not available yet. You can still explore the guest inspection.';

export default function Auth() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLogin = pathname === '/login';
  const next = safeAuthDestination(searchParams.get('next'));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(authSchema) });
  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  useEffect(() => {
    reset(); setError(''); setNotice(''); setShowPassword(false); setBusy('');
    document.title = `${isLogin ? 'Sign in' : 'Join Sanjaya'} — Sanjaya`;
  }, [isLogin, reset]);

  async function googleSignIn() {
    setError(''); setNotice('');
    if (!supabase) { setError(unavailable); return; }
    setBusy('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } });
      if (error) throw error;
    } catch {
      setError('Google sign-in could not start. Please try again in a moment.');
      setBusy('');
    }
  }

  async function onSubmit(values) {
    setError(''); setNotice('');
    if (!supabase) { setError(unavailable); return; }
    setBusy('email');
    try {
      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
        : await supabase.auth.signUp({ email: values.email, password: values.password, options: { emailRedirectTo: callbackUrl(), data: { full_name: values.name || '' } } });
      if (result.error) throw result.error;
      if (result.data.session) navigate(next, { replace: true });
      else setNotice('Check your email for a confirmation link before signing in.');
    } catch (error) {
      setError(error.code === 'invalid_credentials' ? 'That email and password combination was not recognized.' : error.code === 'email_not_confirmed' ? 'Please confirm your email before signing in.' : 'We could not complete your request. Please try again.');
    } finally { setBusy(''); }
  }

  return (
    <div className="auth-page">
      <ShaderBackground variant="waves" />
      <header className="auth-header"><Brand /><Link to="/" className="auth-back">Back to home <Arrow diagonal /></Link></header>
      <main className="auth-main">
        <section className="auth-story" aria-label="About Sanjaya"><span className="eyebrow"><span className="status-dot" /> A NEW PERSPECTIVE</span><h2>See beyond <br />the frame.</h2><p>One camera. A shared understanding.<br />Explore a space, remember its state,<br className="desktop-break" /> and see what changes.</p><div className="auth-story-line" /><div className="auth-story-features"><span>Spatial perception</span><span>Inspection</span><span>Open research</span></div><span className="auth-caption">SPATIAL INTELLIGENCE FOR THE PHYSICAL WORLD</span></section>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-mark"><BrandMark /></div><span className="eyebrow">YOUR NEXT PERSPECTIVE STARTS HERE</span>
          <h1 id="auth-title">{isLogin ? 'Welcome back.' : 'Join Sanjaya.'}</h1><p className="auth-intro">{isLogin ? 'Sign in to your spatial workspace.' : 'Make room for a new perspective.'}</p>
          {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
          {notice && <p className="auth-feedback" role="status">{notice}</p>}
          <button type="button" className="google-signin" disabled={!!busy} onClick={googleSignIn}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}</button>
          <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {!isLogin && <div className="auth-field"><label htmlFor="name">Full name <span>(optional)</span></label><input id="name" autoComplete="name" placeholder="Your name" {...register('name')} /></div>}
            <div className="auth-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <p className="field-error" id="email-error" role="alert">{errors.email.message}</p>}</div>
            <div className="auth-field"><label htmlFor="password">Password</label><div className="password-input"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="At least 8 characters" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div>{errors.password && <p className="field-error" id="password-error" role="alert">{errors.password.message}</p>}</div>
            <button type="submit" className="auth-submit" disabled={!!busy}>{busy === 'email' ? 'Please wait…' : isLogin ? 'Sign in' : 'Create workspace'} <Arrow /></button>
          </form>
          <p className="auth-switch">{isLogin ? 'New to Sanjaya?' : 'Already have an account?'} <Link to={`${isLogin ? '/register' : '/login'}?next=${encodeURIComponent(next)}`}>{isLogin ? 'Create an account' : 'Sign in'} <span aria-hidden="true">↗</span></Link></p>
          <div className="auth-divider"><span>JUST EXPLORING?</span></div><Link to="/inspect" className="auth-guest">Try a guest inspection <Arrow /><span>No account needed</span></Link>
          <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
        </section>
      </main>
      <footer className="auth-footer"><span>An open research project.</span><Link to="/responsible-use">Built for understanding. Built responsibly. <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}
