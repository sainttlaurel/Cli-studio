// Client-side helper for calling the upload-strip edge function.
// Uploads go through this server-side function (instead of writing to
// Supabase directly with the anon key) so uploads can be rate-limited
// per user. See supabase/functions/upload-strip for the server side.
//
// The caller's identity is established by the Authorization bearer token
// (the signed-in anonymous session's access token) — the edge function
// verifies it and derives the user id itself, rather than trusting a
// client-supplied sessionId field.

import { getAccessToken } from './session';

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

export interface UploadStripInput {
  file: Blob;
  theme: string;
  filter: string;
  caption: string;
}

export interface UploadStripResult {
  id: string;
  imageUrl: string;
}

export async function uploadStrip(input: UploadStripInput): Promise<UploadStripResult> {
  const accessToken = await getAccessToken();

  const form = new FormData();
  form.append('file', input.file, 'strip.png');
  form.append('theme', input.theme);
  form.append('filter', input.filter);
  form.append('caption', input.caption);

  const res = await fetch(`${FUNCTIONS_URL}/upload-strip`, {
    method: 'POST',
    headers: {
      // The user's own access token identifies *who* is calling.
      Authorization: `Bearer ${accessToken}`,
      // Supabase's API gateway still requires the project's anon key
      // here regardless of which bearer token is used for identity.
      apikey: ANON_KEY,
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? `Upload failed (${res.status}).`);
  }

  return data as UploadStripResult;
}