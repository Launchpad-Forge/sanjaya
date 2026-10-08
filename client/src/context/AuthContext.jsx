import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let receivedEvent = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      receivedEvent = true;
      setUser(session?.user || null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (!receivedEvent) setUser(data?.session?.user || null);
      if (error) setAuthError('Your sign-in session could not be restored. Please sign in again.');
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setAuthError('Sign-in is temporarily unavailable. Please try again.');
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ user, setUser, loading, authError }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
