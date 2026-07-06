 // @ts-nocheck
// supabase/functions/upload-strip/index.ts
//
// Server-side, rate-limited replacement for the old client-side upload.
// The caller's identity now comes from a verified Supabase Auth JWT
// (an anonymous sign-in's access token) instead of a client-supplied
// sessionId string — the earlier version let a form field name any
// session it wanted, which meant rate limiting (and, later, per-user
// data like Session History) could be spoofed or bypassed by simply
// claiming a different id. Deriving the user id from the verified JWT
// closes that: the caller cannot claim to be anyone other than the
// session they're actually authenticated as.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy upload-strip
//
// Note: this NO LONGER uses --no-verify-jwt. Every caller now has a real
// (anonymous) Supabase Auth session and therefore a real JWT, so the
// platform's built-in verification applies. If you redeploy over an
// older --no-verify-jwt version, redeploy without that flag.

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
    const authHeader = req.headers.get('Authorization') ?? '';

    // Client scoped to the caller's own JWT, used only to verify who
    // they are — this does NOT bypass RLS, unlike the service-role
    // client below used for the actual write.
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'Not authenticated.' }, 401);
    }
    const userId = userData.user.id;

    const form = await req.formData();
    const file = form.get('file');
    const theme = String(form.get('theme') ?? 'pink').slice(0, 32);
    const filter = String(form.get('filter') ?? 'none').slice(0, 32);
    const caption = String(form.get('caption') ?? '').slice(0, 60);

    if (!(file instanceof File)) {
      return json({ error: 'Missing file.' }, 400);
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

    // --- Rate limit: cap strips per user per rolling hour ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('strips')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', userId)
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
    const path = `${userId}/${id}.png`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('strips')
      .upload(path, bytes, { contentType: 'image/png', upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('strips').getPublicUrl(path);

    const { error: insertError } = await supabase.from('strips').insert({
      id,
      session_id: userId,
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      theme,
      filter,
      caption: caption || null,
      is_public: false,
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