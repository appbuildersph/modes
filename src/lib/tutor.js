import { get, set } from 'idb-keyval'
import { getContentByRef } from './content.js'
import { LANG_NAME, DEFAULT_LANG } from './lang.js'
import { apiUrl } from './api-base.js'

// Teacher Gabay tutor — best-available-first fallback chain (build plan §8):
//   1. on-device Gemini Nano (works OFFLINE on capable laptops)
//   2. online -> POST /api/tutor (Vertex/Gemini proxy)
//   3. fully offline, no Nano -> cached Taglish explanation (the floor)
// Every reply is cached in IndexedDB (tutor:{ref}:{hash}) for offline re-reading.
// No language detection — trilingual behavior is the system prompt.

function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function findCompetency(ref) {
  return getContentByRef(ref)
}

// The system prompt. Inject the active competency (stay on-curriculum) and the
// student's chosen reply language.
export function gabayPrompt(competency, lang = DEFAULT_LANG) {
  const replyIn = LANG_NAME[lang] ?? LANG_NAME[DEFAULT_LANG]
  return `You are Teacher Gabay, a friendly math tutor for Filipino learners. Reply in ${replyIn}, regardless of the language the student writes in. Teach using this DepEd MATATAG competency: "${competency}". Use Filipino real-life examples (palengke, jeepney fare, sari-sari store). Never just give the final answer — guide step by step. Keep it short and warm. Do not use markdown formatting — no asterisks, no bold, no bullet symbols, plain text only.`
}

// Source of the answer, for UI labelling.
export const SOURCE = { NANO: 'nano', ONLINE: 'online', CACHED: 'cached' }

async function nanoAvailable() {
  try {
    return (
      typeof self !== 'undefined' &&
      'LanguageModel' in self &&
      (await self.LanguageModel.availability()) === 'available'
    )
  } catch {
    return false
  }
}

export async function askTeacherGabay(question, ref, lang = DEFAULT_LANG) {
  const competency = findCompetency(ref)
  const sysPrompt = gabayPrompt(competency?.competency ?? '', lang)
  // Cache per language — same question in EN vs Taglish are different answers.
  const cacheKey = `tutor:${ref}:${lang}:${hash(question)}`

  const cached = await get(cacheKey)
  if (cached) return { text: cached.text, source: cached.source, fromCache: true }

  // 1. On-device Nano — offline-capable
  if (await nanoAvailable()) {
    try {
      const session = await self.LanguageModel.create({
        initialPrompts: [{ role: 'system', content: sysPrompt }],
      })
      const text = await session.prompt(question)
      session.destroy?.()
      await set(cacheKey, { text, source: SOURCE.NANO })
      return { text, source: SOURCE.NANO, fromCache: false }
    } catch {
      /* fall through */
    }
  }

  // 2. Online — Vertex/Gemini via proxy
  if (navigator.onLine) {
    try {
      const res = await fetch(apiUrl('/api/tutor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only ref + lang go over the wire. The server builds the system
        // prompt itself from the bundled curriculum — a client-supplied
        // systemInstruction would make /api/tutor an open Gemini proxy.
        body: JSON.stringify({ question, ref, lang }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.text
        await set(cacheKey, { text, source: SOURCE.ONLINE })
        return { text, source: SOURCE.ONLINE, fromCache: false }
      }
    } catch {
      /* fall through */
    }
  }

  // 3. Floor — cached pre-generated explanation in the chosen language
  const offline = {
    en: "Sorry, we're offline and on-device AI isn't ready yet. Read the explanation on the board first. 💛",
    fil: 'Pasensya, offline tayo at wala pang on-device AI. Basahin muna ang paliwanag sa pisara. 💛',
    taglish: 'Pasensya, offline tayo at wala pang on-device AI. Basahin muna ang paliwanag sa pisara. 💛',
  }
  const text =
    competency?.explanation?.[lang] ??
    competency?.explanation?.taglish ??
    (offline[lang] ?? offline.taglish)
  return { text, source: SOURCE.CACHED, fromCache: false }
}
