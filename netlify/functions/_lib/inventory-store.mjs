import { getStore } from '@netlify/blobs'
import { HttpError } from './http.mjs'
import { updateJsonAtomically } from './blob-cas.mjs'

const INVENTORY_KEY = 'inventory/state'
const RESERVATION_TTL_MS = 20 * 60 * 1000

function aggregate(lineItems) {
  const totals = new Map()
  for (const item of lineItems || []) totals.set(item.productId, (totals.get(item.productId) || 0) + Number(item.quantity || 0))
  return [...totals].map(([productId, quantity]) => ({ productId, quantity }))
}

function normalizedState(input, catalogProducts = [], now = Date.now()) {
  const state = input && typeof input === 'object'
    ? { version: 1, products: { ...(input.products || {}) }, reservations: { ...(input.reservations || {}) } }
    : { version: 1, products: {}, reservations: {} }

  for (const product of catalogProducts) {
    const configured = Number(product.inventory || 0)
    const existing = state.products[product.id]
    if (!existing) state.products[product.id] = { configured, available: configured }
    else if (existing.configured !== configured) {
      state.products[product.id] = {
        configured,
        available: Math.max(0, Math.min(configured, Number(existing.available || 0) + configured - Number(existing.configured || 0)))
      }
    }
  }

  for (const [id, reservation] of Object.entries(state.reservations)) {
    if (reservation.status === 'reserved' && Date.parse(reservation.expiresAt || '') <= now) {
      for (const item of reservation.items || []) {
        const stock = state.products[item.productId]
        if (stock) stock.available = Math.min(stock.configured, stock.available + item.quantity)
      }
      state.reservations[id] = { ...reservation, status: 'expired', settledAt: new Date(now).toISOString() }
    }
  }
  return state
}

export async function catalogWithAvailability(catalogProducts, store = getStore('scudo-inventory')) {
  const stored = await store.get(INVENTORY_KEY, { type: 'json', consistency: 'strong' })
  const state = normalizedState(stored, catalogProducts)
  return catalogProducts.map((product) => {
    const available = state.products[product.id]?.available ?? Number(product.inventory || 0)
    return { ...product, inventory: available, availableInventory: available, isSoldOut: product.isSoldOut === true || available === 0 }
  })
}

export async function syncInventoryCatalog(catalogProducts, store = getStore('scudo-inventory')) {
  return updateJsonAtomically(store, INVENTORY_KEY, (current) => ({ value: normalizedState(current, catalogProducts) }))
}

export async function reserveInventory(reservationId, lineItems, catalogProducts, store = getStore('scudo-inventory')) {
  const items = aggregate(lineItems)
  const now = Date.now()
  return updateJsonAtomically(store, INVENTORY_KEY, (current) => {
    const state = normalizedState(current, catalogProducts, now)
    const existing = state.reservations[reservationId]
    if (existing?.status === 'reserved' || existing?.status === 'committed') return { value: undefined, result: existing }
    for (const item of items) {
      if ((state.products[item.productId]?.available || 0) < item.quantity) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK', 'One or more products no longer have enough stock.')
      }
    }
    for (const item of items) state.products[item.productId].available -= item.quantity
    const reservation = {
      status: 'reserved', items,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + RESERVATION_TTL_MS).toISOString()
    }
    state.reservations[reservationId] = reservation
    return { value: state, result: reservation }
  })
}

export async function settleInventory(reservationId, outcome, store = getStore('scudo-inventory')) {
  const now = Date.now()
  return updateJsonAtomically(store, INVENTORY_KEY, (current) => {
    const state = normalizedState(current, [], now)
    const reservation = state.reservations[reservationId]
    if (!reservation) return { value: undefined, result: { status: 'missing' } }
    if (outcome === 'paid') {
      if (reservation.status === 'committed') return { value: undefined, result: reservation }
      let shortfall = false
      if (reservation.status !== 'reserved') {
        for (const item of reservation.items || []) {
          const stock = state.products[item.productId]
          if (!stock) {
            shortfall = true
          } else if (stock.available < item.quantity) {
            stock.available = 0
            shortfall = true
          } else {
            stock.available -= item.quantity
          }
        }
      }
      state.reservations[reservationId] = { ...reservation, status: shortfall ? 'oversold' : 'committed', settledAt: new Date(now).toISOString() }
    } else if (reservation.status === 'reserved') {
      for (const item of reservation.items || []) {
        const stock = state.products[item.productId]
        if (stock) stock.available = Math.min(stock.configured, stock.available + item.quantity)
      }
      state.reservations[reservationId] = { ...reservation, status: 'released', settledAt: new Date(now).toISOString() }
    }
    return { value: state, result: state.reservations[reservationId] }
  })
}
