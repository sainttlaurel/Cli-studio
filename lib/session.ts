import { ensureAnonSession } from './supabase';

/**
 * Returns the current anonymous session's user id — a real Supabase Auth
 * `auth.uid()`, backed by an anonymous sign-in — creating that session on
 * first call if one doesn't exist yet.
 *
 * This replaces the earlier client-generated nanoid stored in
 * localStorage: that string was just data the browser happened to send
 * along, unverifiable by the server or by RLS. `auth.uid()` is issued and
 * verified by Supabase Auth itself, which is what lets Session History,
 * the gallery opt-in, and rate limiting actually enforce "this is your
 * own stuff" instead of trusting whatever the client claims.
 */
export async function getSessionId(): Promise<string> {
  const session = await ensureAnonSession();
  if (!session?.user?.id) throw new Error('Could not establish a session.');
  return session.user.id;
}

/**
 * Returns the current session's access token. Used to authenticate
 * requests to the upload-strip edge function as this specific anonymous
 * user (via a verified JWT), rather than as the shared, unattributed
 * anon API key.
 */
export async function getAccessToken(): Promise<string> {
  const session = await ensureAnonSession();
  if (!session?.access_token) throw new Error('Could not establish a session.');
  return session.access_token;
}