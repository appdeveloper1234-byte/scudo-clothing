import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { buildTrustedOrder, calculateOrder, PaymentInputError } from '../netlify/functions/_lib/payment-core.mjs'
import { readText, verifyHmac } from '../netlify/functions/_lib/http.mjs'
import { applyFulfilmentTransition, applyPaymentTransition, OrderStateError } from '../netlify/functions/_lib/order-state.mjs'
import { updateJsonAtomically } from '../netlify/functions/_lib/blob-cas.mjs'
import { reserveInventory, settleInventory } from '../netlify/functions/_lib/inventory-store.mjs'
import createOrder from '../netlify/functions/create-razorpay-order.mjs'
import adminDashboard from '../netlify/functions/admin-dashboard.mjs'
import adminCatalog from '../netlify/functions/admin-catalog.mjs'
import adminCatalogImage from '../netlify/functions/admin-catalog-image.mjs'
import { normalizeCatalogProduct } from '../netlify/functions/_lib/catalog-store.mjs'

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

const managedProduct = normalizeCatalogProduct({
  name: 'Scudo Test Jeans',
  slug: 'scudo-test-jeans',
  sku: 'SC-TEST-JEANS',
  category: 'Jeans',
  collection: 'Everyday',
  description: 'A test catalog product used to verify managed pricing.',
  price: 2999,
  salePrice: 1999,
  inventory: 6,
  sizes: ['30', '32'],
  colors: ['Indigo'],
  images: ['/test-jeans.webp']
})
const managedOrder = calculateOrder([{ productId: managedProduct.id, size: '32', color: 'Indigo', quantity: 2, price: 1 }], [managedProduct])
assert.equal(managedOrder.subtotal, 3998, 'Managed catalog sale pricing must control checkout totals')
assert.equal(managedOrder.total, 4048)
assert.throws(() => calculateOrder([{ productId: managedProduct.id, size: '34', color: 'Indigo', quantity: 1 }], [managedProduct]), PaymentInputError)
assert.throws(() => normalizeCatalogProduct({ ...managedProduct, salePrice: managedProduct.price }), /Discounted price/)
assert.throws(() => calculateOrder([
  { productId: managedProduct.id, size: '30', color: 'Indigo', quantity: 4 },
  { productId: managedProduct.id, size: '32', color: 'Indigo', quantity: 3 }
], [managedProduct]), /unavailable/, 'Variants must share one product-level inventory limit')

const paidOrder = applyPaymentTransition({ status: 'processing' }, 'paid', { paymentId: 'pay_test' }, '2026-01-01T00:00:00.000Z')
assert.equal(applyPaymentTransition(paidOrder, 'failed').status, 'paid', 'A late failure event must not downgrade captured funds')
assert.throws(() => applyFulfilmentTransition({ status: 'processing' }, 'packing'), OrderStateError)
assert.equal(applyFulfilmentTransition({ status: 'paid', fulfilmentStatus: 'unfulfilled' }, 'packing').fulfilmentStatus, 'packing')
assert.throws(() => applyFulfilmentTransition({ status: 'paid', fulfilmentStatus: 'shipped' }, 'packing'), OrderStateError)

let pulls = 0
const oversized = new Request('http://localhost/upload', {
  method: 'POST', duplex: 'half',
  body: new ReadableStream({
    pull(controller) {
      pulls += 1
      controller.enqueue(new Uint8Array(8))
      if (pulls === 4) controller.close()
    }
  })
})
await assert.rejects(() => readText(oversized, 10), (error) => error.status === 413)
assert.ok(pulls < 4, 'Oversized bodies must be rejected before the entire stream is buffered')

class FakeStore {
  constructor() { this.values = new Map(); this.etags = new Map() }
  async get(key) { return this.values.get(key) ?? null }
  async getWithMetadata(key) {
    if (!this.values.has(key)) return null
    return { data: structuredClone(this.values.get(key)), etag: this.etags.get(key) }
  }
  async setJSON(key, value, options = {}) {
    const exists = this.values.has(key)
    if (options.onlyIfNew && exists) return { modified: false }
    if (options.onlyIfMatch && this.etags.get(key) !== options.onlyIfMatch) return { modified: false }
    const etag = String(Number(this.etags.get(key) || 0) + 1)
    this.values.set(key, structuredClone(value))
    this.etags.set(key, etag)
    return { modified: true, etag }
  }
}

const inventoryStore = new FakeStore()
await reserveInventory('reservation-one', [{ productId: managedProduct.id, quantity: 4 }], [managedProduct], inventoryStore)
await assert.rejects(
  () => reserveInventory('reservation-two', [{ productId: managedProduct.id, quantity: 3 }], [managedProduct], inventoryStore),
  (error) => error.code === 'INSUFFICIENT_STOCK'
)
await settleInventory('reservation-one', 'failed', inventoryStore)
await reserveInventory('reservation-two', [{ productId: managedProduct.id, quantity: 3 }], [managedProduct], inventoryStore)
await settleInventory('reservation-two', 'paid', inventoryStore)
await settleInventory('reservation-two', 'failed', inventoryStore)
assert.equal((await inventoryStore.get('inventory/state')).products[managedProduct.id].available, 3, 'Committed stock must not be restored by a late failure')
await reserveInventory('reservation-three', [{ productId: managedProduct.id, quantity: 3 }], [managedProduct], inventoryStore)
await settleInventory('reservation-three', 'failed', inventoryStore)
await settleInventory('reservation-three', 'paid', inventoryStore)
assert.equal((await inventoryStore.get('inventory/state')).products[managedProduct.id].available, 0, 'A late captured payment must consume stock that an expired or failed reservation released')

const atomicStore = new FakeStore()
await Promise.all([1, 1].map(() => updateJsonAtomically(atomicStore, 'counter', async (current) => {
  await new Promise((resolve) => setTimeout(resolve, 5))
  return { value: { count: (current?.count || 0) + 1 } }
})))
assert.equal((await atomicStore.get('counter')).count, 2, 'Conditional writes must retry instead of losing concurrent updates')

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
const catalogWithoutToken = await adminCatalog(new Request('http://localhost/api/admin/catalog'))
assert.equal(catalogWithoutToken.status, 401, 'Catalog data must never be editable without a Firebase bearer token')
const imageWithoutToken = await adminCatalogImage(new Request('http://localhost/api/admin/catalog/image', { method: 'POST' }))
assert.equal(imageWithoutToken.status, 401, 'Catalog images must never be uploaded without a Firebase bearer token')

console.log('Payment security tests passed.')
