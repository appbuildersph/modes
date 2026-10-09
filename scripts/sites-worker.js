// Cloudflare worker entry used by OpenAI Sites. Static files are supplied by
// the platform's ASSETS binding; Vercel continues to use the normal Vite build.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404 || request.method !== 'GET') return response

    const acceptsHtml = request.headers.get('accept')?.includes('text/html')
    if (!acceptsHtml) return response

    const indexUrl = new URL('/index.html', request.url)
    return env.ASSETS.fetch(new Request(indexUrl, request))
  },
}
