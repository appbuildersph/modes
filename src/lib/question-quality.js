// Curriculum references are useful for grounding, but they must never become
// the subject of a learner-facing math question.
const CURRICULUM_METADATA_PROMPT = /(?:which\s+(?:learning\s+)?task\s+belongs\s+to|which\s+(?:learning\s+)?(?:goal|competenc(?:y|ies))\s+is\s+aligned\s+with|what\s+(?:learning\s+)?(?:goal|competenc(?:y|ies))\s+(?:is|are)\s+aligned\s+with|\bgrade\s*\d+\s+lesson\b|\b\d+(?:na|m|gm|sp|md)[-–][a-z0-9-]+\b)/i

// Marking-rubric phrasing that belongs in a teacher's answer key, never on a
// choice chip. A learner was being shown "Any correctly labeled angle greater
// than 90° and less than 180°" as one of four options.
const RUBRIC_TEXT = /^(?:any\b|correctly\s|correct display\b|accurate\s|complete\s|appropriate\s|reasonable\s|acceptable\b|varies\b|answers?\s+(?:will\s+)?vary)/i

function textValues(value) {
  if (typeof value === 'string') return [value]
  if (value && typeof value === 'object') return Object.values(value).map(String)
  return []
}

export function isRubricText(value) {
  return RUBRIC_TEXT.test(String(value ?? '').trim())
}

// A choice set is usable when no option — answer included — is rubric prose.
export function hasLearnerFacingOptions(question) {
  const options = question?.options
  if (!Array.isArray(options) || !options.length) return !isRubricText(question?.answer)
  return !isRubricText(question?.answer) && !options.some((option) => isRubricText(option))
}

// True/false sets whose every item is "True" teach guessing, not math. This
// catches a single degenerate item; batch-level balance is enforced where the
// curriculum is built.
export function isDegenerateTrueFalse(question) {
  if (question?.type !== 'true_false') return false
  const options = (question.options ?? []).map((option) => String(option).toLowerCase())
  return options.length > 0 && !options.includes(String(question.answer ?? '').toLowerCase())
}

export function isLearnerFacingQuestion(question) {
  const prompt = question?.q ?? question
  const values = textValues(prompt).map((value) => value.trim()).filter(Boolean)
  if (!values.length) return false
  if (!values.every((value) => !CURRICULUM_METADATA_PROMPT.test(value))) return false
  if (typeof question === 'object' && question !== null) {
    if (!hasLearnerFacingOptions(question)) return false
    if (isDegenerateTrueFalse(question)) return false
  }
  return true
}
