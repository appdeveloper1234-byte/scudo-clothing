import { getStore } from '@netlify/blobs'
import { requireAuthenticatedUser } from './_lib/admin-auth.mjs'
import { assertTrustedOrigin, handleError, HttpError, json, readJson } from './_lib/http.mjs'

const PROFILE_STORE = 'scudo-customer-profiles'
const clean = (value, maxLength) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)

function validProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'INVALID_PROFILE', 'Delivery details are required.')
  const profile = {
    name: clean(input.name, 80),
    phone: clean(input.phone, 24),
    address: clean(input.address, 220),
    address2: clean(input.address2, 120),
    landmark: clean(input.landmark, 120),
    city: clean(input.city, 80),
    state: clean(input.state, 80),
    postal: clean(input.postal, 6),
    country: 'India'
  }
  if (profile.name.length < 2) throw new HttpError(400, 'INVALID_NAME', 'Enter your full name.')
  const phoneDigits = profile.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) throw new HttpError(400, 'INVALID_PHONE', 'Enter a valid phone number.')
  if (profile.address.length < 5) throw new HttpError(400, 'INVALID_ADDRESS', 'Enter your house number and street address.')
  if (profile.city.length < 2 || profile.state.length < 2) throw new HttpError(400, 'INVALID_LOCATION', 'Enter your city and state.')
  if (!/^[1-9][0-9]{5}$/.test(profile.postal)) throw new HttpError(400, 'INVALID_POSTAL', 'Enter a valid 6-digit Indian PIN code.')
  return profile
}

const publicProfile = (record) => record ? ({
  name: record.name,
  phone: record.phone,
  address: record.address,
  address2: record.address2 || '',
  landmark: record.landmark || '',
  city: record.city,
  state: record.state,
  postal: record.postal,
  country: 'India',
  updatedAt: record.updatedAt
}) : null

export default async (request) => {
  try {
    assertTrustedOrigin(request)
    const user = await requireAuthenticatedUser(request)
    const store = getStore(PROFILE_STORE)
    const key = `profiles/${user.uid}`

    if (request.method === 'GET') {
      const profile = await store.get(key, { type: 'json', consistency: 'strong' })
      return json(200, { profile: publicProfile(profile) })
    }
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET and POST requests are accepted.')

    const profile = validProfile(await readJson(request, 12000))
    const existing = await store.get(key, { type: 'json', consistency: 'strong' })
    const now = new Date().toISOString()
    const record = {
      version: 1,
      uid: user.uid,
      email: user.email,
      ...profile,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    }
    await store.setJSON(key, record)
    return json(200, { profile: publicProfile(record) })
  } catch (error) {
    return handleError(error)
  }
}

export const config = {
  path: '/api/customer/profile',
  rateLimit: { windowLimit: 45, windowSize: 60, aggregateBy: ['ip', 'domain'] }
}
