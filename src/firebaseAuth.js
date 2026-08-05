import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth'

const cleanEnvironmentValue = (value) => value
  ?.trim()
  .replace(/^['"]|['"]$/g, '')

const projectId = cleanEnvironmentValue(import.meta.env.VITE_FIREBASE_PROJECT_ID)

const normalizeAuthDomain = (value) => {
  const configuredDomain = cleanEnvironmentValue(value)
  if (!configuredDomain) return projectId ? `${projectId}.firebaseapp.com` : ''

  try {
    const domainUrl = /^https?:\/\//i.test(configuredDomain)
      ? new URL(configuredDomain)
      : new URL(`https://${configuredDomain}`)
    return domainUrl.hostname
  } catch {
    return configuredDomain
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .trim()
  }
}

const firebaseConfig = {
  apiKey: cleanEnvironmentValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: normalizeAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId,
  storageBucket: cleanEnvironmentValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvironmentValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvironmentValue(import.meta.env.VITE_FIREBASE_APP_ID)
}

export const isFirebaseConfigured = ['apiKey', 'authDomain', 'projectId', 'appId']
  .every((key) => Boolean(firebaseConfig[key]))

const firebaseApp = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
const googleProvider = firebaseAuth ? new GoogleAuthProvider() : null

googleProvider?.setCustomParameters({ prompt: 'select_account' })

const profileFromUser = (user) => ({
  uid: user.uid,
  name: user.displayName || user.email?.split('@')[0] || 'Scudo member',
  email: user.email || '',
  photoURL: user.photoURL || '',
  provider: user.providerData?.some((provider) => provider.providerId === 'google.com') ? 'google' : 'email'
})

const requireFirebaseAuth = () => {
  if (firebaseAuth) return firebaseAuth
  const error = new Error('Firebase is not configured.')
  error.code = 'auth/firebase-not-configured'
  throw error
}

export async function signInWithGoogle() {
  const auth = requireFirebaseAuth()
  await setPersistence(auth, browserLocalPersistence)
  const result = await signInWithPopup(auth, googleProvider)
  return profileFromUser(result.user)
}

export async function authenticateWithEmail({ mode, name, email, password }) {
  const auth = requireFirebaseAuth()
  await setPersistence(auth, browserLocalPersistence)
  const result = mode === 'signup'
    ? await createUserWithEmailAndPassword(auth, email, password)
    : await signInWithEmailAndPassword(auth, email, password)

  if (mode === 'signup' && name && result.user.displayName !== name) {
    await updateProfile(result.user, { displayName: name })
  }
  return profileFromUser(result.user)
}

export function watchFirebaseAuth(callback) {
  if (!firebaseAuth) return () => {}
  return onAuthStateChanged(firebaseAuth, (user) => callback(user ? profileFromUser(user) : null))
}

export async function signOutFirebase() {
  if (firebaseAuth?.currentUser) await signOut(firebaseAuth)
}

export async function getFirebaseIdToken(forceRefresh = false) {
  const auth = requireFirebaseAuth()
  if (!auth.currentUser) {
    const error = new Error('Sign in is required.')
    error.code = 'auth/admin-sign-in-required'
    throw error
  }
  return auth.currentUser.getIdToken(forceRefresh)
}

export function firebaseAuthErrorMessage(error, method = 'google') {
  const messages = {
    'auth/firebase-not-configured': `${method === 'google' ? 'Google sign-in' : 'Account authentication'} is not configured yet. Add the Firebase environment variables in Netlify.`,
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups and try again.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open.',
    'auth/network-request-failed': 'The network interrupted Google sign-in. Please try again.',
    'auth/unauthorized-domain': 'This website domain is not authorized in Firebase Authentication.',
    'auth/operation-not-allowed': 'Google sign-in must be enabled in the Firebase Authentication console.',
    'auth/web-storage-unsupported': 'This browser is blocking the storage Google sign-in needs. Allow site storage or try another browser.',
    'auth/operation-not-supported-in-this-environment': 'Google sign-in is not supported inside this browser window. Open the website in Chrome, Edge, Safari, or Firefox.',
    'auth/internal-error': 'Google sign-in was interrupted by the browser security policy. Refresh the page and try again.',
    'auth/invalid-api-key': 'The deployed Firebase API key is invalid. Update the Firebase environment variables in Netlify.',
    'auth/configuration-not-found': 'Firebase Authentication is not configured for this project.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
    'auth/email-already-in-use': 'An account already exists with this email address.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'The email address or password is incorrect.',
    'auth/weak-password': 'Use a stronger password with at least six characters.',
    'auth/too-many-requests': 'Too many sign-in attempts. Please wait and try again.'
  }
  const code = typeof error?.code === 'string' ? error.code : 'unknown-error'
  return messages[code] || `${method === 'google' ? 'Google sign-in' : 'Account authentication'} could not be completed (${code}). Please try again.`
}
