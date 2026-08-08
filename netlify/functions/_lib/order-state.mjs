export class OrderStateError extends Error {
  constructor(message, code = 'INVALID_ORDER_TRANSITION', status = 409) {
    super(message)
    this.name = 'OrderStateError'
    this.code = code
    this.status = status
  }
}

const PAYMENT_STATUSES = new Set(['created', 'processing', 'failed', 'paid'])
const FULFILMENT_SEQUENCE = ['unfulfilled', 'packing', 'shipped', 'delivered']

export function applyPaymentTransition(order, requestedStatus, details = {}, now = new Date().toISOString()) {
  const currentStatus = PAYMENT_STATUSES.has(order?.status) ? order.status : 'created'
  if (!PAYMENT_STATUSES.has(requestedStatus)) throw new OrderStateError('Choose a valid payment status.')

  // Captured funds are terminal. A delayed failure webhook must never undo a paid order.
  const status = currentStatus === 'paid' ? 'paid' : requestedStatus
  return {
    ...order,
    status,
    paymentId: details.paymentId || order.paymentId || null,
    paymentMethod: details.paymentMethod || order.paymentMethod || null,
    paidAt: status === 'paid' ? (order.paidAt || now) : (order.paidAt || null),
    updatedAt: now
  }
}

export function applyFulfilmentTransition(order, requestedStatus, details = {}, now = new Date().toISOString()) {
  const current = order?.fulfilmentStatus || 'unfulfilled'
  const valid = new Set([...FULFILMENT_SEQUENCE, 'cancelled'])
  if (!valid.has(current) || !valid.has(requestedStatus)) throw new OrderStateError('Choose a valid fulfilment status.', 'INVALID_STATUS', 400)
  if (current === 'cancelled' && requestedStatus !== 'cancelled') throw new OrderStateError('A cancelled order cannot be reopened.')
  if (current === 'delivered' && requestedStatus !== 'delivered') throw new OrderStateError('A delivered order cannot move backwards.')
  if (requestedStatus !== 'unfulfilled' && requestedStatus !== 'cancelled' && order.status !== 'paid') {
    throw new OrderStateError('Only paid orders can enter fulfilment.', 'PAYMENT_REQUIRED', 409)
  }
  if (requestedStatus !== 'cancelled' && FULFILMENT_SEQUENCE.indexOf(requestedStatus) < FULFILMENT_SEQUENCE.indexOf(current)) {
    throw new OrderStateError('Fulfilment cannot move backwards.')
  }

  return {
    ...order,
    fulfilmentStatus: requestedStatus,
    trackingNumber: details.trackingNumber ?? order.trackingNumber ?? '',
    updatedBy: details.updatedBy || order.updatedBy || '',
    updatedAt: now
  }
}
