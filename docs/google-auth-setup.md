# Google sign-in handoff

The client now uses Supabase Auth for Google sign-in, email/password sign-in, registration, session restoration, and the existing protected workspace routes. Public pages remain usable without Supabase configuration.

## Project configuration

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `client/.env.local` (or the frontend hosting environment). The legacy `VITE_SUPABASE_ANON_KEY` is also supported. Use only a public publishable/anon key in the client; never a service-role key or Google client secret.
2. In Google Cloud, create a Web application OAuth client. Set the authorized JavaScript origins to the actual frontend origins. Set the authorized redirect URI to the callback URL shown in Supabase's Google provider settings, typically `https://PROJECT_REF.supabase.co/auth/v1/callback`.
3. In Supabase Authentication → Providers → Google, enable Google and enter its client ID and secret.
4. In Supabase URL Configuration, set Site URL to the deployed frontend origin and allow its `/auth/callback` redirect. Add local development origins separately, for example `http://localhost:5173/auth/callback**` and `http://127.0.0.1:5173/auth/callback**`. Include the `next` query string when configuring redirect patterns; use narrow origin/path patterns. Add port 5174 only if you actually use it.
5. Rebuild/restart Vite after environment changes. Production hosting must serve the SPA for direct `/auth/callback` requests.

The client uses PKCE with automatic code exchange. Do not add a second code exchange to the callback page. `next` destinations are restricted to local routes. Registration that requires email verification shows a confirmation notice instead of prematurely opening a workspace. The old onboarding choices were not persisted; they are no longer presented as saved preferences.

## Verify with real accounts

- Google sign-in → consent → `/auth/callback` → `/app` (or the intended local destination).
- Cancel consent and retry. Reload a signed-in workspace and verify the session persists.
- Sign out and confirm protected pages return to login.
- Register by email, follow the confirmation email in the same browser, then sign in.

The frontend route guard is a navigation convenience, not backend authorization. The backend owner must enforce Supabase token verification and database/storage access policies for private resources. This UI work does not change those policies or provision a cloud project.

References: [Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [PKCE sessions](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
