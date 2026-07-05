// supabase/functions/cleanup-expired-strips/index.ts
//
// Deletes strips older than 30 days — both the DB row AND the Storage
// object, since a SQL-only `pg_cron` job (see schema.sql) can only clean
// the table, not the file sitting in Storage.
//
// Deploy: supabase functions deploy cleanup-expired-strips --no-verify-jwt
//
// Then schedule it to run automatically. Easiest path: Supabase Dashboard
// -> Edge Functions -> cleanup-expired-strips -> Cron, e.g. "0 3 * * *"
// (daily at 3am). If your project's dashboard doesn't have that yet, use
// the pg_cron + pg_net alternative commented in schema.sql, which calls
// this function's URL directly from Postgres on a schedule.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const RETENTION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: expired, error: fetchError } = await supabase
      .from('strips')
      .select('id, storage_path')
      .lt('created_at', cutoff);

    if (fetchError) throw fetchError;
    if (!expired || expired.length === 0) {
      return json({ deleted: 0 });
    }

    const paths = expired.map((s) => s.storage_path).filter((p): p is string => Boolean(p));
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from('strips').remove(paths);
      if (removeError) throw removeError;
    }

    const ids = expired.map((s) => s.id);
    const { error: deleteError } = await supabase.from('strips').delete().in('id', ids);
    if (deleteError) throw deleteError;

    return json({ deleted: ids.length });
  } catch (err) {
    console.error(err);
    return json({ error: 'Cleanup failed.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
