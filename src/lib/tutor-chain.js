import { applyMode, isValidReply } from './tutor-modes.js'

// Provider loop behind askTeacherGabay, split out so Node tests can drive it
// with fake providers and a memory store (same pattern as question-session.js).
// providers: [{ source, available(), run() }] in best-available-first order.
// Every provider's text goes through applyMode; a reply that fails
// isValidReply falls through to the next provider instead of reaching a child.
export async function runTutorChain({ providers, store, cacheKey, mode, lang, floor }) {
  const cached = await store.get(cacheKey)
  if (cached) return { text: cached.text, source: cached.source, fromCache: true }

  for (const provider of providers) {
    try {
      if (!(await provider.available())) continue
      const text = applyMode(mode, lang, await provider.run())
      if (!isValidReply(text)) continue
      await store.set(cacheKey, { text, source: provider.source })
      return { text, source: provider.source, fromCache: false }
    } catch {
      /* fall through to the next provider */
    }
  }

  return floor()
}
