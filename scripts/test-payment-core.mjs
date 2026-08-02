import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { buildTrustedOrder, calculateOrder, PaymentInputError } from '../netlify/functions/_lib/payment-core.mjs'
import { verifyHmac } from '../netlify/functions/_lib/http.mjs'
import createOrder from '../netlify/functions/create-razorpay-order.mjs'

const cart = [{ productId: 'brazil-blue-away', size: 'M', color: 'Navy', quantity: 2, price: 1 }]
const calculated = calculateOrder(cart)
assert.equal(calculated.subtotal, 2998, 'The server catalogue must control product pricing')
assert.equal(calculated.shipping, 150)
assert.equal(calculated.tax, 150)
assert.equal(calculated.total, 3298)
assert.equal(calculated.amount, 329800)

const trusted = buildTrustedOrder({
  termsAccepted: true,
  items: cart,
  customer: {
    name: 'Scudo Tester',
    email: 'tester@example.com',
    phone: '+919876543210',
    address: '11 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postal: '400001'
  }
})
assert.equal(trusted.amount, 329800)
assert.equal(trusted.customer.email, 'tester@example.com')

assert.throws(() => calculateOrder([{ ...cart[0], quantity: 99 }]), PaymentInputError)
assert.throws(() => calculateOrder([{ ...cart[0], size: 'INVALID' }]), PaymentInputError)
assert.throws(() => buildTrustedOrder({ termsAccepted: false, items: cart, customer: trusted.customer }), PaymentInputError)

const secret = 'test_secret_never_used_in_production'
const message = 'order_test|pay_test'
const signature = createHmac('sha256', secret).update(message).digest('hex')
assert.equal(verifyHmac(message, signature, secret), true)
assert.equal(verifyHmac(message, '0'.repeat(64), secret), false)

const methodResponse = await createOrder(new Request('http://localhost/api/payments/order'))
assert.equal(methodResponse.status, 405)

const originResponse = await createOrder(new Request('http://localhost/api/payments/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' },
  body: JSON.stringify({})
}))
assert.equal(originResponse.status, 403)

console.log('Payment security tests passed.')
