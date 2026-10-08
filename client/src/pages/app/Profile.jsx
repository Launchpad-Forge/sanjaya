import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Arrow } from '../../components/site/Brand';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page-container" style={{ paddingTop: '150px', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Profile & Settings</h1>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '500' }}>Account Details</h2>
        
        <p style={{ opacity: 0.6, fontSize: '0.875rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>{user.email}</p>
        
        <p style={{ opacity: 0.6, fontSize: '0.875rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</p>
        <p style={{ fontFamily: 'monospace', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-block' }}>{user.id}</p>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <button 
            onClick={handleSignOut}
            style={{ background: 'white', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
          >
            Sign out <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
