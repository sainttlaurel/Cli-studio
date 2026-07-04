import { nanoid } from 'nanoid';

const KEY = 'clickstudio_session_id';

/**
 * Returns a stable anonymous id for this browser, generating and
 * persisting one on first use. Used to scope Supabase Storage paths
 * per "session" without requiring any real authentication.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = nanoid(12);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
