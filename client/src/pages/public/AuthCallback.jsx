import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { safeAuthDestination } from '../../lib/authRedirect';

export default function AuthCallback() {
  const { user, loading, authError } = useAuth();
  const [params] = useSearchParams();
  const next = safeAuthDestination(params.get('next'));
  const denied = params.has('error') || new URLSearchParams(window.location.hash.slice(1)).has('error');
  if (!loading && user && !denied) return <Navigate to={next} replace />;
  return <main className="auth-callback"><div><span className="eyebrow">SANJAYA / ACCOUNT ACCESS</span><h1>{loading ? 'Finishing sign-in…' : 'Let’s try that again.'}</h1><p role="status">{loading ? 'Connecting you to your workspace.' : denied ? 'Sign-in was cancelled or could not be completed.' : authError || 'Your sign-in link is missing or has expired. Please start a new sign-in.'}</p>{!loading && <Link to={`/login?next=${encodeURIComponent(next)}`} className="button-primary">Back to sign in</Link>}</div></main>;
}
