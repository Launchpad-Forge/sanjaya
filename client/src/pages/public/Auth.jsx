import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ShaderBackground from '../../components/site/ShaderBackground';
import Brand, { Arrow, BrandMark } from '../../components/site/Brand';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export default function Auth() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const isLogin = pathname === '/login';
  const nextParam = searchParams.get('next') || '/app';

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Onboarding state for registration
  const [onboardingStep, setOnboardingStep] = useState(false);
  const [useCase, setUseCase] = useState('Research');
  const [interests, setInterests] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema)
  });

  useEffect(() => {
    if (user && !onboardingStep) {
      navigate(nextParam, { replace: true });
    }
  }, [user, navigate, nextParam, onboardingStep]);

  useEffect(() => {
    reset();
    setAuthError('');
    setAuthNotice('');
    setShowPassword(false);
    document.title = `${isLogin ? 'Sign in' : 'Join Sanjaya'} — Sanjaya`;
  }, [isLogin, reset]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${nextParam}` }
      });
      if (error) setAuthError(error.message);
    } catch (err) {
      setAuthError('OAuth authentication failed. Check your Supabase configuration.');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setAuthError('');
    setAuthNotice('');

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          setAuthError(error.message);
        } else if (authData?.user) {
          navigate(nextParam, { replace: true });
        }
      } else {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name || '',
            }
          }
        });

        if (error) {
          setAuthError(error.message);
        } else if (authData?.user) {
          // Trigger optional progressive onboarding step
          setOnboardingStep(true);
        }
      }
    } catch (err) {
      setAuthError('Authentication error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeOnboarding = () => {
    navigate(nextParam, { replace: true });
  };

  const toggleInterest = (item) => {
    setInterests(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="auth-page">
      <ShaderBackground variant="waves" />
      <header className="auth-header">
        <Brand />
        <Link to="/" className="auth-back">Back to home <Arrow diagonal /></Link>
      </header>
      <main className="auth-main">
        <section className="auth-story" aria-label="About Sanjaya">
          <span className="eyebrow"><span className="status-dot" /> SPATIAL INTELLIGENCE</span>
          <h2>Intelligence shouldn't <br />stop at the frame.</h2>
          <p>Sanjaya transforms ordinary visual observations into persistent spatial understanding — reconstructing environments, understanding what exists, remembering state, and detecting changes.</p>
          <div className="auth-story-line" />
          <div className="auth-story-features">
            <span>Spatial Perception</span>
            <span>Inspection Engine</span>
            <span>World Models</span>
          </div>
          <span className="auth-caption">SPATIAL INTELLIGENCE FOR THE PHYSICAL WORLD</span>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-mark"><BrandMark /></div>
          
          {onboardingStep ? (
            <div className="space-y-6">
              <span className="eyebrow">WELCOME TO SANJAYA</span>
              <h1 id="auth-title" className="text-xl font-bold">Customize your workspace.</h1>
              <p className="auth-intro">Help us tailor your spatial intelligence experience.</p>
              
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate mb-2">Primary Area of Work</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Research', 'Developer', 'Robotics', 'Inspection', 'Student', 'Organization'].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setUseCase(option)}
                        className={`px-3 py-2 text-xs rounded border transition-colors ${
                          useCase === option 
                            ? 'border-trace bg-trace/10 text-paper font-medium' 
                            : 'border-white/10 bg-white/5 text-slate hover:text-paper'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate mb-2">Areas of Interest</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Spatial AI', '3D Reconstruction', 'Inspection', 'Robotics', 'SDK', 'Research', 'Open Source'].map(topic => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleInterest(topic)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          interests.includes(topic)
                            ? 'border-trace text-trace bg-trace/10'
                            : 'border-white/10 text-slate hover:text-paper'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={completeOnboarding}
                className="auth-submit w-full mt-4"
              >
                Enter Workspace <Arrow />
              </button>
            </div>
          ) : (
            <>
              <span className="eyebrow">{isLogin ? 'AUTHENTICATION' : 'WORKSPACE REGISTRATION'}</span>
              <h1 id="auth-title">{isLogin ? 'Welcome back.' : 'Join Sanjaya.'}</h1>
              <p className="auth-intro">
                {isLogin 
                  ? 'Sign in to access your spatial workspace and inspections.' 
                  : 'Create a workspace to explore spatial intelligence, inspections, and research.'}
              </p>

              {authError && (
                <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono" role="alert">
                  {authError}
                </div>
              )}

              {authNotice && (
                <div className="p-3 mb-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono" role="status">
                  {authNotice}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {!isLogin && (
                  <div className="auth-field">
                    <label htmlFor="name">Full Name (optional)</label>
                    <input 
                      id="name" 
                      type="text" 
                      autoComplete="name" 
                      placeholder="Jane Doe" 
                      {...register('name')} 
                    />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="email">Email address</label>
                  <input 
                    id="email" 
                    type="email" 
                    autoComplete="email" 
                    placeholder="you@organization.com" 
                    {...register('email')} 
                    aria-invalid={!!errors.email} 
                    aria-describedby={errors.email ? 'email-error' : undefined} 
                  />
                  {errors.email && <p className="field-error" id="email-error" role="alert">{errors.email.message}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Password</label>
                  <div className="password-input">
                    <input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'} 
                      autoComplete={isLogin ? 'current-password' : 'new-password'} 
                      placeholder="At least 8 characters" 
                      {...register('password')} 
                      aria-invalid={!!errors.password} 
                      aria-describedby={errors.password ? 'password-error' : undefined} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(value => !value)} 
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <p className="field-error" id="password-error" role="alert">{errors.password.message}</p>}
                </div>

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Authenticating...' : (isLogin ? 'Sign in' : 'Create workspace')} <Arrow />
                </button>
                
                <button 
                  type="button" 
                  className="auth-submit flex items-center justify-center gap-2 mt-3" 
                  onClick={handleGoogleLogin} 
                  style={{ backgroundColor: '#1D1D1F', color: '#F5F5F7', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              <p className="auth-switch">
                {isLogin ? 'New to Sanjaya?' : 'Already have an account?'} {' '}
                <Link to={isLogin ? '/register' : '/login'}>
                  {isLogin ? 'Create a workspace' : 'Sign in'} <span aria-hidden="true">↗</span>
                </Link>
              </p>

              <div className="auth-divider"><span>GUEST ACCESS</span></div>
              <Link to="/inspect" className="auth-guest">
                Start Instant Inspection <Arrow />
                <span>No account required for guest scan</span>
              </Link>

              <p className="auth-legal">
                By continuing, you agree to Sanjaya's <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </>
          )}
        </section>
      </main>
      <footer className="auth-footer">
        <span>Spatial Intelligence Project.</span>
        <Link to="/responsible-use">Built for physical-world understanding. <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  );
}
