// Global language preference (English / Tagalog / Taglish). The student picks
// once; it drives lesson explanations, feedback, quizzes, and Teacher Gabay's
// voice + reply language. Persisted offline in IndexedDB. Default English.

import { get, set } from 'idb-keyval'

const KEY = 'pref:lang'
export const DEFAULT_LANG = 'en'

// key must match content.json explanation.{en,fil,taglish}.
// "fil" is kept as the storage key for backward-compat; label shown is "Tagalog".
export const LANGS = [
  { key: 'taglish', label: 'Taglish' },
  { key: 'fil', label: 'Tagalog' },
  { key: 'en', label: 'English' },
]

// Human name used when instructing the tutor what language to reply in.
export const LANG_NAME = {
  en: 'English',
  fil: 'Tagalog',
  taglish: 'Taglish (a natural Tagalog-English mix)',
}

// Encouragement shown near the answer box — answer in the chosen language.
export const ANSWER_HINT = {
  en: 'Answer in English.',
  fil: 'Sagutin sa Tagalog.',
  taglish: 'Pwede kang sumagot sa English o Tagalog.',
}

// BCP-47 voice/recognition language code per setting.
export const SPEECH_LANG = {
  en: 'en-US',
  fil: 'fil-PH',
  taglish: 'fil-PH',
}

export function answerHint(lang = DEFAULT_LANG) {
  return ANSWER_HINT[lang] ?? ANSWER_HINT[DEFAULT_LANG]
}

export function speechLang(lang = DEFAULT_LANG) {
  return SPEECH_LANG[lang] ?? SPEECH_LANG[DEFAULT_LANG]
}

export async function loadLang() {
  const v = await get(KEY)
  return LANGS.some((l) => l.key === v) ? v : DEFAULT_LANG
}

export async function saveLang(lang) {
  if (LANGS.some((l) => l.key === lang)) await set(KEY, lang)
}
