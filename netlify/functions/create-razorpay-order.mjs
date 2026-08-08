import { randomBytes } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { requireAuthenticatedUser } from './_lib/admin-auth.mjs'
import { buildTrustedOrder } from './_lib/payment-core.mjs'
import { listCatalogProducts } from './_lib/catalog-store.mjs'
import { assertIdempotencyKey, claimCheckout, completeCheckoutClaim, failCheckoutClaim } from './_lib/checkout-guard.mjs'
import { catalogWithAvailability, reserveInventory, settleInventory } from './_lib/inventory-store.mjs'
import { assertPost, assertTrustedOrigin, handleError, HttpError, json, razorpayCredentials, razorpayRequest, readJson } from './_lib/http.mjs'

function clientOrder(record) {
  const { keyId } = razorpayCredentials()
  return {
    keyId,
    orderId: record.razorpayOrderId,
    receipt: record.receipt,
    amount: record.amount,
    currency: record.currency,
    breakdown: { subtotal: record.subtotal, shipping: record.shipping, total: record.amount / 100 },
    items: record.lineItems.map(({ productId, name, size, color, quantity, unitAmount }) => ({ productId, name, size, color, quantity, unitAmount }))
  }
}

export default async (request) => {
  let attemptKey = ''
  let reservationId = ''
  let completed = false
  try {
    assertPost(request)
    assertTrustedOrigin(request)
    const user = await requireAuthenticatedUser(request)
    if (!user.emailVerified || !user.email) throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Verify your account email before starting payment.')
    const idempotencyKey = assertIdempotencyKey(request)
    const payload = await readJson(request)
    const configuredCatalog = await listCatalogProducts()
    const catalog = await catalogWithAvailability(configuredCatalog)
    const trusted = buildTrustedOrder(payload, catalog)
    if (trusted.customer.email !== user.email) throw new HttpError(400, 'ACCOUNT_EMAIL_MISMATCH', 'Use the email address connected to your signed-in account.')

    const claim = await claimCheckout(user.uid, idempotencyKey)
    attemptKey = claim.attemptKey
    const orders = getStore('scudo-payment-orders')
    if (claim.replay) {
      if (claim.status === 'completed' && claim.orderId) {
        const existing = await orders.get(`orders/${claim.orderId}`, { type: 'json', consistency: 'strong' })
        if (existing?.customerUid === user.uid) {
          completed = true
          return json(200, clientOrder(existing))
        }
      }
      throw new HttpError(409, 'CHECKOUT_ALREADY_STARTED', 'This checkout attempt has already been used. Refresh and try again.')
    }

    reservationId = `checkout:${user.uid}:${idempotencyKey}`
    await reserveInventory(reservationId, trusted.lineItems, configuredCatalog)
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
      lineItems: trusted.lineItems,
      customer: trusted.customer,
      customerUid: user.uid,
      idempotencyKey,
      inventoryReservationId: reservationId,
      inventoryStatus: 'reserved',
      status: 'created',
      fulfilmentStatus: 'unfulfilled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const stored = await orders.setJSON(`orders/${razorpayOrder.id}`, record, { onlyIfNew: true })
    if (!stored.modified) throw new Error('Duplicate Razorpay order identifier')
    await completeCheckoutClaim(attemptKey, { orderId: razorpayOrder.id })
    completed = true
    return json(201, clientOrder(record))
  } catch (error) {
    if (!completed) {
      if (reservationId) await settleInventory(reservationId, 'failed').catch(() => {})
      if (attemptKey) await failCheckoutClaim(attemptKey)
    }
    return handleError(error)
  }
}

export const config = {
  path: '/api/payments/order',
  rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
