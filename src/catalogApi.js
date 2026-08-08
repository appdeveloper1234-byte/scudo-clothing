export async function loadStoreCatalog() {
  const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
  if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Catalog service unavailable')
  const payload = await response.json()
  return Array.isArray(payload.products) ? payload.products : []
}
