import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { buildTrustedOrder, calculateOrder, PaymentInputError } from '../netlify/functions/_lib/payment-core.mjs'
import { verifyHmac } from '../netlify/functions/_lib/http.mjs'
import createOrder from '../netlify/functions/create-razorpay-order.mjs'
import adminDashboard from '../netlify/functions/admin-dashboard.mjs'

const cart = [{ productId: 'brazil-blue-away', size: 'M', color: 'Navy', quantity: 2, price: 1 }]
const calculated = calculateOrder(cart)
assert.equal(calculated.subtotal, 2598, 'The server catalogue must control product pricing')
assert.equal(calculated.shipping, 50)
assert.equal('tax' in calculated, false)
assert.equal(calculated.total, 2648)
assert.equal(calculated.amount, 264800)

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
assert.equal(trusted.amount, 264800)
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

const adminWithoutToken = await adminDashboard(new Request('http://localhost/api/admin/dashboard'))
assert.equal(adminWithoutToken.status, 401, 'Admin data must never be returned without a Firebase bearer token')

console.log('Payment security tests passed.')
