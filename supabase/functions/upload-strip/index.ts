 // @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_STRIPS_PER_HOUR = 12;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

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
