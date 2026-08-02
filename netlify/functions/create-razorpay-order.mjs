import { randomBytes } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { buildTrustedOrder } from './_lib/payment-core.mjs'
import { assertPost, assertTrustedOrigin, handleError, json, razorpayCredentials, razorpayRequest, readJson } from './_lib/http.mjs'

export default async (request) => {
  try {
    assertPost(request)
    assertTrustedOrigin(request)
    const payload = await readJson(request)
    const trusted = buildTrustedOrder(payload)
    const receipt = `SC-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const razorpayOrder = await razorpayRequest('/orders', {
      method: 'POST',
      body: {
        amount: trusted.amount,
        currency: trusted.currency,
        receipt,
        partial_payment: false,
        notes: { source: 'scudo_web', item_count: String(trusted.lineItems.reduce((sum, item) => sum + item.quantity, 0)) }
      }
    })
    if (razorpayOrder.amount !== trusted.amount || razorpayOrder.currency !== trusted.currency) throw new Error('Razorpay returned an unexpected order total')

    const record = {
      version: 1,
      receipt,
      razorpayOrderId: razorpayOrder.id,
      amount: trusted.amount,
      currency: trusted.currency,
      subtotal: trusted.subtotal,
      shipping: trusted.shipping,
      tax: trusted.tax,
      lineItems: trusted.lineItems,
      customer: trusted.customer,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const orders = getStore('scudo-payment-orders')
    const stored = await orders.setJSON(`orders/${razorpayOrder.id}`, record, { onlyIfNew: true })
    if (!stored.modified) throw new Error('Duplicate Razorpay order identifier')
    const { keyId } = razorpayCredentials()
    return json(201, {
      keyId,
      orderId: razorpayOrder.id,
      receipt,
      amount: trusted.amount,
      currency: trusted.currency,
      breakdown: { subtotal: trusted.subtotal, shipping: trusted.shipping, tax: trusted.tax, total: trusted.total },
      items: trusted.lineItems.map(({ productId, name, size, color, quantity, unitAmount }) => ({ productId, name, size, color, quantity, unitAmount }))
    })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/payments/order',
  rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
