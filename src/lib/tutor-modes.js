import { stripMarkdown } from './strip-markdown.js'

// Learning modes (docs/TUTOR_MODES.md). Pure module: no browser or storage
// imports, so api/ can use modePrompt() and tests can run it in Node.
// Small on-device models ignore format instructions, so the prompt fragment only
// asks; applyMode() is what guarantees the shape (D-009).

export const MODE_IDS = ['none', 'kalma', 'pakinig', 'hakbang']
export const DEFAULT_MODE = 'none'

// Wording rule (docs/TUTOR_MODES.md section 2): modes are "designed to support"
// learners and never diagnose or make clinical claims. `description` states only
// what changes today (the tutor's replies); update it when the screen changes ship.
// TODO: Filipino reviewer — fil and taglish descriptions and use cases.
export const MODES = {
  none: {
    id: 'none',
    label: { en: 'Standard', fil: 'Karaniwan', taglish: 'Standard' },
    gloss: { en: 'No mode', fil: 'Walang mode', taglish: 'Walang mode' },
    description: {
      en: 'The regular Teacher Gabay experience.',
      fil: 'Ang karaniwang karanasan kay Teacher Gabay.',
      taglish: 'Ang regular na Teacher Gabay experience.',
    },
    useCase: {
      en: 'Works for any learner. You can change this any time in Profile.',
      fil: 'Para sa kahit sinong mag-aaral. Mababago mo ito anumang oras sa Profile.',
      taglish: 'Para sa kahit sinong learner. Mababago mo ito anytime sa Profile.',
    },
  },
  kalma: {
    id: 'kalma',
    label: { en: 'Kalma', fil: 'Kalma', taglish: 'Kalma' },
    gloss: { en: 'Calm / Focus', fil: 'Kalmado / Nakatutok', taglish: 'Calm / Focus' },
    description: {
      en: 'Teacher Gabay gives short, calm replies: two sentences, one idea at a time.',
      fil: 'Maikli at kalmado ang sagot ni Teacher Gabay: dalawang pangungusap, isang ideya bawat sagot.',
      taglish: 'Maikli at calm ang replies ni Teacher Gabay: two sentences, one idea at a time.',
    },
    useCase: {
      en: 'Designed to support learners who find busy screens or lots of text overwhelming, for example learners with ADHD, autism, or sensory sensitivity.',
      fil: 'Idinisenyo para suportahan ang mga mag-aaral na nahihirapan sa magulong screen o maraming teksto, halimbawa ang may ADHD, autism, o sensory sensitivity.',
      taglish: 'Designed to support ang mga learner na nao-overwhelm sa busy screens o maraming text, halimbawa ang may ADHD, autism, o sensory sensitivity.',
    },
  },
  pakinig: {
    id: 'pakinig',
    label: { en: 'Pakinig', fil: 'Pakinig', taglish: 'Pakinig' },
    gloss: { en: 'Listen', fil: 'Makinig', taglish: 'Listen' },
    description: {
      en: 'Replies are written to be heard: numbers and symbols are spoken as words.',
      fil: 'Isinulat ang mga sagot para pakinggan: binibigkas bilang salita ang mga numero at simbolo.',
      taglish: 'Ang replies ay isinulat para pakinggan: ang numbers at symbols ay sinasabi bilang words.',
    },
    useCase: {
      en: 'Designed to support learners who find reading hard, for example learners with dyslexia or low vision, and learners still building reading skills.',
      fil: 'Idinisenyo para suportahan ang mga mag-aaral na nahihirapang magbasa, halimbawa ang may dyslexia o mahinang paningin, at ang mga nag-aaral pa lang magbasa.',
      taglish: 'Designed to support ang mga learner na nahihirapang magbasa, halimbawa ang may dyslexia o low vision, at ang mga nag-aaral pa lang magbasa.',
    },
  },
  hakbang: {
    id: 'hakbang',
    label: { en: 'Hakbang', fil: 'Hakbang', taglish: 'Hakbang' },
    gloss: { en: 'Step', fil: 'Isang hakbang', taglish: 'Step' },
    description: {
      en: 'Teacher Gabay shows one step at a time, then asks a quick question to check.',
      fil: 'Isang hakbang lang ang ipinapakita ni Teacher Gabay, tapos may maikling tanong para tiyakin.',
      taglish: 'One step lang ang ipinapakita ni Teacher Gabay, tapos may quick question para i-check.',
    },
    useCase: {
      en: 'Designed to support learners who do better with small steps and concrete examples, for example learners with dyscalculia or an intellectual disability.',
      fil: 'Idinisenyo para suportahan ang mga mag-aaral na mas natututo sa maliliit na hakbang at konkretong halimbawa, halimbawa ang may dyscalculia o intellectual disability.',
      taglish: 'Designed to support ang mga learner na mas natututo sa small steps at concrete examples, halimbawa ang may dyscalculia o intellectual disability.',
    },
  },
}

export function normalizeMode(modeId) {
  return Object.hasOwn(MODES, modeId) ? modeId : DEFAULT_MODE
}

const PROMPT = {
  none: () => '',
  kalma: () =>
    ' Use exactly two short sentences, one idea, a calm neutral tone, and at most one gentle question.',
  // Gemma 4 answered Pakinig in English and ran long unless told otherwise.
  pakinig: (replyIn) =>
    ` Write for listening: use words, not symbols (say "three fourths", not "3/4"; say "times", "equals", "percent"). Use at most four short sentences. No emoji. Keep replying in ${replyIn}.`,
  hakbang: () =>
    ' Give only the next single step, in simple words, with a concrete Filipino example, then ask one check question. Do not write labels like "Step" or "Check question".',
}

// Appended to the shared tutor prompt. Same wording on client and server.
export function modePrompt(modeId, replyIn = 'English') {
  return PROMPT[normalizeMode(modeId)](replyIn)
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
const GREETING = /^(hello|hi|hey|kumusta)(\s+(there|po|kaibigan|friend|students?))?\s*[!.,]\s*/i
// Models sometimes echo the prompt's structure as literal labels.
const LABEL = /(^|\s)(check question|tanong|next step|step \d+|hakbang \d+)\s*:\s*/gi

function clean(text) {
  const out = stripMarkdown(String(text ?? '').replace(/<think>[\s\S]*?(<\/think>|$)/g, ''))
    .replace(EMOJI, '')
    .replace(LABEL, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  const rest = out.replace(GREETING, '')
  return rest || out
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

  if (mode === 'pakinig') return spoken(splitSentences(out).slice(0, 4).join(' '), lang)

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
