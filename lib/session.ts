import { ensureAnonSession } from './supabase';

export async function getSessionId(): Promise<string> {
  const session = await ensureAnonSession();
  if (!session?.user?.id) throw new Error('Could not establish a session.');
  return session.user.id;
}

export async function getAccessToken(): Promise<string> {
  const session = await ensureAnonSession();
  if (!session?.access_token) throw new Error('Could not establish a session.');
  return session.access_token;
}
