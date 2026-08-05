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
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin'
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = payload?.error || {}
    throw new AdminApiError(error.code || 'ADMIN_REQUEST_FAILED', error.message || 'The admin service could not complete this request.', response.status)
  }
  return payload
}

export const loadAdminDashboard = (forceRefresh = false) => adminRequest({ forceRefresh })

export const updateAdminOrder = ({ orderId, fulfilmentStatus, trackingNumber }) => adminRequest({
  method: 'PATCH',
  body: { orderId, fulfilmentStatus, trackingNumber }
})
