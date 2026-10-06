/**
 * Supabase Edge Functions CORS Utility
 * 
 * Configurable via environment variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g. "https://zyrobet.vercel.app,http://localhost:8081")
 * - WEB_APP_ORIGIN: Single web origin (e.g. "https://zyrobet.vercel.app")
 * 
 * Defaults to "*" if unconfigured.
 */

export function getCorsHeaders(req?: Request): Record<string, string> {
  const envAllowed =
    (typeof Deno !== 'undefined'
      ? Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('WEB_APP_ORIGIN')
      : null) || '*';

  let allowOrigin = '*';

  if (envAllowed !== '*') {
    const origins = envAllowed.split(',').map((o) => o.trim().toLowerCase());
    const reqOrigin = req?.headers?.get('Origin')?.toLowerCase();

    if (reqOrigin && origins.includes(reqOrigin)) {
      allowOrigin = req?.headers?.get('Origin') || reqOrigin;
    } else if (origins.length > 0 && !origins.includes('*')) {
      allowOrigin = origins[0];
    }
  } else if (req?.headers?.get('Origin')) {
    allowOrigin = req.headers.get('Origin')!;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

export const corsHeaders = {
  get 'Access-Control-Allow-Origin'() {
    return (
      (typeof Deno !== 'undefined'
        ? Deno.env.get('WEB_APP_ORIGIN') || Deno.env.get('ALLOWED_ORIGINS')
        : null) || '*'
    );
  },
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}
