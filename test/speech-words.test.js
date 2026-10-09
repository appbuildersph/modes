import test, { beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  speak, speakWords, stopSpeaking, pauseSpeaking, resumeSpeaking,
  wordSpans, wordIndexAt, estimateWordMs, wordStartTimes, isSpeaking,
  LOCAL_RATE, BOUNDARY_WAIT_MS,
} from '../src/lib/speech.js'

// --- fakes -----------------------------------------------------------------
// A fake speechSynthesis: records utterances, lets a test fire the voice's events.
class FakeUtterance {
  constructor(text) {
    this.text = text
  }
}
// A fake <audio>: a test moves its clock and fires its events.
class FakeAudio extends EventTarget {
  static instances = []
  static rejectPlay = false
  static duration = 10
  constructor(src) {
    super()
    this.src = src
    this.currentTime = 0
    this.duration = FakeAudio.duration
    this.paused = true
    this.ended = false
    this.playbackRate = 1
    this.playCalls = 0
    FakeAudio.instances.push(this)
  }
  play() {
    this.playCalls++
    if (FakeAudio.rejectPlay) return Promise.reject(new Error('NotAllowedError'))
    this.paused = false
    queueMicrotask(() => this.dispatchEvent(new Event('playing')))
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  at(time) {
    this.currentTime = time
    this.dispatchEvent(new Event('timeupdate'))
  }
}

let synth
let spoken

// Let promise chains (cloud lookup, play()) run.
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}
const BLOB = () => new Blob([new Uint8Array([1, 2, 3])])
const noCloud = async () => null
const cloud = async () => BLOB()
const audio = () => FakeAudio.instances.at(-1)

beforeEach(() => {
  spoken = []
  FakeAudio.instances = []
  FakeAudio.rejectPlay = false
  FakeAudio.duration = 10
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
  globalThis.Audio = FakeAudio
  mock.timers.enable({ apis: ['setTimeout'] })
})

afterEach(() => {
  stopSpeaking()
  mock.timers.reset()
  delete globalThis.window
  delete globalThis.SpeechSynthesisUtterance
  delete globalThis.Audio
  delete globalThis.requestAnimationFrame
  delete globalThis.cancelAnimationFrame
})

const TEXT = 'Isa, dalawa, tatlo.'

// Collects what a UI would receive. Defaults to "no cloud audio" so the on-device
// voice path is exercised; pass loadAudio: cloud to exercise the cloud path.
function listener(extra = {}) {
  const events = { words: [], ends: 0 }
  return {
    events,
    opts: { loadAudio: noCloud, onWord: (i) => events.words.push(i), onEnd: () => events.ends++, ...extra },
  }
}

// --- pure helpers ------------------------------------------------------------
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

// --- contract ------------------------------------------------------------------
test('speakWords returns false and calls nothing when there is nothing to read', () => {
  const { events, opts } = listener()
  assert.equal(speakWords('', opts), false)
  assert.equal(speakWords('   ', opts), false)
  assert.equal(speakWords(null, opts), false)
  assert.deepEqual(events, { words: [], ends: 0 })
  assert.equal(spoken.length, 0)
  assert.equal(FakeAudio.instances.length, 0)
})

test('it returns true right away, even with no speech support, and then ends once if nothing can speak', async () => {
  delete globalThis.window // no speechSynthesis at all
  const { events, opts } = listener()
  assert.equal(speakWords('Hello po', opts), true)
  assert.equal(events.ends, 0) // not synchronous
  await settle()
  assert.deepEqual(events, { words: [], ends: 1 })
})

// --- cloud (ElevenLabs) voice ---------------------------------------------------
test('with cloud audio the cloud voice is used and the on-device voice is not', async () => {
  const { opts } = listener({ loadAudio: cloud })
  assert.equal(speakWords(TEXT, opts), true)
  await settle()

  assert.equal(FakeAudio.instances.length, 1)
  assert.equal(audio().playCalls, 1)
  assert.equal(spoken.length, 0) // no utterance: the device voice stayed silent
  assert.equal(isSpeaking(), true)
})

test('the rate becomes the audio playbackRate, default 1', async () => {
  speakWords(TEXT, listener({ loadAudio: cloud }).opts)
  await settle()
  assert.equal(audio().playbackRate, 1)

  speakWords(TEXT, listener({ loadAudio: cloud, rate: 0.65 }).opts)
  await settle()
  assert.equal(audio().playbackRate, 0.65)
})

test('the loader receives the text, language and a normalised voice mode', async () => {
  const seen = []
  const loadAudio = async (...args) => (seen.push(args), BLOB())
  speakWords('Hello po', { lang: 'fil', mode: 'pakinig', loadAudio })
  speakWords('Hello po', { lang: 'en', mode: 'not-a-mode', loadAudio })
  speakWords('Hello po', { loadAudio })
  await settle()
  assert.deepEqual(seen, [['Hello po', 'fil', 'pakinig'], ['Hello po', 'en', 'none'], ['Hello po', 'en', 'none']])
})

test('onWord follows the audio clock, and onEnd fires once when the audio ends', async () => {
  const { events, opts } = listener({ loadAudio: cloud })
  const words = ['Hello', 'po', 'kumusta']
  speakWords(words.join(' '), opts)
  await settle()
  const starts = wordStartTimes(words, 10)

  audio().at(0)
  audio().at(starts[1] + 0.01)
  audio().at(starts[1] + 0.02) // same word: not re-sent
  audio().at(starts[2] + 0.01)
  assert.deepEqual(events.words, [0, 1, 2])

  audio().currentTime = 10
  audio().dispatchEvent(new Event('ended'))
  audio().dispatchEvent(new Event('ended')) // a repeat must not double-fire
  assert.equal(events.ends, 1)
  assert.equal(isSpeaking(), false)
})

test('the word schedule is in media time, so a different rate needs no new schedule', async () => {
  const words = ['Hello', 'po', 'kumusta']
  const starts = wordStartTimes(words, 10)
  for (const rate of [1, 0.8, 0.65]) {
    const { events, opts } = listener({ loadAudio: cloud, rate })
    speakWords(words.join(' '), opts)
    await settle()
    audio().at(starts[1] + 0.01)
    assert.deepEqual(events.words, [0, 1], `rate ${rate}`) // word 0 at the start, then word 1
    stopSpeaking()
  }
})

test('before the duration is known nothing is emitted; loadedmetadata then starts the highlight', async () => {
  FakeAudio.duration = NaN // a blob whose length the browser has not read yet
  const { events, opts } = listener({ loadAudio: cloud })
  speakWords('Hello po kumusta', opts)
  await settle()
  audio().at(1)
  assert.deepEqual(events.words, [])

  audio().duration = 10
  audio().dispatchEvent(new Event('loadedmetadata'))
  assert.deepEqual(events.words, [0])
})

test('with requestAnimationFrame the highlight is driven by frames, not only timeupdate', async () => {
  const queue = []
  globalThis.requestAnimationFrame = (cb) => queue.push(cb)
  globalThis.cancelAnimationFrame = () => {}
  const { events, opts } = listener({ loadAudio: cloud })
  speakWords('Hello po kumusta', opts)
  await settle() // play() resolves and fires "playing", which starts the loop

  const starts = wordStartTimes(['Hello', 'po', 'kumusta'], 10)
  audio().currentTime = starts[2] + 0.01 // clock moved, no timeupdate event fired
  assert.deepEqual(events.words, [0]) // the first frame, at playback start
  const frame = queue.shift()
  frame()
  assert.deepEqual(events.words, [0, 2])
  assert.equal(queue.length, 1) // it keeps scheduling while playing
})

test('stopSpeaking ends it once, pauses the audio, and a late ended event does nothing more', async () => {
  const { events, opts } = listener({ loadAudio: cloud })
  speakWords('Hello po kumusta', opts)
  await settle()
  audio().at(0.1)

  stopSpeaking()
  assert.equal(events.ends, 1)
  assert.equal(audio().paused, true)
  assert.equal(isSpeaking(), false)

  audio().dispatchEvent(new Event('ended'))
  audio().at(9)
  assert.equal(events.ends, 1)
  assert.deepEqual(events.words, [0]) // nothing emitted after the stop
})

test('stopping while the audio is still loading discards it: no audio, no voice, one end', async () => {
  let resolveBlob
  const loadAudio = () => new Promise((r) => (resolveBlob = r))
  const { events, opts } = listener({ loadAudio })
  speakWords('Hello po', opts)
  stopSpeaking()
  assert.equal(events.ends, 1)

  resolveBlob(BLOB())
  await settle()
  assert.equal(FakeAudio.instances.length, 0)
  assert.equal(spoken.length, 0)
  assert.equal(events.ends, 1)
})

test('pause holds the highlight and the audio; resume continues both', async () => {
  const { events, opts } = listener({ loadAudio: cloud })
  speakWords('Hello po kumusta', opts)
  await settle()
  const starts = wordStartTimes(['Hello', 'po', 'kumusta'], 10)
  audio().at(0)
  assert.deepEqual(events.words, [0])

  pauseSpeaking()
  assert.equal(audio().paused, true)
  audio().at(starts[2] + 0.01)
  assert.deepEqual(events.words, [0]) // nothing advances while paused

  resumeSpeaking()
  assert.equal(audio().playCalls, 2)
  audio().at(starts[2] + 0.02)
  assert.deepEqual(events.words, [0, 2])
})

test('a newer speakWords ends the old one first, and the old one cannot clobber the new', async () => {
  const first = listener({ loadAudio: cloud })
  const second = listener({ loadAudio: cloud })
  speakWords('Hello po', first.opts)
  await settle()
  const firstAudio = audio()
  speakWords('Isa dalawa', second.opts)
  assert.equal(first.events.ends, 1)
  assert.equal(second.events.ends, 0)
  await settle()

  firstAudio.dispatchEvent(new Event('ended')) // the old audio reports its end late
  assert.equal(second.events.ends, 0)
  audio().at(0)
  assert.deepEqual(second.events.words, [0])
  assert.deepEqual(first.events.words, [0]) // it showed word 0 before being replaced, nothing after
})

test('a throwing UI callback does not break the cloud path or its end signal', async () => {
  let ends = 0
  speakWords('Hello po', {
    loadAudio: cloud,
    onWord: () => {
      throw new Error('ui bug')
    },
    onEnd: () => {
      ends++
      throw new Error('ui bug')
    },
  })
  await settle()
  assert.doesNotThrow(() => audio().at(0))
  assert.doesNotThrow(() => audio().dispatchEvent(new Event('ended')))
  assert.equal(ends, 1)
})

// --- the on-device voice is only the fallback ---------------------------------------
test('no cloud audio -> the on-device voice, with the default and a custom rate', async () => {
  speakWords(TEXT, { lang: 'fil', ...listener().opts })
  await settle()
  assert.equal(spoken[0].text, TEXT)
  assert.equal(spoken[0].rate, LOCAL_RATE)
  assert.equal(spoken[0].lang, 'fil-PH')
  assert.equal(FakeAudio.instances.length, 0)

  speakWords(TEXT, { lang: 'en', ...listener({ rate: 0.7 }).opts })
  await settle()
  assert.equal(spoken[1].rate, 0.7)
  assert.equal(isSpeaking(), true)
})

test('a loader that throws also falls back to the on-device voice', async () => {
  speakWords(TEXT, listener({ loadAudio: async () => { throw new Error('boom') } }).opts)
  await settle()
  assert.equal(spoken.length, 1)
  assert.equal(FakeAudio.instances.length, 0)
})

test('if the browser refuses to play the audio, the on-device voice takes over once', async () => {
  FakeAudio.rejectPlay = true
  const { events, opts } = listener({ loadAudio: cloud })
  speakWords(TEXT, opts)
  await settle()
  assert.equal(spoken.length, 1)
  assert.equal(events.ends, 0) // still reading, not ended
})

test('a late error from audio that was refused does not start a second on-device reading', async () => {
  FakeAudio.rejectPlay = true
  speakWords(TEXT, listener({ loadAudio: cloud }).opts)
  await settle()
  assert.equal(spoken.length, 1) // the refused play already moved to the device voice

  audio().dispatchEvent(new Event('error')) // the dead element complains afterwards
  assert.equal(spoken.length, 1)
})

test('an audio error falls back to the on-device voice once, even if the error repeats', async () => {
  const { opts } = listener({ loadAudio: cloud })
  speakWords(TEXT, opts)
  await settle()
  assert.equal(spoken.length, 0)

  audio().dispatchEvent(new Event('error'))
  audio().dispatchEvent(new Event('error'))
  assert.equal(spoken.length, 1)
})

test('the default loader goes offline-and-uncached straight to the on-device voice', async () => {
  const real = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
  try {
    speakWords(TEXT, { onWord() {}, onEnd() {} }) // no loadAudio override: the real getCloudBlob
    await settle()
    assert.equal(FakeAudio.instances.length, 0)
    assert.equal(spoken.length, 1)
  } finally {
    if (real) Object.defineProperty(globalThis, 'navigator', real)
  }
})

test('boundary events drive onWord, only word boundaries count, onEnd fires once', async () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  await settle()
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

test('with no boundary event the length-based timer takes over after about 700 ms', async () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  await settle()
  const u = spoken[0]
  u.onstart()

  mock.timers.tick(BOUNDARY_WAIT_MS - 1)
  assert.deepEqual(events.words, []) // still waiting for a real boundary

  mock.timers.tick(1)
  assert.deepEqual(events.words, [0])

  mock.timers.tick(estimateWordMs('Hello', LOCAL_RATE))
  assert.deepEqual(events.words, [0, 1])
  mock.timers.tick(estimateWordMs('po', LOCAL_RATE))
  assert.deepEqual(events.words, [0, 1, 2])

  // After the last word the timer stops by itself; the voice's end closes it.
  mock.timers.tick(10_000)
  assert.deepEqual(events.words, [0, 1, 2])
  u.onend()
  assert.equal(events.ends, 1)
})

test('a boundary event arriving during the fallback takes over and stops the timer', async () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  await settle()
  const u = spoken[0]
  u.onstart()
  mock.timers.tick(BOUNDARY_WAIT_MS) // fallback shows word 0
  assert.deepEqual(events.words, [0])

  u.onboundary({ name: 'word', charIndex: 9 }) // the real voice says: word 2
  assert.deepEqual(events.words, [0, 2])

  mock.timers.tick(10_000) // no more timer-driven words
  assert.deepEqual(events.words, [0, 2])
})

test('if the voice never reports start, the timer still arms after the start wait', async () => {
  const { events, opts } = listener()
  speakWords('Hello po', opts)
  await settle()
  mock.timers.tick(2_499)
  assert.deepEqual(events.words, [])
  mock.timers.tick(1)
  assert.deepEqual(events.words, [0])
})

test('stopSpeaking on the on-device voice ends it once, clears timers and cancels the voice', async () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  await settle()
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

test('pause holds the on-device timer and resume continues it', async () => {
  const { events, opts } = listener()
  speakWords('Hello po kumusta', opts)
  await settle()
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

test('an error from the on-device voice also ends it once', async () => {
  const { events, opts } = listener()
  speakWords('Hello', opts)
  await settle()
  spoken[0].onerror({ error: 'synthesis-failed' })
  assert.equal(events.ends, 1)
})

// --- speak() -----------------------------------------------------------------------
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
