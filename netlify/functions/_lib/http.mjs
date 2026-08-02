import { createHmac, timingSafeEqual } from 'node:crypto'
import { PaymentInputError } from './payment-core.mjs'

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
}

export const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { ...responseHeaders, ...headers } })

export function assertPost(request) {
  if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.')
}

export function assertTrustedOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const allowed = new Set([new URL(request.url).origin])
  for (const value of [process.env.URL, process.env.PAYMENT_ALLOWED_ORIGIN]) {
    for (const candidate of String(value || '').split(',')) {
      try { if (candidate.trim()) allowed.add(new URL(candidate.trim()).origin) } catch { /* ignore malformed configuration */ }
    }
  }
  if (!allowed.has(origin)) throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'This payment request is not allowed.')
}

export async function readJson(request, maxBytes = 30000) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send payment requests as JSON.')
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > maxBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'The payment request is too large.')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).length > maxBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'The payment request is too large.')
  try { return JSON.parse(raw) } catch { throw new HttpError(400, 'INVALID_JSON', 'The payment request is invalid.') }
}

export function razorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new HttpError(503, 'PAYMENTS_NOT_CONFIGURED', 'Secure payments are temporarily unavailable.')
  return { keyId, keySecret }
}

export async function razorpayRequest(path, { method = 'GET', body } = {}) {
  const { keyId, keySecret } = razorpayCredentials()
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  let response
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000)
    })
  } catch {
    throw new HttpError(502, 'PAYMENT_PROVIDER_UNAVAILABLE', 'The payment provider did not respond. Please try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('Razorpay API request failed', { status: response.status, code: data?.error?.code || 'UNKNOWN' })
    throw new HttpError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider could not process this request. Please try again.')
  }
  return data
}

export function assertProviderId(value, prefix) {
  if (typeof value !== 'string' || !new RegExp(`^${prefix}_[A-Za-z0-9]+$`).test(value)) throw new HttpError(400, 'INVALID_PAYMENT_REFERENCE', 'The payment reference is invalid.')
  return value
}

export function verifyHmac(message, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(message).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function handleError(error) {
  if (error instanceof HttpError || error instanceof PaymentInputError) return json(error.status || 400, { error: { code: error.code || 'INVALID_REQUEST', message: error.message } })
  console.error('Unhandled payment function error', { name: error?.name || 'Error' })
  return json(500, { error: { code: 'INTERNAL_ERROR', message: 'Secure payments are temporarily unavailable.' } })
}
