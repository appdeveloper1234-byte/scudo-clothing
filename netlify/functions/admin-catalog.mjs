import { archiveCatalogProduct, listCatalogProducts, saveCatalogProduct } from './_lib/catalog-store.mjs'
import { requireAdmin } from './_lib/admin-auth.mjs'
import { assertTrustedOrigin, handleError, HttpError, json, readJson } from './_lib/http.mjs'

export default async (request) => {
  try {
    assertTrustedOrigin(request)
    const admin = await requireAdmin(request)
    if (request.method === 'GET') return json(200, { products: await listCatalogProducts({ includeArchived: true }) })
    if (request.method === 'POST' || request.method === 'PATCH') {
      const product = await saveCatalogProduct(await readJson(request, 30000), admin, { create: request.method === 'POST' })
      return json(request.method === 'POST' ? 201 : 200, { product, products: await listCatalogProducts({ includeArchived: true }) })
    }
    if (request.method === 'DELETE') {
      const payload = await readJson(request, 2000)
      const product = await archiveCatalogProduct(payload.id, admin)
      return json(200, { product, products: await listCatalogProducts({ includeArchived: true }) })
    }
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET, POST, PATCH, and DELETE requests are accepted.')
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/admin/catalog',
  rateLimit: { windowLimit: 90, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
