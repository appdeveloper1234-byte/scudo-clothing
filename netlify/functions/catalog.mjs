import { listCatalogProducts, publicCatalogProduct } from './_lib/catalog-store.mjs'
import { handleError, HttpError, json } from './_lib/http.mjs'

export default async (request) => {
  try {
    if (request.method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET requests are accepted.')
    const products = (await listCatalogProducts()).map(publicCatalogProduct)
    return json(200, { products, generatedAt: new Date().toISOString() }, { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/catalog',
  rateLimit: { windowLimit: 180, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
