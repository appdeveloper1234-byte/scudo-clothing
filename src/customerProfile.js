import { getFirebaseIdToken } from './firebaseAuth.js'

const PROFILE_FIELDS = ['name', 'phone', 'address', 'address2', 'landmark', 'city', 'state', 'postal', 'country']

const clean = (value, maxLength = 220) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .slice(0, maxLength)

export function normalizeCustomerProfile(input = {}) {
  return {
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
}

export function validateCustomerProfile(input) {
  const profile = normalizeCustomerProfile(input)
  if (profile.name.length < 2) return 'Enter your full name.'
  const phoneDigits = profile.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return 'Enter a valid phone number.'
  if (profile.address.length < 5) return 'Enter your house number and street address.'
  if (profile.city.length < 2) return 'Enter your city.'
  if (profile.state.length < 2) return 'Enter your state.'
  if (!/^[1-9][0-9]{5}$/.test(profile.postal)) return 'Enter a valid 6-digit Indian PIN code.'
  return ''
}

export function isCustomerProfileComplete(input) {
  return !validateCustomerProfile(input)
}

const localKey = (uid) => `scudo-customer-profile-${uid}`
const isLocalPreview = () => ['localhost', '127.0.0.1'].includes(window.location.hostname)

export function clearCustomerProfileCache(uid) {
  if (!uid) return
  try { window.localStorage.removeItem(localKey(uid)) } catch { /* storage can be unavailable */ }
}

function readLocalProfile(uid) {
  if (!uid) return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localKey(uid)) || 'null')
    return parsed && typeof parsed === 'object' ? normalizeCustomerProfile(parsed) : null
  } catch {
    return null
  }
}

function writeLocalProfile(uid, profile) {
  if (!uid) return
  try { window.localStorage.setItem(localKey(uid), JSON.stringify(normalizeCustomerProfile(profile))) } catch { /* storage can be unavailable */ }
}

function mergeAccount(account, profile) {
  if (!account) return null
  const normalized = normalizeCustomerProfile({ ...account, ...profile, name: profile?.name || account.name })
  return { ...account, ...normalized, profileComplete: isCustomerProfileComplete(normalized) }
}

async function responseMessage(response, fallback) {
  const payload = await response.json().catch(() => ({}))
  return payload?.error?.message || fallback
}

export async function loadCustomerProfile(account) {
  if (!account?.uid) return account
  if (isLocalPreview()) return mergeAccount(account, readLocalProfile(account.uid))
  clearCustomerProfileCache(account.uid)

  try {
    const token = await getFirebaseIdToken()
    const response = await fetch('/api/customer/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      credentials: 'same-origin'
    })
    if (!response.ok) return mergeAccount(account, null)
    const payload = await response.json()
    return mergeAccount(account, payload.profile || null)
  } catch {
    return mergeAccount(account, null)
  }
}

export async function saveCustomerProfile(account, input) {
  if (!account?.uid) throw new Error('Sign in again before saving your delivery details.')
  const profile = normalizeCustomerProfile(input)
  const validationError = validateCustomerProfile(profile)
  if (validationError) throw new Error(validationError)

  if (isLocalPreview()) {
    writeLocalProfile(account.uid, profile)
    return mergeAccount(account, profile)
  }

  const token = await getFirebaseIdToken(true)
  const response = await fetch('/api/customer/profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field]])))
  })
  if (!response.ok) throw new Error(await responseMessage(response, 'Your delivery details could not be saved. Please try again.'))
  const payload = await response.json()
  return mergeAccount(account, payload.profile || profile)
}
