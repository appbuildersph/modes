import test, { beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  speak, speakWords, stopSpeaking, pauseSpeaking, resumeSpeaking,
  wordSpans, wordIndexAt, estimateWordMs, isSpeaking,
  LOCAL_RATE, BOUNDARY_WAIT_MS,
} from '../src/lib/speech.js'

// A fake speechSynthesis: records utterances, lets a test fire the voice's events.
class FakeUtterance {
  constructor(text) {
    this.text = text
  }
}
let synth
let spoken

beforeEach(() => {
  spoken = []
  synth = {
    cancelled: 0,
    paused: false,
    getVoices: () => [],
    speak: (u) => spoken.push(u),
    cancel() {
      this.cancelled++
    },
    pause() {
      this.paused = true
    },
    resume() {
      this.paused = false
    },
  }
  globalThis.window = { speechSynthesis: synth }
  globalThis.SpeechSynthesisUtterance = FakeUtterance
  mock.timers.enable({ apis: ['setTimeout'] })
})

afterEach(() => {
  stopSpeaking()
  mock.timers.reset()
  delete globalThis.window
  delete globalThis.SpeechSynthesisUtterance
})

const TEXT = 'Isa, dalawa, tatlo.'

// Collects what a UI would receive.
function listener() {
  const events = { words: [], ends: 0 }
  return {
    events,
    opts: { onWord: (i) => events.words.push(i), onEnd: () => events.ends++ },
  }
}

test('wordSpans and wordIndexAt map characters to word indexes', () => {
  assert.equal(wordSpans('  Hello   po, kumusta ').length, 3) // extra whitespace is not a word
  const text = 'Hello po kumusta'
  const s = wordSpans(text)
  assert.deepEqual(s, [{ start: 0, end: 5 }, { start: 6, end: 8 }, { start: 9, end: 16 }])
  assert.equal(wordIndexAt(s, 0), 0)
  assert.equal(wordIndexAt(s, 4), 0)
  assert.equal(wordIndexAt(s, 6), 1)
  assert.equal(wordIndexAt(s, 5), 1) // the gap goes to the next word
  assert.equal(wordIndexAt(s, 12), 2)
  assert.equal(wordIndexAt(s, 999), 2) // past the end clamps to the last word
  assert.equal(wordIndexAt([], 3), -1)
  assert.deepEqual(wordSpans(''), [])
  assert.deepEqual(wordSpans(null), [])
})

test('estimateWordMs grows with length, pauses on punctuation, shrinks with a faster rate', () => {
  assert.ok(estimateWordMs('kumusta') > estimateWordMs('po'))
  assert.ok(estimateWordMs('po.') > estimateWordMs('po'))
  assert.ok(estimateWordMs('po,') > estimateWordMs('po'))
  assert.ok(estimateWordMs('kumusta', 1.5) < estimateWordMs('kumusta', 0.7))
})

test('speakWords returns false and calls nothing for empty text or no speech support', () => {
  const { events, opts } = listener()
  assert.equal(speakWords('', opts), false)
  assert.equal(speakWords('   ', opts), false)
  delete globalThis.window
  assert.equal(speakWords('Hello', opts), false)
  assert.deepEqual(events, { words: [], ends: 0 })
  assert.equal(spoken.length, 0)
})

test('speakWords uses the on-device voice with the default and a custom rate', () => {
  assert.equal(speakWords(TEXT, { lang: 'fil' }), true)
  assert.equal(spoken[0].text, TEXT)
  assert.equal(spoken[0].rate, LOCAL_RATE)
  assert.equal(spoken[0].lang, 'fil-PH')

  assert.equal(speakWords(TEXT, { lang: 'en', rate: 0.7 }), true)
  assert.equal(spoken[1].rate, 0.7)
  assert.equal(isSpeaking(), true)
})

test('boundary events drive onWord, only word boundaries count, onEnd fires once', () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  const u = spoken[0]
  u.onstart()
  u.onboundary({ name: 'word', charIndex: 0 })
  u.onboundary({ name: 'sentence', charIndex: 6 }) // ignored
  u.onboundary({ name: 'word', charIndex: 6 })
  u.onboundary({ name: 'word', charIndex: 6 }) // repeat of the same word is not re-sent
  u.onboundary({ charIndex: 9 }) // no name: treated as a word boundary
  u.onend()
  u.onend() // a second end must not double-fire

  assert.deepEqual(events.words, [0, 1, 2])
  assert.equal(events.ends, 1)
  assert.equal(isSpeaking(), false)
})

test('with no boundary event the length-based timer takes over after about 700 ms', () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  const u = spoken[0]
  u.onstart()

  mock.timers.tick(BOUNDARY_WAIT_MS - 1)
  assert.deepEqual(events.words, []) // still waiting for a real boundary

  mock.timers.tick(1)
  assert.deepEqual(events.words, [0])

  mock.timers.tick(estimateWordMs('Hello'))
  assert.deepEqual(events.words, [0, 1])
  mock.timers.tick(estimateWordMs('po'))
  assert.deepEqual(events.words, [0, 1, 2])

  // After the last word the timer stops by itself; the voice's end closes it.
  mock.timers.tick(10_000)
  assert.deepEqual(events.words, [0, 1, 2])
  u.onend()
  assert.equal(events.ends, 1)
})

test('a boundary event arriving during the fallback takes over and stops the timer', () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  const u = spoken[0]
  u.onstart()
  mock.timers.tick(BOUNDARY_WAIT_MS) // fallback shows word 0
  assert.deepEqual(events.words, [0])

  u.onboundary({ name: 'word', charIndex: 9 }) // the real voice says: word 2
  assert.deepEqual(events.words, [0, 2])

  mock.timers.tick(10_000) // no more timer-driven words
  assert.deepEqual(events.words, [0, 2])
})

test('if the voice never reports start, the timer still arms after the start wait', () => {
  const { events, opts } = listener()
  speakWords('Hello po', opts)
  mock.timers.tick(2_499)
  assert.deepEqual(events.words, [])
  mock.timers.tick(1)
  assert.deepEqual(events.words, [0])
})

test('stopSpeaking ends it once, clears timers and cancels the voice', () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  spoken[0].onstart()
  mock.timers.tick(BOUNDARY_WAIT_MS)
  assert.deepEqual(events.words, [0])

  stopSpeaking()
  assert.equal(events.ends, 1)
  assert.ok(synth.cancelled >= 1)
  assert.equal(isSpeaking(), false)

  mock.timers.tick(10_000)
  assert.deepEqual(events.words, [0]) // no ticks after stopping
  spoken[0].onend() // the engine's own end event arrives late
  assert.equal(events.ends, 1)
})

test('a newer speakWords ends the old one first, and the old one cannot clobber the new', () => {
  const first = listener()
  const second = listener()
  speakWords('Hello po', first.opts)
  spoken[0].onstart()
  speakWords('Isa dalawa', second.opts)

  assert.equal(first.events.ends, 1)
  assert.equal(second.events.ends, 0)

  spoken[0].onend() // the old utterance reports its end late
  assert.equal(second.events.ends, 0)
  spoken[1].onstart()
  spoken[1].onboundary({ name: 'word', charIndex: 0 })
  assert.deepEqual(second.events.words, [0])
  assert.deepEqual(first.events.words, [])
})

test('pause holds the timer and resume continues it', () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  spoken[0].onstart()
  mock.timers.tick(BOUNDARY_WAIT_MS)
  assert.deepEqual(events.words, [0])

  pauseSpeaking()
  assert.equal(synth.paused, true)
  mock.timers.tick(10_000)
  assert.deepEqual(events.words, [0]) // nothing advances while paused

  resumeSpeaking()
  assert.equal(synth.paused, false)
  assert.deepEqual(events.words, [0, 1])
})

test('an error from the voice also ends it once', () => {
  const { events, opts } = listener()
  speakWords('Hello', opts)
  spoken[0].onerror({ error: 'synthesis-failed' })
  assert.equal(events.ends, 1)
})

test('a throwing UI callback does not break playback or the end signal', () => {
  let ends = 0
  speakWords('Hello po', {
    onWord: () => {
      throw new Error('ui bug')
    },
    onEnd: () => {
      ends++
      throw new Error('ui bug')
    },
  })
  spoken[0].onstart()
  assert.doesNotThrow(() => spoken[0].onboundary({ name: 'word', charIndex: 0 }))
  assert.doesNotThrow(() => spoken[0].onend())
  assert.equal(ends, 1)
})

test('speak() passes an optional rate to the on-device fallback, default unchanged', async () => {
  mock.timers.reset() // speak() awaits real promises; use real timers here
  const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  // Node's navigator is read-only; offline makes speak() go straight to the local voice.
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
  const waitSpoken = async () => {
    for (let i = 0; i < 50 && !spoken.length; i++) await new Promise((r) => setTimeout(r, 5))
  }

  speak('Kumusta po', { lang: 'fil', rate: 0.6 })
  await waitSpoken()
  assert.equal(spoken[0].rate, 0.6)

  spoken.length = 0
  speak('Kumusta po', { lang: 'fil' })
  await waitSpoken()
  assert.equal(spoken[0].rate, LOCAL_RATE)
  if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator)
})
