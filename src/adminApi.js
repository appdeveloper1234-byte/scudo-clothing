import { getFirebaseIdToken } from './firebaseAuth.js'

export class AdminApiError extends Error {
  constructor(code, message, status = 500) {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
    this.status = status
  }
}

async function adminRequest(options = {}) {
  const token = await getFirebaseIdToken(options.forceRefresh)
  const response = await fetch('/api/admin/dashboard', {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin'
  })
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (!isJson) {
    const message = response.status === 502
      ? 'The admin service failed to start. Check the latest Netlify function deploy and Firebase Admin environment variables.'
      : 'The admin API route returned a webpage instead of JSON. Check the Netlify function deployment.'
    throw new AdminApiError('ADMIN_ROUTE_UNAVAILABLE', message, response.status)
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = payload?.error || {}
    const fallback = response.status === 502
      ? 'The admin service failed to start. Check the latest Netlify function deploy and Firebase Admin environment variables.'
      : 'The admin service could not complete this request.'
    throw new AdminApiError(error.code || 'ADMIN_REQUEST_FAILED', error.message || fallback, response.status)
  }
  return payload
}

export const loadAdminDashboard = (forceRefresh = false) => adminRequest({ forceRefresh })

export const updateAdminOrder = ({ orderId, fulfilmentStatus, trackingNumber }) => adminRequest({
  method: 'PATCH',
  body: { orderId, fulfilmentStatus, trackingNumber }
})
