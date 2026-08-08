import { randomUUID } from 'node:crypto'
import { catalogStore } from './_lib/catalog-store.mjs'
import { requireAdmin } from './_lib/admin-auth.mjs'
import { assertTrustedOrigin, handleError, HttpError, json } from './_lib/http.mjs'

const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif']
])
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export default async (request) => {
  try {
    assertTrustedOrigin(request)
    const admin = await requireAdmin(request)
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.')
    const form = await request.formData()
    const file = form.get('image')
    if (!file || typeof file.arrayBuffer !== 'function') throw new HttpError(400, 'IMAGE_REQUIRED', 'Choose a product photo to upload.')
    const extension = IMAGE_TYPES.get(file.type)
    if (!extension) throw new HttpError(415, 'IMAGE_TYPE_NOT_ALLOWED', 'Upload a JPG, PNG, WebP, or AVIF image.')
    if (!file.size || file.size > MAX_IMAGE_BYTES) throw new HttpError(413, 'IMAGE_TOO_LARGE', 'Product photos must be smaller than 4 MB.')
    const id = `${randomUUID()}.${extension}`
    await catalogStore().set(`images/${id}`, await file.arrayBuffer(), {
      metadata: { contentType: file.type, fileName: String(file.name || '').slice(0, 180), uploadedBy: admin.email, uploadedAt: new Date().toISOString() }
    })
    return json(201, { image: { id, url: `/api/catalog/images/${id}`, contentType: file.type, size: file.size } })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/admin/catalog/image',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
