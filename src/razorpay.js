const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise

export class PaymentFlowError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'PaymentFlowError'
    this.code = code
  }
}

async function requestJson(path, payload) {
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    })
  } catch {
    throw new PaymentFlowError('NETWORK_ERROR', 'Could not reach secure payments. Check your connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok && response.status !== 202) {
    throw new PaymentFlowError(data?.error?.code || 'PAYMENT_REQUEST_FAILED', data?.error?.message || 'Secure payment could not be completed.')
  }
  return { data, status: response.status }
}

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)
    const script = existing || document.createElement('script')
    const timer = window.setTimeout(() => reject(new PaymentFlowError('CHECKOUT_LOAD_TIMEOUT', 'Razorpay Checkout took too long to load. Please try again.')), 12000)
    script.addEventListener('load', () => { window.clearTimeout(timer); window.Razorpay ? resolve(window.Razorpay) : reject(new PaymentFlowError('CHECKOUT_UNAVAILABLE', 'Razorpay Checkout is unavailable.')) }, { once: true })
    script.addEventListener('error', () => { window.clearTimeout(timer); scriptPromise = null; reject(new PaymentFlowError('CHECKOUT_LOAD_FAILED', 'Razorpay Checkout could not be loaded.')) }, { once: true })
    if (!existing) { script.src = CHECKOUT_SCRIPT; script.async = true; script.referrerPolicy = 'strict-origin-when-cross-origin'; document.head.appendChild(script) }
  })
  return scriptPromise
}

function openCheckout(Razorpay, order, customer) {
  return new Promise((resolve, reject) => {
    let failureMessage = ''
    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'Scudo Clothing',
      description: `Order ${order.receipt}`,
      handler: resolve,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      notes: { receipt: order.receipt },
      theme: { color: '#215c3d', backdrop_color: '#111111' },
      modal: {
        backdropclose: false,
        escape: true,
        confirm_close: true,
        ondismiss: () => reject(new PaymentFlowError('PAYMENT_CANCELLED', failureMessage || 'Payment was cancelled. Your bag has not been cleared.'))
      }
    })
    checkout.on('payment.failed', (event) => { failureMessage = event?.error?.description || 'Payment failed. Choose another method or try again.' })
    checkout.open()
  })
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

export async function payWithRazorpay({ cart, customer, termsAccepted, onStage = () => {} }) {
  onStage('creating')
  const items = cart.map((item) => ({ productId: item.product.id, size: item.size, color: item.color, quantity: item.quantity }))
  const [{ data: order }, Razorpay] = await Promise.all([
    requestJson('/api/payments/order', { items, customer, termsAccepted }),
    loadRazorpayCheckout()
  ])
  onStage('awaiting')
  const payment = await openCheckout(Razorpay, order, customer)
  onStage('verifying')
  let verification
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await requestJson('/api/payments/verify', {
      orderId: order.orderId,
      paymentId: payment.razorpay_payment_id,
      signature: payment.razorpay_signature
    })
    verification = result.data
    if (result.status === 200 && verification?.paid) return verification
    if (attempt < 3) await wait(1200)
  }
  if (verification?.verified) return verification
  throw new PaymentFlowError('PAYMENT_NOT_VERIFIED', 'Payment could not be verified. Do not retry the charge; contact Scudo support.')
}
