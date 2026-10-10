import { stripMarkdown } from './strip-markdown.js'

// Learning modes (docs/TUTOR_MODES.md). Pure module: no browser or storage
// imports, so api/ can use modePrompt() and tests can run it in Node.
// Small on-device models ignore format instructions, so the prompt fragment only
// asks; applyMode() is what guarantees the shape (D-009).

export const MODE_IDS = ['none', 'kalma', 'pakinig', 'hakbang']
export const DEFAULT_MODE = 'none'

// Wording rule (docs/TUTOR_MODES.md section 2): modes are "designed to support"
// learners and never diagnose or make clinical claims. `description` states only
// what changes today (screen look and the tutor's replies); keep it in step with
// src/lib/mode-ui.js and src/styles/modes.css.
// TODO: Filipino reviewer — fil and taglish descriptions and use cases.
export const MODES = {
  none: {
    id: 'none',
    label: { en: 'Standard', fil: 'Karaniwan', taglish: 'Standard' },
    gloss: { en: 'No mode', fil: 'Walang mode', taglish: 'Walang mode' },
    description: {
      en: 'Teacher Gabo as usual.',
      fil: 'Si Teacher Gabo gaya ng dati.',
      taglish: 'Si Teacher Gabo as usual.',
    },
    useCase: {
      en: 'Works for any learner. You can change this any time in Profile.',
      fil: 'Para sa kahit sinong mag-aaral. Mababago mo ito anumang oras sa Profile.',
      taglish: 'Para sa kahit sinong learner. Mababago mo ito anytime sa Profile.',
    },
  },
  kalma: {
    id: 'kalma',
    label: { en: 'Calm', fil: 'Kalma', taglish: 'Kalma' },
    gloss: { en: 'Quiet and focused', fil: 'Kalmado / Nakatutok', taglish: 'Calm / Focus' },
    description: {
      en: 'A calm, quiet screen and short replies. One idea at a time.',
      fil: 'Tahimik at payak na screen, maikling sagot. Isang ideya bawat sagot.',
      taglish: 'Calm at tahimik na screen, maikling replies. One idea at a time.',
    },
    useCase: {
      en: 'Designed to support learners who find busy screens or lots of text overwhelming, for example learners with ADHD, autism, or sensory sensitivity.',
      fil: 'Idinisenyo para suportahan ang mga mag-aaral na nahihirapan sa magulong screen o maraming teksto, halimbawa ang may ADHD, autism, o sensory sensitivity.',
      taglish: 'Designed to support ang mga learner na nao-overwhelm sa busy screens o maraming text, halimbawa ang may ADHD, autism, o sensory sensitivity.',
    },
  },
  pakinig: {
    id: 'pakinig',
    label: { en: 'Listen', fil: 'Pakinig', taglish: 'Pakinig' },
    gloss: { en: 'Read aloud to me', fil: 'Makinig', taglish: 'Listen' },
    description: {
      en: 'Big text, read aloud word by word. Numbers said as words.',
      fil: 'Malaking teksto, binabasa nang malakas bawat salita. Binibigkas ang mga numero.',
      taglish: 'Big text, binabasa nang malakas word by word. Sinasabi ang numbers as words.',
    },
    useCase: {
      en: 'Designed to support learners who find reading hard, for example learners with dyslexia or low vision, and learners still building reading skills.',
      fil: 'Idinisenyo para suportahan ang mga mag-aaral na nahihirapang magbasa, halimbawa ang may dyslexia o mahinang paningin, at ang mga nag-aaral pa lang magbasa.',
      taglish: 'Designed to support ang mga learner na nahihirapang magbasa, halimbawa ang may dyslexia o low vision, at ang mga nag-aaral pa lang magbasa.',
    },
  },
  hakbang: {
    id: 'hakbang',
    label: { en: 'Step by Step', fil: 'Hakbang', taglish: 'Hakbang' },
    gloss: { en: 'Small steps', fil: 'Isang hakbang', taglish: 'Step' },
    description: {
      en: 'A bigger step-by-step card, then a quick check.',
      fil: 'Mas malaking card ng bawat hakbang, tapos may maikling tanong.',
      taglish: 'Mas malaking step-by-step card, tapos may quick check.',
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

// Said first when the learner asks about something other than math or the lesson;
// the reply then carries on teaching. The prompt asks for it word for word, and
// applyMode() puts it back if a model paraphrases it.
// TODO: Filipino reviewer — fil and taglish wording.
export const OFF_TOPIC = {
  en: "I can't help with that, but let's get back to our math lesson.",
  fil: 'Hindi kita matutulungan diyan, pero balikan natin ang aralin natin sa math.',
  taglish: 'Hindi kita matutulungan diyan, pero balik tayo sa math lesson natin.',
}
const DECLINE = /\b(can'?t|cannot|can not|unable to) help\b|hindi (kita|ko) (ka )?matutulungan|hindi ako makakatulong/i

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
  const out = clean(text)
  if (!out) return ''
  // An off-topic opener stays whole and first; the mode shapes the teaching after it
  // (Hakbang would otherwise keep the refusal as its one step and drop the lesson).
  const [first, ...rest] = splitSentences(out)
  if (DECLINE.test(first)) {
    const opener = OFF_TOPIC[lang] ?? OFF_TOPIC.en
    const body = shapeForMode(modeId, lang, rest.join(' '))
    if (!body) return opener
    return `${opener} ${normalizeMode(modeId) === 'kalma' ? splitSentences(body)[0] : body}`
  }
  return shapeForMode(modeId, lang, out)
}

function shapeForMode(modeId, lang, out) {
  const mode = normalizeMode(modeId)
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
