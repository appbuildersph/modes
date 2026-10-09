// Auto-check student answers. Tolerant of formatting (spaces, ₱, %, commas,
// trailing zeros) so a correct numeric answer isn't marked wrong on cosmetics.

function normalize(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[₱$,%\s]/g, '')
}

export function checkAnswer(item, raw) {
  const expected = normalize(item.answer)
  const got = normalize(raw)
  if (!got) return false
  if (got === expected) return true

  // numeric compare (handles 0.5 vs .5 vs 0.50)
  const a = Number(got)
  const b = Number(expected)
  if (!Number.isNaN(a) && !Number.isNaN(b)) {
    return Math.abs(a - b) < 1e-9
  }
  return false
}

export function choiceOptions(item) {
  if (['mcq', 'matching', 'true_false'].includes(item?.type) && Array.isArray(item.options)) return item.options
  return null
}
