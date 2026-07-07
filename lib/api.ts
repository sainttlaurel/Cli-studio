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
      Authorization: `Bearer ${accessToken}`,
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
