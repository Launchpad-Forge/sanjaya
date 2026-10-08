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

  const handleResetPassword = async () => {
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email);
      alert("Password reset email sent!");
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page-container" style={{ paddingTop: '150px', paddingBottom: '100px', minHeight: '100vh', color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>Settings</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Section */}
        <section style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500', color: '#fff' }}>Profile</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <span style={{ opacity: 0.6, fontSize: '0.875rem' }}>Email Address</span>
            <span style={{ fontSize: '1rem' }}>{user.email}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center' }}>
            <span style={{ opacity: 0.6, fontSize: '0.875rem' }}>Full Name</span>
            <input 
              type="text" 
              placeholder="Add your name" 
              defaultValue={user.user_metadata?.full_name || ''}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', width: '100%', maxWidth: '300px' }} 
            />
          </div>
        </section>

        {/* Preferences Section */}
        <section style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500', color: '#fff' }}>Preferences</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Email Notifications</p>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Receive updates about your 3D models and research.</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#b9edcf', borderRadius: '24px' }}></span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Theme</p>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Customize the interface look.</p>
            </div>
            <select style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}>
              <option>System Default</option>
              <option>Dark Mode</option>
              <option>Light Mode</option>
            </select>
          </div>
        </section>

        {/* Security Section */}
        <section style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500', color: '#fff' }}>Security</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Password</p>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Reset your account password.</p>
            </div>
            <button onClick={handleResetPassword} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
              Send Reset Link
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '1rem', marginBottom: '0.25rem', color: '#ff6b6b' }}>Danger Zone</p>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Permanently delete your account and all data.</p>
            </div>
            <button style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', fontSize: '0.875rem' }}>
              Delete Account
            </button>
          </div>
        </section>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button 
            onClick={handleSignOut}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
          >
            Sign out <Arrow />
          </button>

          <button style={{ background: '#fff', color: '#000', padding: '0.75rem 2rem', borderRadius: '9999px', fontWeight: '500' }}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
