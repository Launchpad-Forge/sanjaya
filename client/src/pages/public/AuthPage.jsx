import { useState } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import BloomFieldBackground from '../../components/site/BloomFieldBackground';

export default function AuthPage({ mode }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next') || '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  if (user) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + next } });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans text-void bg-mist relative">
      <div className="absolute inset-0 z-0">
         <BloomFieldBackground />
      </div>
      
      <div className="flex-1 hidden lg:flex flex-col justify-end p-16 z-10 text-void">
         <h1 className="text-display font-semibold tracking-tight">SANJAYA<br/>SPATIAL<br/>INTELLIGENCE</h1>
         <p className="mt-8 text-body-large opacity-80 max-w-md">Observation &rarr; World &rarr; Memory &rarr; Change</p>
      </div>
      
      <div className="w-full lg:w-[480px] bg-paper/90 backdrop-blur-xl p-12 flex flex-col justify-center z-10 shadow-2xl relative border-l border-slate/10">
        <Link to="/" className="absolute top-8 right-8 text-sm font-mono uppercase tracking-wider text-slate hover:text-void transition-colors">Back to Site</Link>
        <h2 className="text-2xl font-semibold mb-8">{mode === 'login' ? 'Sign in to Sanjaya' : 'Create an account'}</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-sm mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">Email address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate/30 bg-transparent p-3 rounded-sm focus:border-trace outline-none transition-colors" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-slate/30 bg-transparent p-3 rounded-sm focus:border-trace outline-none transition-colors" required />
          </div>
          <button type="submit" disabled={loading} className="bg-trace text-void font-medium py-3 rounded-sm mt-4 hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Please wait...' : (mode === 'login' ? 'Continue' : 'Register')}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate/20 after:h-px after:flex-1 after:bg-slate/20 text-sm text-slate">OR</div>

        <button type="button" onClick={() => handleOAuth('github')} className="mt-8 border border-graphite text-void font-medium py-3 rounded-sm hover:bg-black/5 transition-colors">
            Continue with GitHub
        </button>

        <p className="mt-8 text-sm text-slate text-center">
            {mode === 'login' ? (
                <>Don't have an account? <Link to="/register" className="text-void hover:underline">Register</Link></>
            ) : (
                <>Already have an account? <Link to="/login" className="text-void hover:underline">Sign in</Link></>
            )}
        </p>
      </div>
    </div>
  );
}
