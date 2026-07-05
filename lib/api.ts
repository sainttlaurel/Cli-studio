// Client-side helper for calling the upload-strip edge function.
// Uploads now go through this server-side function (instead of writing
// to Supabase directly with the anon key) so uploads can be rate-limited
// per session. See supabase/functions/upload-strip for the server side.

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

export interface UploadStripInput {
  file: Blob;
  sessionId: string;
  theme: string;
  filter: string;
  caption: string;
}

export interface UploadStripResult {
  id: string;
  imageUrl: string;
}

export async function uploadStrip(input: UploadStripInput): Promise<UploadStripResult> {
  const form = new FormData();
  form.append('file', input.file, 'strip.png');
  form.append('sessionId', input.sessionId);
  form.append('theme', input.theme);
  form.append('filter', input.filter);
  form.append('caption', input.caption);

  const res = await fetch(`${FUNCTIONS_URL}/upload-strip`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
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
