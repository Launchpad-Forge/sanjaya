import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(url && /^https?:\/\//.test(url) && key && !key.startsWith('your_'));

// Public pages must work before the project's public credentials are supplied.
export const supabase = configured ? createClient(url, key, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
}) : null;
export const authConfigured = Boolean(supabase);
