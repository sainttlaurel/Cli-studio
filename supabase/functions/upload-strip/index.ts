// supabase/functions/upload-strip/index.ts
//
// Server-side, rate-limited replacement for the old client-side upload.
// Previously the browser wrote directly to Storage + the strips table
// using the public anon key, which anyone could call in an unlimited
// loop. Now the client sends the finished PNG here; this function checks
// a per-session rate limit and does the actual write with the service
// role key, which bypasses RLS. The anon insert/upload policies have been
// removed from schema.sql accordingly — only this function (and the
// cleanup function) can write to `strips` and the `strips` bucket now.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy upload-strip --no-verify-jwt
//
// --no-verify-jwt because this app has no user accounts — the anon key
// identifies "some browser", not a signed-in user, so there's no JWT to
// verify. Rate limiting below is what actually protects this endpoint.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_STRIPS_PER_HOUR = 12;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB safety cap

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    const sessionId = String(form.get('sessionId') ?? '').trim();
    const theme = String(form.get('theme') ?? 'pink').slice(0, 32);
    const filter = String(form.get('filter') ?? 'none').slice(0, 32);
    const caption = String(form.get('caption') ?? '').slice(0, 60);

    if (!(file instanceof File)) {
      return json({ error: 'Missing file.' }, 400);
    }
    if (!sessionId || sessionId.length > 64) {
      return json({ error: 'Missing or invalid session id.' }, 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return json({ error: 'Image is too large.' }, 413);
    }
    if (file.type !== 'image/png') {
      return json({ error: 'Only PNG uploads are accepted.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // --- Rate limit: cap strips per session per rolling hour ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('strips')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .gte('created_at', oneHourAgo);

    if (countError) throw countError;
    if ((count ?? 0) >= MAX_STRIPS_PER_HOUR) {
      return json(
        {
          error: `You've hit the limit of ${MAX_STRIPS_PER_HOUR} strips per hour. Please try again a bit later.`,
        },
        429
      );
    }

    // --- Upload + insert (service role bypasses RLS) ---
    const id = crypto.randomUUID().slice(0, 8);
    const path = `${sessionId}/${id}.png`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('strips')
      .upload(path, bytes, { contentType: 'image/png', upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('strips').getPublicUrl(path);

    const { error: insertError } = await supabase.from('strips').insert({
      id,
      session_id: sessionId,
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      theme,
      filter,
      caption: caption || null,
    });
    if (insertError) throw insertError;

    return json({ id, imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error(err);
    return json({ error: 'Something went wrong uploading your strip. Please try again.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
