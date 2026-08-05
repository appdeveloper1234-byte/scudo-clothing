import { getStore } from '@netlify/blobs'
import { requireAdmin } from './_lib/admin-auth.mjs'
import { assertTrustedOrigin, handleError, HttpError, json, readJson } from './_lib/http.mjs'

const ORDER_PREFIX = 'orders/'
const FULFILMENT_STATUSES = new Set(['unfulfilled', 'packing', 'shipped', 'delivered', 'cancelled'])

const publicOrder = (order) => ({
  orderId: order.razorpayOrderId,
  receipt: order.receipt,
  amount: order.amount,
  currency: order.currency,
  paymentStatus: order.status,
  fulfilmentStatus: order.fulfilmentStatus || 'unfulfilled',
  trackingNumber: order.trackingNumber || '',
  paymentMethod: order.paymentMethod || '',
  customer: {
    name: order.customer?.name || '',
    email: order.customer?.email || '',
    phone: order.customer?.phone || '',
    address: order.customer?.address || '',
    city: order.customer?.city || '',
    state: order.customer?.state || '',
    postal: order.customer?.postal || ''
  },
  lineItems: Array.isArray(order.lineItems) ? order.lineItems : [],
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  paidAt: order.paidAt || null
})

async function listOrders(store) {
  const { blobs } = await store.list({ prefix: ORDER_PREFIX })
  const records = await Promise.all(blobs.slice(-250).map(({ key }) => store.get(key, { type: 'json', consistency: 'strong' })))
  return records.filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function dashboardPayload(orders, admin) {
  const paidOrders = orders.filter((order) => order.status === 'paid')
  const customerEmails = new Set(orders.map((order) => order.customer?.email?.toLowerCase()).filter(Boolean))
  return {
    admin,
    generatedAt: new Date().toISOString(),
    stats: {
      totalOrders: orders.length,
      paidRevenue: paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      unfulfilled: paidOrders.filter((order) => !order.fulfilmentStatus || order.fulfilmentStatus === 'unfulfilled').length,
      customers: customerEmails.size
    },
    orders: orders.map(publicOrder)
  }
}

export default async (request) => {
  try {
    assertTrustedOrigin(request)
    const admin = await requireAdmin(request)
    const orders = getStore('scudo-payment-orders')

    if (request.method === 'GET') return json(200, dashboardPayload(await listOrders(orders), admin))
    if (request.method !== 'PATCH') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET and PATCH requests are accepted.')

    const payload = await readJson(request, 8000)
    const orderId = String(payload.orderId || '')
    if (!/^order_[A-Za-z0-9]+$/.test(orderId)) throw new HttpError(400, 'INVALID_ORDER', 'Choose a valid order.')
    if (!FULFILMENT_STATUSES.has(payload.fulfilmentStatus)) throw new HttpError(400, 'INVALID_STATUS', 'Choose a valid fulfilment status.')
    const trackingNumber = String(payload.trackingNumber || '').trim()
    if (trackingNumber.length > 100) throw new HttpError(400, 'INVALID_TRACKING', 'The tracking reference is too long.')

    const key = `${ORDER_PREFIX}${orderId}`
    const order = await orders.get(key, { type: 'json', consistency: 'strong' })
    if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'This order could not be found.')
    const updated = {
      ...order,
      fulfilmentStatus: payload.fulfilmentStatus,
      trackingNumber,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email
    }
    await orders.setJSON(key, updated)
    return json(200, { order: publicOrder(updated), updatedAt: updated.updatedAt })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/admin/dashboard',
  rateLimit: { windowLimit: 90, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
