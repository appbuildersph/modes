export const DIFFICULTIES = ['madali', 'katamtaman', 'mahirap']

// Difficulty is relative to the learner's current grade. The curriculum already
// controls the number range and concepts for that grade, so this rubric focuses
// on the kind of thinking the competency asks for.
const HARD = [
  /\bsolve\b.*\bproblems?\b/,
  /draw conclusions|make inferences/,
  /explore inductively|derivation of the formulas?/,
  /perform .*?(?:three or more|two or more|3 to 4)\b/,
  /\b(?:gmdas|gemdas|mdas) rules?\b/,
  /add and subtract dissimilar fractions/,
  /(?:find|perimeter|area).*composite figures?/,
  /problems? involving gcf and lcm/,
]

const MEDIUM = [
  /\bcompare|\border|\bdetermine|\bestimate|\binterpret|\bconstruct|\bcalculate|\bconvert/,
  /compose and decompose|\bdecompose\b|\bfind\b|\bmultiply|\bdivide|\badd\b|\bsubtract/,
  /\bround|\bclassify|\bdifferentiate|\bapply|\bcomplete|\bgenerate|\btessellate/,
  /missing number|equivalent|place value|value of/,
  /surface area|\bprobability|\bperimeter|\barea|\bvolume/,
]

export function difficultyFor(competency = '') {
  const text = String(competency).toLowerCase().replace(/\s+/g, ' ')
  if (HARD.some((pattern) => pattern.test(text))) return 'mahirap'
  if (MEDIUM.some((pattern) => pattern.test(text))) return 'katamtaman'
  return 'madali'
}
