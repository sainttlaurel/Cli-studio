import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase environment variables are missing. Copy .env.example to .env.local and fill in your project values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures the current browser has a signed-in Supabase Auth session,
 * creating an anonymous one on first visit if needed. Supabase persists
 * the session (default localStorage-backed), so returning visitors keep
 * the same `auth.uid()` across reloads — that's what Session History,
 * the gallery opt-in, and per-user rate limiting are now anchored to,
 * instead of a client-generated string nobody could actually verify.
 */
export async function ensureAnonSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signInData.session;
}