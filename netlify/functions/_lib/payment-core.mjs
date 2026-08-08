import { products } from '../../../src/productCatalog.js'

export class PaymentInputError extends Error {
  constructor(message, code = 'INVALID_REQUEST', status = 400) {
    super(message)
    this.name = 'PaymentInputError'
    this.code = code
    this.status = status
  }
}

const MAX_DISTINCT_ITEMS = 20
const MAX_QUANTITY_PER_LINE = 5
const SHIPPING_CHARGE = 50

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string') throw new PaymentInputError(`${field} is required.`)
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized || normalized.length > maxLength) throw new PaymentInputError(`${field} is invalid.`)
  return normalized
}

function optionalText(value, maxLength) {
  if (value == null || value === '') return ''
  if (typeof value !== 'string') throw new PaymentInputError('An address field is invalid.')
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export function validateCustomer(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PaymentInputError('Customer details are required.')
  const customer = {
    name: requiredText(input.name, 'Full name', 80),
    email: requiredText(input.email, 'Email address', 120).toLowerCase(),
    phone: requiredText(input.phone, 'Phone number', 24),
    address: requiredText(input.address, 'Address', 220),
    address2: optionalText(input.address2, 120),
    landmark: optionalText(input.landmark, 120),
    city: requiredText(input.city, 'City', 80),
    state: requiredText(input.state || 'Not specified', 'State', 80),
    country: requiredText(input.country || 'India', 'Country', 60),
    postal: requiredText(input.postal, 'Postal code', 12)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new PaymentInputError('Enter a valid email address.')
  const phoneDigits = customer.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) throw new PaymentInputError('Enter a valid phone number.')
  if (customer.country.toLowerCase() !== 'india') throw new PaymentInputError('Scudo currently ships only within India.')
  customer.country = 'India'
  if (!/^[1-9][0-9]{5}$/.test(customer.postal)) throw new PaymentInputError('Enter a valid 6-digit Indian postal code.')
  return customer
}

export function calculateOrder(inputItems, catalogProducts = products) {
  if (!Array.isArray(inputItems) || inputItems.length === 0 || inputItems.length > MAX_DISTINCT_ITEMS) {
    throw new PaymentInputError('Your bag must contain between 1 and 20 items.')
  }

  const productById = new Map(catalogProducts.map((product) => [product.id, product]))
  const consolidated = new Map()
  const requestedByProduct = new Map()
  for (const input of inputItems) {
    if (!input || typeof input !== 'object') throw new PaymentInputError('A bag item is invalid.')
    const productId = requiredText(input.productId, 'Product', 80)
    const product = productById.get(productId)
    if (!product || product.isSoldOut) throw new PaymentInputError('A product in your bag is no longer available.', 'PRODUCT_UNAVAILABLE', 409)
    const size = requiredText(input.size, 'Size', 12)
    const color = requiredText(input.color, 'Colour', 40)
    const quantity = Number(input.quantity)
    if (!product.sizes.includes(size) || !product.colors.includes(color)) throw new PaymentInputError('A selected product option is invalid.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) throw new PaymentInputError('Item quantity must be between 1 and 5.')
    const productQuantity = (requestedByProduct.get(productId) || 0) + quantity
    if (productQuantity > product.inventory) {
      throw new PaymentInputError(`The requested quantity for ${product.name} is unavailable.`, 'INSUFFICIENT_STOCK', 409)
    }
    requestedByProduct.set(productId, productQuantity)
    const key = `${productId}|${size}|${color}`
    const previous = consolidated.get(key)
    const combinedQuantity = (previous?.quantity || 0) + quantity
    if (combinedQuantity > MAX_QUANTITY_PER_LINE || combinedQuantity > product.inventory) {
      throw new PaymentInputError(`The requested quantity for ${product.name} is unavailable.`, 'INSUFFICIENT_STOCK', 409)
    }
    consolidated.set(key, { product, productId, size, color, quantity: combinedQuantity })
  }

  const lineItems = [...consolidated.values()].map(({ product, productId, size, color, quantity }) => {
    const unitAmount = product.salePrice || product.price
    return { productId, name: product.name, sku: product.sku, size, color, quantity, unitAmount, lineTotal: unitAmount * quantity }
  })
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const shipping = SHIPPING_CHARGE
  const total = subtotal + shipping
  if (!Number.isSafeInteger(total) || total < 1) throw new PaymentInputError('The order total is invalid.')
  return { lineItems, subtotal, shipping, total, amount: total * 100, currency: 'INR' }
}

export function buildTrustedOrder(payload, catalogProducts = products) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new PaymentInputError('Invalid payment request.')
  if (payload.termsAccepted !== true) throw new PaymentInputError('Accept the terms, return policy, and privacy policy to continue.')
  return { customer: validateCustomer(payload.customer), ...calculateOrder(payload.items, catalogProducts) }
}
