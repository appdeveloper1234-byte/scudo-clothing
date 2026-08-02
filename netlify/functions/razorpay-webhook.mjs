import { getStore } from '@netlify/blobs'
import { handleError, HttpError, json, verifyHmac } from './_lib/http.mjs'

export default async (request) => {
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED', 'Webhook verification is unavailable.')
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).length > 250000) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Webhook payload is too large.')
    const signature = request.headers.get('x-razorpay-signature') || ''
    if (!verifyHmac(rawBody, signature, webhookSecret)) throw new HttpError(400, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed.')
    const eventId = request.headers.get('x-razorpay-event-id')
    if (!eventId || !/^[A-Za-z0-9_-]{6,160}$/.test(eventId)) throw new HttpError(400, 'INVALID_EVENT_ID', 'Webhook event identifier is missing.')
    let event
    try { event = JSON.parse(rawBody) } catch { throw new HttpError(400, 'INVALID_JSON', 'Webhook payload is invalid.') }

    const events = getStore('scudo-payment-webhook-events')
    const duplicate = await events.get(`events/${eventId}`, { type: 'json', consistency: 'strong' })
    if (duplicate) return json(200, { received: true, duplicate: true })

    const payment = event?.payload?.payment?.entity
    const razorpayOrder = event?.payload?.order?.entity
    const orderId = payment?.order_id || razorpayOrder?.id
    if (typeof orderId === 'string' && /^order_[A-Za-z0-9]+$/.test(orderId)) {
      const orders = getStore('scudo-payment-orders')
      const order = await orders.get(`orders/${orderId}`, { type: 'json', consistency: 'strong' })
      if (order) {
        let status = order.status
        if (event.event === 'payment.captured' || event.event === 'order.paid') status = 'paid'
        if (event.event === 'payment.failed') status = 'failed'
        const amountMatches = !payment || (payment.amount === order.amount && payment.currency === order.currency)
        if (!amountMatches) throw new HttpError(400, 'PAYMENT_MISMATCH', 'Webhook payment does not match the stored order.')
        await orders.setJSON(`orders/${orderId}`, {
          ...order,
          status,
          paymentId: payment?.id || order.paymentId || null,
          paymentMethod: payment?.method || order.paymentMethod || null,
          paidAt: status === 'paid' ? (order.paidAt || new Date().toISOString()) : order.paidAt || null,
          updatedAt: new Date().toISOString()
        })
      }
    }
    await events.setJSON(`events/${eventId}`, { event: event.event || 'unknown', orderId: orderId || null, processedAt: new Date().toISOString() }, { onlyIfNew: true })
    return json(200, { received: true })
  } catch (error) {
    return handleError(error)
  }
}

export const config = { path: '/api/payments/webhook' }
