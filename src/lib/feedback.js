// Learner-centered feedback. Builds the immediate message shown at the top of a
// question and the explanation for a wrong answer. Supports **bold** markup
// (rendered by <RichText>) so the correct answer / key step stands out.

const HEAD_CORRECT = {
  en: ['Great job! You used the correct method.', 'Correct! Nicely solved.', 'Well done — that is right!'],
  fil: ['Magaling! Tama ang ginawa mong paraan.', 'Tama! Ang galing mo.', 'Husay — tama ang sagot!'],
  taglish: ['Good job! Correct ang method mo.', 'Tama! Ang galing mo, iskolar.', 'Nice! Tama ang sagot mo.'],
}

const HEAD_WRONG = {
  en: 'Almost! Let us check the steps together.',
  fil: 'Halos na! Tingnan natin ang mga hakbang.',
  taglish: 'Halos na! Check natin yung steps.',
}

const ANSWER_LABEL = {
  en: 'Correct answer',
  fil: 'Tamang sagot',
  taglish: 'Tamang sagot',
}

function pick(arr, seed = 0) {
  return arr[Math.abs(seed) % arr.length]
}

// Returns { ok, headline, body } for the chalkboard / summary.
// body is empty when correct, the worked explanation when wrong.
export function feedbackFor(item, isCorrect, lang = 'taglish', seed = 0) {
  const L = lang in HEAD_CORRECT ? lang : 'taglish'
  if (isCorrect) {
    return { ok: true, headline: pick(HEAD_CORRECT[L], seed), body: '' }
  }
  const label = ANSWER_LABEL[L]
  const sol = item?.solution
    ? item.solution
    : `${label}: **${item?.answer ?? ''}**.`
  return { ok: false, headline: HEAD_WRONG[L], body: sol }
}

// One-line review feedback string (used in the Pagsasanay history log).
export function reviewFeedback(item, isCorrect, lang = 'taglish') {
  const fb = feedbackFor(item, isCorrect, lang)
  return isCorrect ? fb.headline : fb.body
}

export function vibrateCorrect() {
  navigator.vibrate?.(80)
}

export function vibrateWrong() {
  navigator.vibrate?.([80, 40, 80])
}
