import { get, set } from 'idb-keyval'
import { getContentByRef } from './content.js'
import { DEFAULT_LANG } from './lang.js'
import { buildTutorPrompt } from './tutor-prompt.js'
import { DEFAULT_MODE, applyMode, normalizeMode } from './tutor-modes.js'
import { lessonTeaching } from './lesson-teaching.js'
import { edgeAvailable, edgeTutor } from './edge-llm.js'
import { runTutorChain } from './tutor-chain.js'
import { apiUrl } from './api-base.js'

// Teacher Gabo tutor — best-available-first fallback chain (build plan §8):
//   1. on-device Gemini Nano (works OFFLINE on capable laptops)
//   2. on-device open model via transformers.js (SOURCE.LOCAL; added with local-llm.js)
//   3. edge hub: Gemma on the Mac over the LAN (SOURCE.EDGE, D-018)
//   4. online -> POST /api/tutor (Vertex/Gemini proxy)
//   5. fully offline, no Nano -> cached Taglish explanation (the floor)
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

// Thin wrapper over the prompt shared with api/tutor.js (src/lib/tutor-prompt.js).
export function gabayPrompt(competency, lang = DEFAULT_LANG, options) {
  return buildTutorPrompt(competency, lang, options)
}

// Source of the answer, for UI labelling.
export const SOURCE = { NANO: 'nano', LOCAL: 'local', EDGE: 'edge', ONLINE: 'online', CACHED: 'cached' }

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

export async function askTeacherGabay(question, ref, lang = DEFAULT_LANG, mode = DEFAULT_MODE) {
  const competency = findCompetency(ref)
  const sysPrompt = gabayPrompt(competency?.competency ?? '', lang, { mode })
  // Cache per language and mode — the same question gives different answers.
  const cacheKey = `tutor:${ref}:${lang}:${normalizeMode(mode)}:${hash(question)}`

  const providers = [
    {
      source: SOURCE.NANO,
      available: nanoAvailable,
      async run() {
        const session = await self.LanguageModel.create({
          initialPrompts: [{ role: 'system', content: sysPrompt }],
        })
        try {
          return await session.prompt(question)
        } finally {
          session.destroy?.()
        }
      },
    },
    {
      // Teacher Gabo AI server: Gemma on the team's Mac, reached over the network (D-018).
      source: SOURCE.EDGE,
      available: () => edgeAvailable(),
      run: () => edgeTutor({ question, ref, lang, mode: normalizeMode(mode) }),
    },
    {
      source: SOURCE.ONLINE,
      available: async () => navigator.onLine,
      async run() {
        const res = await fetch(apiUrl('/api/tutor'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Only ref + lang + mode go over the wire. The server builds the
          // system prompt itself from the bundled curriculum — a client-supplied
          // systemInstruction would make /api/tutor an open Gemini proxy.
          body: JSON.stringify({ question, ref, lang, mode: normalizeMode(mode) }),
        })
        if (!res.ok) throw new Error('tutor_http')
        return (await res.json()).text
      },
    },
  ]

  // Floor — cached pre-generated explanation in the chosen language
  const offline = {
    en: "Sorry, we're offline and on-device AI isn't ready yet. Read the explanation on the board first. 💛",
    fil: 'Pasensya, offline tayo at wala pang on-device AI. Basahin muna ang paliwanag sa pisara. 💛',
    taglish: 'Pasensya, offline tayo at wala pang on-device AI. Basahin muna ang paliwanag sa pisara. 💛',
  }
  // The curriculum's own explanation is just the competency title in 152 of 155
  // lessons, so the floor uses the same explanation the lesson screen teaches.
  const taught = competency ? lessonTeaching(competency).explanation : null
  const floor = () => ({
    text: applyMode(mode, lang, taught?.[lang] ?? taught?.taglish ?? (offline[lang] ?? offline.taglish)),
    source: SOURCE.CACHED,
    fromCache: false,
  })

  return runTutorChain({ providers, store: { get, set }, cacheKey, mode, lang, floor })
}
