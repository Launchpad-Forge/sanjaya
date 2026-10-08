import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ShaderBackground from '../../components/site/ShaderBackground';
import Brand, { Arrow, BrandMark } from '../../components/site/Brand';
import { supabase } from '../../lib/supabase';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export default function Auth() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(authSchema) });

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) console.error("Google login error:", error.message);
  };

  useEffect(() => {
    reset();
    setSubmitted(false);
    setShowPassword(false);
    document.title = `${isLogin ? 'Sign in' : 'Create an account'} — Sanjaya`;
  }, [isLogin, reset]);

  return (
    <div className="auth-page">
      <ShaderBackground variant="waves" />
      <header className="auth-header"><Brand /><Link to="/" className="auth-back">Back to home <Arrow diagonal /></Link></header>
      <main className="auth-main">
        <section className="auth-story" aria-label="About Sanjaya">
          <span className="eyebrow"><span className="status-dot" /> A NEW PERSPECTIVE</span>
          <h2>See beyond <br />the frame.</h2>
          <p>One camera. A shared understanding.<br />Turn the spaces around you into maps<br className="desktop-break" /> your whole team can explore.</p>
          <div className="auth-story-line" />
          <div className="auth-story-features"><span>Any camera</span><span>Live 3D mapping</span><span>Open research</span></div>
          <span className="auth-caption">SPATIAL INTELLIGENCE, OPEN TO EVERYONE.</span>
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-mark"><BrandMark /></div>
          <span className="eyebrow">YOUR NEXT PERSPECTIVE STARTS HERE</span>
          <h1 id="auth-title">{isLogin ? 'Welcome back.' : 'Make room for discovery.'}</h1>
          <p className="auth-intro">{isLogin ? 'Sign in to your Sanjaya workspace.' : 'Create your Sanjaya research workspace.'}</p>
          <form onSubmit={handleSubmit(() => setSubmitted(true))} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
              {errors.email && <p className="field-error" id="email-error" role="alert">{errors.email.message}</p>}
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="At least 8 characters" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              {errors.password && <p className="field-error" id="password-error" role="alert">{errors.password.message}</p>}
            </div>
            <button type="submit" className="auth-submit">{isLogin ? 'Sign in' : 'Create account'} <Arrow /></button>
            
            <button type="button" className="auth-submit" onClick={handleGoogleLogin} style={{ marginTop: '0.75rem', backgroundColor: '#fff', color: '#111', border: '1px solid #e5e7eb' }}>
              Continue with Google
            </button>

            {submitted && <p className="auth-notice" role="status">Account access isn’t connected yet in this research prototype. <Link to="/try">Explore the guest demo</Link> in the meantime.</p>}
          </form>
          <p className="auth-switch">{isLogin ? 'New to Sanjaya?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'} <span aria-hidden="true">↗</span></Link></p>
          <div className="auth-divider"><span>JUST EXPLORING?</span></div>
          <Link to="/try" className="auth-guest">Try the guest demo <Arrow /><span>No account needed</span></Link>
          <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
        </section>
      </main>
      <footer className="auth-footer"><span>An open research project.</span><Link to="/responsible-use">Built for understanding. Built responsibly. <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}
