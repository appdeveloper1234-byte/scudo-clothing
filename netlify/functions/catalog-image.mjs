import { catalogStore } from './_lib/catalog-store.mjs'
import { handleError, HttpError } from './_lib/http.mjs'

export default async (request, context) => {
  try {
    if (request.method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET requests are accepted.')
    const id = String(context?.params?.id || '').trim()
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/i.test(id)) throw new HttpError(404, 'IMAGE_NOT_FOUND', 'This product image could not be found.')
    const result = await catalogStore().getWithMetadata(`images/${id}`, { type: 'arrayBuffer', consistency: 'strong' })
    if (!result?.data) throw new HttpError(404, 'IMAGE_NOT_FOUND', 'This product image could not be found.')
    return new Response(result.data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': result.metadata?.contentType || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/catalog/images/:id',
  rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
