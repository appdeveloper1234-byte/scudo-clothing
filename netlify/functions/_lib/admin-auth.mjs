import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { HttpError } from './http.mjs'

const APP_NAME = 'scudo-admin'

const clean = (value) => String(value || '').trim()

function serviceAccount() {
  const encoded = clean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)
  if (encoded) {
    try {
      const parsed = JSON.parse(encoded)
      if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
      return parsed
    } catch {
      throw new HttpError(503, 'SERVER_AUTH_NOT_CONFIGURED', 'Secure account storage is not configured correctly.')
    }
  }

  const projectId = clean(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)
  const clientEmail = clean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL)
  const privateKey = clean(process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new HttpError(503, 'SERVER_AUTH_NOT_CONFIGURED', 'Secure account storage is not configured yet.')
  }
  return { projectId, clientEmail, privateKey }
}

function adminApp() {
  const existing = getApps().find((app) => app.name === APP_NAME)
  if (existing) return existing
  const credentials = serviceAccount()
  return initializeApp({ credential: cert(credentials), projectId: credentials.projectId }, APP_NAME)
}

function bearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) throw new HttpError(401, 'SIGN_IN_REQUIRED', 'Sign in to continue.')
  return match[1]
}

export async function requireAuthenticatedUser(request) {
  const token = bearerToken(request)
  let decoded
  try {
    decoded = await getAuth(adminApp()).verifyIdToken(token, true)
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'SESSION_INVALID', 'Your session has expired. Sign in again.')
  }

  return {
    uid: decoded.uid,
    email: clean(decoded.email).toLowerCase(),
    emailVerified: decoded.email_verified === true,
    name: clean(decoded.name) || clean(decoded.email).split('@')[0] || 'Scudo member',
    decoded
  }
}

export async function requireAdmin(request) {
  const user = await requireAuthenticatedUser(request)
  const { decoded } = user

  const email = user.email
  const allowedEmails = new Set(clean(process.env.ADMIN_EMAILS)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean))
  if (decoded.admin !== true) {
    if (!allowedEmails.size) throw new HttpError(503, 'ADMIN_ACCESS_NOT_CONFIGURED', 'Admin access is not configured. Add ADMIN_EMAILS in Netlify and redeploy.')
    if (!allowedEmails.has(email)) throw new HttpError(403, 'ADMIN_ACCESS_DENIED', 'This account is not listed for Scudo admin access.')
    if (decoded.email_verified !== true) throw new HttpError(403, 'ADMIN_EMAIL_NOT_VERIFIED', 'Verify this email address, then retry admin access.')
  }

  return {
    uid: user.uid,
    email,
    name: user.name || email.split('@')[0] || 'Admin'
  }
}
