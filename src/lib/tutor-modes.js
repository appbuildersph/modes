import { stripMarkdown } from './strip-markdown.js'

// Learning modes (docs/TUTOR_MODES.md). Pure module: no browser or storage
// imports, so api/ can use modePrompt() and tests can run it in Node.
// Small on-device models ignore format instructions, so the prompt fragment only
// asks; applyMode() is what guarantees the shape (D-009).

export const MODE_IDS = ['none', 'kalma', 'pakinig', 'hakbang']
export const DEFAULT_MODE = 'none'

export const MODES = {
  none: {
    id: 'none',
    label: { en: 'No mode', fil: 'Walang mode', taglish: 'Walang mode' },
    gloss: { en: 'Standard tutor', fil: 'Karaniwang tutor', taglish: 'Karaniwang tutor' },
  },
  kalma: {
    id: 'kalma',
    label: { en: 'Kalma', fil: 'Kalma', taglish: 'Kalma' },
    gloss: { en: 'Calm and focused', fil: 'Kalmado at nakatutok', taglish: 'Calm at focused' },
  },
  pakinig: {
    id: 'pakinig',
    label: { en: 'Pakinig', fil: 'Pakinig', taglish: 'Pakinig' },
    gloss: { en: 'Listen', fil: 'Makinig', taglish: 'Makinig' },
  },
  hakbang: {
    id: 'hakbang',
    label: { en: 'Hakbang', fil: 'Hakbang', taglish: 'Hakbang' },
    gloss: { en: 'One step at a time', fil: 'Isang hakbang bawat oras', taglish: 'One step at a time' },
  },
}

export function normalizeMode(modeId) {
  return Object.hasOwn(MODES, modeId) ? modeId : DEFAULT_MODE
}

const PROMPT = {
  none: '',
  kalma:
    ' Use exactly two short sentences, one idea, a calm neutral tone, and at most one gentle question.',
  pakinig:
    ' Write for listening: use words, not symbols (say "three fourths", not "3/4"; say "times", "equals", "percent"). Use short sentences. No emoji.',
  hakbang:
    ' Give only the next single step, in simple words, with a concrete Filipino example, then ask one check question.',
}

// Appended to the shared tutor prompt. Same wording on client and server.
export function modePrompt(modeId) {
  return PROMPT[normalizeMode(modeId)]
}

// TODO: Filipino reviewer — templated check questions below.
const CHECK_QUESTION = {
  en: 'Does that make sense so far?',
  fil: 'Naiintindihan mo ba hanggang dito?',
  taglish: 'Gets mo ba hanggang dito?',
}

// TODO: Filipino reviewer — spoken forms of symbols for Tagalog and Taglish.
const SPOKEN = {
  en: { times: 'times', divided: 'divided by', plus: 'plus', minus: 'minus', equals: 'equals', percent: 'percent', over: 'over' },
  fil: { times: 'beses', divided: 'hinati sa', plus: 'dagdag', minus: 'bawas', equals: 'ay', percent: 'porsyento', over: 'sa' },
  taglish: { times: 'times', divided: 'divided by', plus: 'plus', minus: 'minus', equals: 'equals', percent: 'percent', over: 'over' },
}

const FRACTION_WORDS = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['fourth', 'fourths'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
}

const EMOJI = /[\p{Extended_Pictographic}️‍]/gu

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean)
}

// Shared by every mode: reasoning blocks, markdown, emoji, stray whitespace.
function clean(text) {
  return stripMarkdown(String(text ?? '').replace(/<think>[\s\S]*?(<\/think>|$)/g, ''))
    .replace(EMOJI, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function spokenFraction(n, d, lang) {
  const words = FRACTION_WORDS[d]
  if (lang === 'en' && words) return `${n} ${n === '1' ? words[0] : words[1]}`
  return `${n} ${(SPOKEN[lang] ?? SPOKEN.en).over} ${d}`
}

function spoken(text, lang) {
  const s = SPOKEN[lang] ?? SPOKEN.en
  return text
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, n, d) => spokenFraction(n, d, lang))
    .replace(/(\d)\s*[×x*]\s*(?=\d)/g, `$1 ${s.times} `)
    .replace(/\s*÷\s*/g, ` ${s.divided} `)
    .replace(/(\d)\s*\+\s*(?=\d)/g, `$1 ${s.plus} `)
    .replace(/(\d)\s+[-−–]\s+(?=\d)/g, `$1 ${s.minus} `)
    .replace(/\s*=\s*/g, ` ${s.equals} `)
    .replace(/\s*%/g, ` ${s.percent}`)
    .replace(/\s+/g, ' ')
    .trim()
}

// Pure and deterministic: the same input always gives the same output.
export function applyMode(modeId, lang, text) {
  const mode = normalizeMode(modeId)
  const out = clean(text)
  if (!out) return ''

  if (mode === 'kalma') {
    return splitSentences(out)
      .slice(0, 2)
      .join(' ')
      .replace(/!+/g, '.')
      .replace(/\.{2,}/g, '.')
  }

  if (mode === 'pakinig') return spoken(out, lang)

  if (mode === 'hakbang') {
    const sentences = splitSentences(out)
    const step = sentences.find((x) => !x.endsWith('?')) ?? sentences[0]
    const question = sentences.find((x) => x.endsWith('?') && x !== step)
    return `${step} ${question ?? CHECK_QUESTION[lang] ?? CHECK_QUESTION.taglish}`
  }

  return out
}

const MAX_REPLY_CHARS = 1200

// Gate used by the tutor chain: a failing reply falls through to the next
// provider instead of reaching a child.
export function isValidReply(text) {
  const out = clean(text)
  if (out.length < 3 || out.length > MAX_REPLY_CHARS) return false
  // Small models loop (seen with Gemma 3 1B in research/model-lab).
  const seen = new Map()
  for (const sentence of splitSentences(out)) {
    const n = (seen.get(sentence) ?? 0) + 1
    if (n >= 3) return false
    seen.set(sentence, n)
  }
  return true
}
