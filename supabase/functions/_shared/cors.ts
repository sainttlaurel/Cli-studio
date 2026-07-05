// Shared CORS headers for all edge functions.
// The '*' origin is permissive to keep local dev simple; once you know
// your production domain, narrow this to it, e.g.
// 'Access-Control-Allow-Origin': 'https://clickstudio.app'
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
