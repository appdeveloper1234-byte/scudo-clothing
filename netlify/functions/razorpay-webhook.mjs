import { getStore } from '@netlify/blobs'
import { updateJsonAtomically } from './_lib/blob-cas.mjs'
import { settleInventory } from './_lib/inventory-store.mjs'
import { applyPaymentTransition } from './_lib/order-state.mjs'
import { handleError, HttpError, json, readText, verifyHmac } from './_lib/http.mjs'

export default async (request) => {
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED', 'Webhook verification is unavailable.')
    const rawBody = await readText(request, 250000, 'Webhook payload is too large.')
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
        let requestedStatus = order.status
        if (event.event === 'payment.captured' || event.event === 'order.paid') requestedStatus = 'paid'
        if (event.event === 'payment.failed') requestedStatus = 'failed'
        const amountMatches = !payment || (payment.amount === order.amount && payment.currency === order.currency)
        if (!amountMatches) throw new HttpError(400, 'PAYMENT_MISMATCH', 'Webhook payment does not match the stored order.')
        const settlement = requestedStatus === 'paid' || requestedStatus === 'failed'
          ? await settleInventory(order.inventoryReservationId, requestedStatus === 'paid' ? 'paid' : 'failed')
          : null
        await updateJsonAtomically(orders, `orders/${orderId}`, (current) => {
          if (!current) return { value: undefined }
          return { value: {
            ...applyPaymentTransition(current, requestedStatus, {
              paymentId: payment?.id,
              paymentMethod: payment?.method
            }),
            inventoryStatus: settlement?.result?.status || current.inventoryStatus || null
          } }
        })
      }
    }
    await events.setJSON(`events/${eventId}`, { event: event.event || 'unknown', orderId: orderId || null, processedAt: new Date().toISOString() }, { onlyIfNew: true })
    return json(200, { received: true })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/payments/webhook',
  rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
