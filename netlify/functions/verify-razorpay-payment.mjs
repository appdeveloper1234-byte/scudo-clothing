import { getStore } from '@netlify/blobs'
import { requireAuthenticatedUser } from './_lib/admin-auth.mjs'
import { updateJsonAtomically } from './_lib/blob-cas.mjs'
import { settleInventory } from './_lib/inventory-store.mjs'
import { applyPaymentTransition } from './_lib/order-state.mjs'
import { assertPost, assertProviderId, assertTrustedOrigin, handleError, HttpError, json, razorpayCredentials, razorpayRequest, readJson, verifyHmac } from './_lib/http.mjs'

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export default async (request) => {
  try {
    assertPost(request)
    assertTrustedOrigin(request)
    const user = await requireAuthenticatedUser(request)
    const payload = await readJson(request, 8000)
    const orderId = assertProviderId(payload.orderId, 'order')
    const paymentId = assertProviderId(payload.paymentId, 'pay')
    const orders = getStore('scudo-payment-orders')
    const order = await orders.get(`orders/${orderId}`, { type: 'json', consistency: 'strong' })
    if (!order || order.razorpayOrderId !== orderId) throw new HttpError(404, 'ORDER_NOT_FOUND', 'This payment order could not be found.')
    if ((order.customerUid && order.customerUid !== user.uid) || (!order.customerUid && order.customer?.email !== user.email)) {
      throw new HttpError(404, 'ORDER_NOT_FOUND', 'This payment order could not be found.')
    }
    const { keySecret } = razorpayCredentials()
    if (!verifyHmac(`${order.razorpayOrderId}|${paymentId}`, payload.signature, keySecret)) throw new HttpError(400, 'INVALID_PAYMENT_SIGNATURE', 'Payment verification failed.')

    let payment
    for (let attempt = 0; attempt < 4; attempt += 1) {
      payment = await razorpayRequest(`/payments/${paymentId}`)
      if (payment.status === 'captured' || payment.captured === true || payment.status === 'failed') break
      if (attempt < 3) await wait(650)
    }
    if (payment.order_id !== orderId || payment.amount !== order.amount || payment.currency !== order.currency) {
      throw new HttpError(400, 'PAYMENT_MISMATCH', 'Payment details do not match this order.')
    }
    const paid = payment.status === 'captured' || payment.captured === true
    const requestedStatus = payment.status === 'failed' ? 'failed' : paid ? 'paid' : 'processing'
    const settlement = requestedStatus === 'paid' || requestedStatus === 'failed'
      ? await settleInventory(order.inventoryReservationId, requestedStatus === 'paid' ? 'paid' : 'failed')
      : null
    const { value: updated } = await updateJsonAtomically(orders, `orders/${orderId}`, (current) => {
      if (!current) throw new HttpError(404, 'ORDER_NOT_FOUND', 'This payment order could not be found.')
      if ((current.customerUid && current.customerUid !== user.uid) || (!current.customerUid && current.customer?.email !== user.email)) {
        throw new HttpError(404, 'ORDER_NOT_FOUND', 'This payment order could not be found.')
      }
      return { value: {
        ...applyPaymentTransition(current, requestedStatus, { paymentId, paymentMethod: payment.method || null }),
        customerUid: current.customerUid || user.uid,
        inventoryStatus: settlement?.result?.status || current.inventoryStatus || null
      } }
    })
    if (payment.status === 'failed' && updated.status !== 'paid') throw new HttpError(402, 'PAYMENT_FAILED', 'Razorpay reported that this payment failed.')
    return json(updated.status === 'paid' ? 200 : 202, {
      verified: true,
      paid: updated.status === 'paid',
      status: updated.status,
      order: { orderId, paymentId, receipt: order.receipt, amount: order.amount, currency: order.currency }
    })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/payments/verify',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
