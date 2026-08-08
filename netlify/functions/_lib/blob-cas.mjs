import { HttpError } from './http.mjs'

export async function updateJsonAtomically(store, key, updater, { maxAttempts = 6 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const snapshot = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' })
    const current = snapshot?.data ?? null
    const outcome = await updater(current)
    if (!outcome || outcome.value === undefined) return { value: current, result: outcome?.result, modified: false }

    const write = await store.setJSON(key, outcome.value, snapshot
      ? { onlyIfMatch: snapshot.etag }
      : { onlyIfNew: true })
    if (write.modified) return { value: outcome.value, result: outcome.result, modified: true }
  }
  throw new HttpError(409, 'CONCURRENT_UPDATE', 'This record changed while it was being saved. Please retry.')
}
