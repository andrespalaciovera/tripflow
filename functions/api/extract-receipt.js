// Cloudflare Pages Function — will proxy receipt photo extraction to
// OpenRouter so the API key is never exposed client-side (AGENTS.md, section 2).
// Stub only: not implemented yet.

export async function onRequest() {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
}
