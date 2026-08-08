import { getStore } from '@netlify/blobs'
import { HttpError } from './http.mjs'
import { updateJsonAtomically } from './blob-cas.mjs'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 4

export function assertIdempotencyKey(request) {
  const key = request.headers.get('x-idempotency-key') || ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Refresh checkout and try again.')
  }
  return key
}

export async function claimCheckout(uid, idempotencyKey, store = getStore('scudo-checkout-guard')) {
  const attemptKey = `attempts/${uid}/${idempotencyKey}`
  const existing = await store.get(attemptKey, { type: 'json', consistency: 'strong' })
  if (existing) return { ...existing, attemptKey, replay: true }

  const now = Date.now()
  await updateJsonAtomically(store, `quotas/${uid}`, (current) => {
    const attempts = (current?.attempts || []).filter((timestamp) => now - timestamp < WINDOW_MS)
    if (attempts.length >= MAX_ATTEMPTS) throw new HttpError(429, 'CHECKOUT_RATE_LIMITED', 'Too many checkout attempts. Wait a few minutes before trying again.')
    return { value: { attempts: [...attempts, now], updatedAt: new Date(now).toISOString() } }
  })

  const record = { status: 'pending', createdAt: new Date(now).toISOString() }
  const write = await store.setJSON(attemptKey, record, { onlyIfNew: true })
  if (!write.modified) return { ...(await store.get(attemptKey, { type: 'json', consistency: 'strong' })), attemptKey, replay: true }
  return { ...record, attemptKey, replay: false }
}

export async function completeCheckoutClaim(attemptKey, details, store = getStore('scudo-checkout-guard')) {
  await updateJsonAtomically(store, attemptKey, (current) => ({
    value: { ...current, ...details, status: 'completed', completedAt: new Date().toISOString() }
  }))
}

export async function failCheckoutClaim(attemptKey, store = getStore('scudo-checkout-guard')) {
  if (!attemptKey) return
  await updateJsonAtomically(store, attemptKey, (current) => ({
    value: { ...current, status: 'failed', failedAt: new Date().toISOString() }
  })).catch(() => {})
}
