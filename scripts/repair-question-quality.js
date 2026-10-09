// Repairs two content defects found in the bundled MATATAG curriculum.
//
//   1. Marking-rubric prose used as an MCQ option. A learner was shown
//      "Any correctly labeled angle greater than 90° and less than 180°" as
//      one of four choices. Where the rubric is a distractor it is swapped for
//      a same-shape answer from a sibling item in the same competency; where
//      the rubric IS the answer the item cannot be a multiple-choice question
//      at all and is dropped.
//
//   2. Degenerate true/false items. All 304 "Is this solution correct?" items
//      shipped with answer "True", so always tapping True scored 100%. Half
//      are converted to genuine False items by perturbing the number in the
//      proposed answer, so the statement becomes actually wrong.
//
// Deterministic: selection is driven by a hash of the item's source ref and
// index, never Math.random, so re-running produces an identical result.
//
// Usage: node scripts/repair-question-quality.js [--dry-run]

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GRADES = [1, 2, 3, 4, 5, 6]
const DRY_RUN = process.argv.includes('--dry-run')

// "Correct display with values 7, 2, 11, 11 and complete labels" is a marking
// rubric for a data-display task, not something a learner can pick off a chip.
const RUBRIC_TEXT = /^(?:any\b|correctly\s|correct display\b|accurate\s|complete\s|appropriate\s|reasonable\s|acceptable\b|varies\b|answers?\s+(?:will\s+)?vary)/i
const PROPOSED = /Proposed answer:\s*(.+?)\s*$/i

const isRubric = (value) => RUBRIC_TEXT.test(String(value ?? '').trim())

function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return h
}

// Walk any competency shape and yield every { q, answer } item with the array
// that holds it, so items can be replaced or removed in place.
function forEachItemList(node, visit) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    if (node.some((entry) => entry && typeof entry === 'object' && entry.q && entry.answer !== undefined)) visit(node)
    node.forEach((entry) => forEachItemList(entry, visit))
    return
  }
  Object.values(node).forEach((value) => forEachItemList(value, visit))
}

const itemKey = (item, index) => `${item?.source?.ref ?? ''}:${item?.source?.path ?? ''}:${item?.source?.item ?? index}`

// ---- defect 1: rubric options ------------------------------------------

// Answer "shape" — a numeric option set must not gain a worded distractor and
// vice versa, or the odd one out gives the answer away.
function answerShape(value) {
  const text = String(value).trim()
  if (!/^[₱$]?-?[\d.,\s]+(?:cm|mm|m|km|kg|g|L|mL|°|%)?\.?$/i.test(text)) return 'words'
  // "7.324, 7.601, 15.925" is a list, not a single value. Mixing the two makes
  // the odd one out obvious without doing any maths.
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).length > 1 ? 'numeric-list' : 'numeric'
}

// A replacement must look like the other choices: same item type, same answer
// shape, not rubric prose, and not already in the option set. The pool is the
// whole grade — a single competency rarely has enough spare answers, which is
// why an earlier competency-only pool repaired nothing.
function findReplacement(item, pool, taken) {
  const shape = answerShape(item.answer)
  const candidates = pool
    .filter((other) => other !== item && other.type === item.type)
    .filter((other) => !isRubric(other.answer) && answerShape(other.answer) === shape)
    .filter((other) => String(other.answer) && !taken.has(String(other.answer)))
  if (!candidates.length) return null
  // Prefer answers from the same competency, then fall back to the grade.
  const sameRef = candidates.filter((other) => other?.source?.ref === item?.source?.ref)
  const ranked = (sameRef.length ? sameRef : candidates).map((other) => String(other.answer))
  // Deterministic pick: stable across runs for a given item.
  return ranked[hash(itemKey(item, 0)) % ranked.length]
}

function repairRubricOptions(list, pool, stats) {
  for (let index = list.length - 1; index >= 0; index--) {
    const item = list[index]
    if (!Array.isArray(item.options) || !item.options.length) continue

    if (isRubric(item.answer)) {
      // Open-ended by nature — it was never a valid multiple-choice item.
      list.splice(index, 1)
      stats.droppedRubricAnswer++
      continue
    }

    const rubricOptions = item.options.filter((option) => isRubric(option))
    if (!rubricOptions.length) continue

    const taken = new Set(item.options.map(String).filter((option) => !isRubric(option)))
    let repaired = true
    item.options = item.options.map((option) => {
      if (!isRubric(option)) return option
      const replacement = findReplacement(item, pool, taken)
      if (!replacement) {
        repaired = false
        return option
      }
      taken.add(replacement)
      return replacement
    })

    if (!repaired) {
      // No same-shape stand-in anywhere in the grade. Better a genuine
      // three-choice question than a rubric on a chip, or a dropped lesson item.
      item.options = item.options.filter((option) => !isRubric(option))
      if (item.options.length < 2) {
        list.splice(index, 1)
        stats.droppedUnfixableOptions++
      } else {
        stats.shortenedOptions++
      }
    } else {
      stats.repairedOptions++
    }
  }
}

// ---- defect 2: all-True true/false --------------------------------------

// Nudge the last number in the proposed answer so the claim becomes false.
// The delta scales with magnitude so the wrong value stays plausible rather
// than absurd (a learner should have to check, not eyeball it).
function perturbNumbers(text, seed) {
  const matches = [...text.matchAll(/-?\d+(?:\.\d+)?/g)]
  if (!matches.length) return null
  const target = matches[matches.length - 1]
  const original = target[0]
  const value = Number(original)
  if (!Number.isFinite(value)) return null

  const magnitude = Math.abs(value)
  const step = magnitude >= 1000 ? 100 : magnitude >= 100 ? 10 : magnitude >= 10 ? 2 : 1
  const direction = seed % 2 === 0 ? 1 : -1
  let changed = value + direction * step
  if (changed === value) changed = value + step
  // Keep counts non-negative — "-1 mangoes" reads as a typo, not a wrong answer.
  if (value >= 0 && changed < 0) changed = value + step

  const decimals = original.includes('.') ? original.split('.')[1].length : 0
  const rendered = decimals ? changed.toFixed(decimals) : String(changed)
  if (rendered === original) return null

  return text.slice(0, target.index) + rendered + text.slice(target.index + original.length)
}

// Perturbing a number inside a comparison can leave the claim TRUE — turning
// "178,434 > 23,868" into "178,434 > 23,878" keeps the relation correct while
// the item is labelled False. Every False item is re-verified here and the
// operator is flipped when the relation still holds.
const OPERATOR_FLIP = { '>': '<', '<': '>', '>=': '<', '<=': '>', '=': '>' }

function parseNumber(text) {
  const cleaned = String(text).replace(/[₱$,\s]/g, '').replace(/(cm|mm|km|m|kg|g|mL|L|°|%)$/i, '')
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null
  return Number(cleaned)
}

function relationHolds(text) {
  const match = String(text).match(/^(.+?)\s*(>=|<=|>|<|=)\s*(.+)$/)
  if (!match) return null
  const left = parseNumber(match[1])
  const right = parseNumber(match[3])
  if (left === null || right === null) return null
  switch (match[2]) {
    case '>': return { holds: left > right, operator: match[2] }
    case '<': return { holds: left < right, operator: match[2] }
    case '>=': return { holds: left >= right, operator: match[2] }
    case '<=': return { holds: left <= right, operator: match[2] }
    default: return { holds: left === right, operator: match[2] }
  }
}

function verifyFalseRelations(list, stats) {
  for (const item of list) {
    if (item.type !== 'true_false' || String(item.answer) !== 'False') continue
    const languages = Object.keys(item.q ?? {})
    const rewritten = {}
    let needsFix = false
    for (const language of languages) {
      const text = String(item.q[language] ?? '')
      const proposed = text.match(PROPOSED)
      if (!proposed) { rewritten[language] = text; continue }
      const relation = relationHolds(proposed[1])
      if (!relation || !relation.holds) { rewritten[language] = text; continue }
      // Still true while labelled False — flip the operator so it is genuinely wrong.
      const flipped = proposed[1].replace(relation.operator, OPERATOR_FLIP[relation.operator])
      rewritten[language] = text.slice(0, proposed.index) + `Proposed answer: ${flipped}`
      needsFix = true
    }
    if (needsFix) {
      item.q = rewritten
      stats.relationsCorrected++
    }
  }
}

function repairTrueFalse(list, stats) {
  for (const [index, item] of list.entries()) {
    if (item.type !== 'true_false') continue
    stats.trueFalseSeen++
    if (String(item.answer) !== 'True') continue

    const seed = hash(itemKey(item, index))
    // Flip roughly half the pool, deterministically.
    if (seed % 2 !== 0) continue

    const languages = Object.keys(item.q ?? {})
    const rewritten = {}
    let ok = languages.length > 0
    for (const language of languages) {
      const text = String(item.q[language] ?? '')
      const proposed = text.match(PROPOSED)
      if (!proposed) {
        ok = false
        break
      }
      // Comparisons are handled by verifyFalseRelations — perturbing a number
      // inside one can leave the claim true.
      if (relationHolds(proposed[1])) { ok = false; break }
      const perturbed = perturbNumbers(proposed[1], seed)
      if (!perturbed) {
        ok = false
        break
      }
      rewritten[language] = text.slice(0, proposed.index) + `Proposed answer: ${perturbed}`
    }
    if (!ok) {
      stats.trueFalseUnchanged++
      continue
    }

    item.q = rewritten
    item.answer = 'False'
    if (item.solution && typeof item.solution === 'object') {
      item.solution = Object.fromEntries(Object.keys(item.solution).map((language) => [language, 'Answer: False']))
    }
    stats.trueFalseFlipped++
  }
}

// ---- defect 3: written-work instructions on tap-only items --------------

// "Explain why your answer is reasonable." / "Show your solution." are written
// work. On a multiple-choice or true/false item the learner can only tap a
// chip, so the instruction is impossible to follow and just adds noise.
const WRITTEN_WORK = /\s*(?:Explain why your answer is reasonable\.?|Explain your answer\.?|Show your solution\.?|Show your work\.?)\s*$/i

function stripWrittenWorkInstructions(list, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' && item.type !== 'true_false') continue
    if (!item.q || typeof item.q !== 'object') continue
    let changed = false
    const rewritten = {}
    for (const [language, value] of Object.entries(item.q)) {
      const text = String(value ?? '')
      const stripped = text.replace(WRITTEN_WORK, '').trim()
      rewritten[language] = stripped || text
      if (stripped && stripped !== text) changed = true
    }
    if (changed) {
      item.q = rewritten
      stats.strippedWrittenWork++
    }
  }
}

// ---- defect 5: option shapes that give the answer away --------------------

// "How many sides and corners does the triangle have?" shipped with options
// ["6", "3 sides and 3 corners", "4", "2"]. The answer is the only worded
// option, so it can be picked without doing any maths. Where the answer is the
// odd one out, its distractors are rebuilt from the answer's own structure by
// perturbing the numbers (and flipping any comparison), which keeps every
// choice the same shape.
const RELATION_FLIP = { '>': '<', '<': '>', '>=': '<=', '<=': '>=', '=': '>' }

function variantsOf(answer) {
  const text = String(answer)
  const variants = new Set()

  // Flip a comparison — "85 < 97" becomes the false "85 > 97".
  const operator = text.match(/(>=|<=|>|<|=)/)
  if (operator) variants.add(text.replace(operator[1], RELATION_FLIP[operator[1]]))

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)]
  for (const delta of [1, -1, 2, -2, 3, 10]) {
    // Nudge every number together, then each number on its own.
    const all = text.replace(/\d+(?:\.\d+)?/g, (value) => {
      const changed = Number(value) + delta
      return changed >= 0 ? String(changed) : value
    })
    if (all !== text) variants.add(all)
    for (const match of numbers) {
      const changed = Number(match[0]) + delta
      if (changed < 0) continue
      const single = text.slice(0, match.index) + changed + text.slice(match.index + match[0].length)
      if (single !== text) variants.add(single)
    }
  }
  variants.delete(text)
  return [...variants]
}

function alignOptionShapes(list, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options) || item.options.length < 2) continue
    const answer = String(item.answer)
    const shape = answerShape(answer)
    const distractors = item.options.map(String).filter((option) => option !== answer)
    if (!distractors.length) continue
    // Only act when NO distractor shares the answer's shape.
    if (distractors.some((option) => answerShape(option) === shape)) continue

    const replacements = variantsOf(answer).filter((variant) => variant !== answer)
    if (replacements.length < distractors.length) {
      stats.optionShapesUnfixable++
      continue
    }

    // Deterministic, stable selection.
    const seed = hash(itemKey(item, 0))
    const chosen = []
    for (let offset = 0; chosen.length < distractors.length && offset < replacements.length; offset++) {
      const candidate = replacements[(seed + offset) % replacements.length]
      if (!chosen.includes(candidate)) chosen.push(candidate)
    }
    if (chosen.length < distractors.length) {
      stats.optionShapesUnfixable++
      continue
    }

    // Keep the answer where it already sat so the correct slot is not predictable.
    const answerIndex = item.options.findIndex((option) => String(option) === answer)
    const rebuilt = []
    let next = 0
    for (let index = 0; index < item.options.length; index++) {
      rebuilt.push(index === answerIndex ? answer : chosen[next++])
    }
    item.options = rebuilt
    stats.optionShapesAligned++
  }
}

// A comparison answer needs FALSE distractors. Perturbing the numbers in
// "85 < 97" can easily yield "83 < 95", which is also true — leaving a
// multiple-choice item with several correct answers. False variants are
// therefore derived from the relation itself: pick a right-hand value that
// makes the stated comparison fail.
function relationIsTrue(text) {
  const verdict = relationHolds(text)
  return verdict ? verdict.holds : null
}

// Replace the first number in a string, preserving any currency or unit around it.
function replaceFirstNumber(text, value) {
  return text.replace(/\d+(?:[.,]\d+)*/, String(value))
}

function falseRelationVariants(answer) {
  const match = String(answer).match(/^(.+?)\s*(>=|<=|>|<|=)\s*(.+)$/)
  if (!match) return []
  const [, leftText, operator, rightText] = match
  const left = parseNumber(leftText)
  if (left === null || parseNumber(rightText) === null) return []

  // Values for the right-hand side that make the stated comparison false.
  const offsets = [0, 1, 2, 3, 5, 8]
  const targets = []
  for (const offset of offsets) {
    if (operator === '<') targets.push(left - offset)
    else if (operator === '>') targets.push(left + offset)
    else if (operator === '<=') targets.push(left - offset - 1)
    else if (operator === '>=') targets.push(left + offset + 1)
    else targets.push(left + offset + 1, left - offset - 1)
  }

  const variants = new Set()
  // Flipping the operator on a true comparison always yields a false one.
  variants.add(`${leftText} ${RELATION_FLIP[operator]} ${rightText}`)
  for (const target of targets) {
    if (target < 0) continue
    variants.add(`${leftText} ${operator} ${replaceFirstNumber(rightText, target)}`)
  }
  variants.delete(String(answer))
  return [...variants].filter((variant) => relationIsTrue(variant) === false)
}

function fixAmbiguousRelationOptions(list, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    const answer = String(item.answer)
    if (relationIsTrue(answer) !== true) continue

    const falseVariants = falseRelationVariants(answer)
    const used = new Set([answer])
    let changed = false
    let exhausted = false

    const rebuilt = item.options.map((option) => {
      const text = String(option)
      if (text === answer) return text
      // Keep a distractor only when it is genuinely false AND not a duplicate.
      if (relationIsTrue(text) === false && !used.has(text)) {
        used.add(text)
        return text
      }
      const replacement = falseVariants.find((variant) => !used.has(variant))
      if (!replacement) {
        exhausted = true
        return text
      }
      used.add(replacement)
      changed = true
      return replacement
    })

    if (exhausted) {
      stats.ambiguousRelationsUnfixable++
      continue
    }
    if (changed) {
      item.options = rebuilt
      stats.ambiguousRelationsFixed++
    }
  }
}

// Worded answers fall into small closed families — days, solids, plane shapes,
// angle types, transformations, times, fractions, and so on. Drawing a
// distractor from the answer's own family is what makes it a real alternative
// instead of a random string from another topic.
const ANSWER_FAMILIES = [
  { key: 'fraction', test: /^\d+\s*\/\s*\d+$/ },
  { key: 'time', test: /^\d{1,2}:\d{2}(\s*[ap]\.?m\.?)?$/i },
  { key: 'weekday', test: /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i },
  { key: 'month', test: /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i },
  { key: 'transformation', test: /^(translation|rotation|reflection)( or (slide|flip|turn))?$/i },
  { key: 'solid', test: /^(cube|rectangular prism|triangular prism|sphere|cylinder|cone|pyramid|square pyramid)$/i },
  { key: 'plane-shape', test: /^(square|rectangle|triangle|circle|rhombus|trapezoid|parallelogram|pentagon|hexagon|octagon|quadrilateral)$/i },
  { key: 'angle', test: /^(acute|obtuse|right|straight|reflex)( angle)?$/i },
  { key: 'faces', test: /^\d+ faces$/i },
  { key: 'sides-corners', test: /^\d+ sides and \d+ corners$/i },
  { key: 'yes-no', test: /^(yes|no)$/i },
  { key: 'ordinal', test: /^\d+(st|nd|rd|th)$/i },
]

// Canonical members so a family never runs dry, even if the corpus is thin.
const FAMILY_VOCAB = {
  weekday: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  transformation: ['translation or slide', 'rotation', 'reflection or flip'],
  solid: ['cube', 'rectangular prism', 'triangular prism', 'sphere', 'cylinder', 'cone', 'square pyramid'],
  'plane-shape': ['square', 'rectangle', 'triangle', 'circle', 'rhombus', 'trapezoid', 'parallelogram', 'pentagon', 'hexagon'],
  angle: ['acute angle', 'right angle', 'obtuse angle', 'straight angle', 'reflex angle'],
  'yes-no': ['Yes', 'No'],
}

// "translation" and "translation or slide" are the same choice worded twice —
// collapse them so a set cannot offer both.
function familyMemberKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+or\s+(slide|flip|turn)$/, '')
    .replace(/\s+angle$/, '')
    .replace(/[^a-z0-9/:]+/g, ' ')
    .trim()
}

function familyOf(value) {
  const text = String(value).trim()
  return ANSWER_FAMILIES.find((family) => family.test.test(text))?.key ?? null
}

// Members of the answer's family: the canonical list plus anything the corpus
// already uses, so real curriculum wording wins where it exists.
function familyCandidates(answer, pool) {
  const family = familyOf(answer)
  if (!family) return []
  const fromCorpus = pool
    .map((other) => String(other.answer))
    .filter((candidate) => familyOf(candidate) === family)
  const canonical = FAMILY_VOCAB[family] ?? []
  const seen = new Set([familyMemberKey(answer)])
  const merged = []
  for (const candidate of [...canonical, ...fromCorpus]) {
    const key = familyMemberKey(candidate)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(candidate)
  }
  return merged
}

// A borrowed distractor has to be a believable answer to the SAME question.
// Pulling any spare string from the grade produced sets like
// ["Wednesday", "Correct display with values 4, 8, 5, 3 and complete labels"],
// which is noise, not a distractor.
const BOILERPLATE_ANSWER = /^correct display with values/i

function isPlausibleDistractor(candidate, answer) {
  const text = String(candidate).trim()
  if (!text || BOILERPLATE_ANSWER.test(text)) return false
  const answerText = String(answer).trim()
  if (text === answerText) return false
  // When the answer belongs to a family, every option must belong to it too.
  const family = familyOf(answerText)
  if (family) return familyOf(text) === family
  // Similar length and similar word count — a one-word answer wants one-word
  // distractors, not a sentence.
  const ratio = text.length / Math.max(1, answerText.length)
  if (ratio > 2.2 || ratio < 0.4) return false
  const words = (text.match(/\S+/g) ?? []).length
  const answerWords = (answerText.match(/\S+/g) ?? []).length
  return Math.abs(words - answerWords) <= 2
}

// Same competency first — those answers come from the same topic, so they read
// as real alternatives.
function borrowPlausible(item, pool, used) {
  const answer = String(item.answer)
  // Same family first — a solid gets other solids, a weekday gets other days.
  const family = familyCandidates(answer, pool).filter((candidate) => !used.has(candidate))
  if (family.length) return family[hash(itemKey(item, 0) + used.size) % family.length]
  const shape = answerShape(answer)
  const eligible = pool
    .filter((other) => other !== item && other.type === item.type)
    .filter((other) => answerShape(other.answer) === shape)
    .filter((other) => !isRubric(other.answer) && !FILLER_OPTION.test(String(other.answer).trim()))
    .filter((other) => !used.has(String(other.answer)))
    .filter((other) => isPlausibleDistractor(other.answer, answer))

  const sameRef = eligible.filter((other) => other?.source?.ref === item?.source?.ref)
  const ranked = (sameRef.length ? sameRef : eligible).map((other) => String(other.answer))
  if (!ranked.length) return null
  return ranked[hash(itemKey(item, 0)) % ranked.length]
}

// Repairs sets that an earlier, looser borrow left incoherent.
function repairImplausibleDistractors(list, pool, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    const answer = String(item.answer)
    if (answerShape(answer) !== 'words') continue
    if (!item.options.some((option) => String(option) !== answer && !isPlausibleDistractor(option, answer))) continue

    const used = new Set([answer])
    const family = familyOf(answer)
    // A two-member family (Yes/No) cannot fill four slots. Offer the real
    // choices rather than padding with unrelated values.
    const available = family ? familyCandidates(answer, pool).length + 1 : Infinity
    const target = Math.max(2, Math.min(item.options.length, available))

    const rebuilt = []
    let exhausted = false
    for (const option of item.options) {
      if (rebuilt.length >= target) break
      const text = String(option)
      if (text === answer) { rebuilt.push(text); continue }
      if (isPlausibleDistractor(text, answer) && !used.has(text)) {
        used.add(text)
        rebuilt.push(text)
        continue
      }
      const replacement = borrowPlausible(item, pool, used)
      if (!replacement) { exhausted = true; break }
      used.add(replacement)
      rebuilt.push(replacement)
    }

    if (!rebuilt.includes(answer)) rebuilt.push(answer)
    // Running out of candidates is only a failure if we could not reach a
    // usable set — two real choices are better than four with three fillers.
    if (rebuilt.length < 2 || new Set(rebuilt.map(String)).size !== rebuilt.length) {
      stats.implausibleDistractorsUnfixable++
      continue
    }
    item.options = rebuilt
    if (rebuilt.length < item.options.length) stats.optionSetsShortened++
    stats.implausibleDistractorsFixed++
  }
}

// Two options that are the same choice worded differently ("translation" and
// "translation or slide") make one of them dead weight and hint at the other.
function collapseDuplicateFamilyWording(list, pool, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    const answer = String(item.answer)

    // Only closed families. familyMemberKey strips currency and punctuation, so
    // on plain numbers it would read "₱30.33" and "30.33" as the same choice.
    if (!familyOf(answer)) continue

    const keys = item.options.map((option) => familyMemberKey(option))
    const hasCollision = keys.some((key, index) => keys.indexOf(key) !== index)
    if (!hasCollision) continue

    const used = new Set([familyMemberKey(answer)])
    // A three-member family cannot fill four slots without repeating itself.
    const family = familyOf(answer)
    const available = family ? familyCandidates(answer, pool).length + 1 : Infinity
    const target = Math.max(2, Math.min(item.options.length, available))

    const rebuilt = []
    for (const option of item.options) {
      if (rebuilt.length >= target) break
      const text = String(option)
      if (text === answer) { rebuilt.push(text); continue }
      const key = familyMemberKey(text)
      if (!used.has(key)) {
        used.add(key)
        rebuilt.push(text)
        continue
      }
      const replacement = familyCandidates(answer, pool).find((candidate) => !used.has(familyMemberKey(candidate)))
      if (!replacement) continue
      used.add(familyMemberKey(replacement))
      rebuilt.push(replacement)
    }

    if (!rebuilt.includes(answer)) {
      if (rebuilt.length >= target) rebuilt.pop()
      rebuilt.push(answer)
    }
    if (rebuilt.length < 2 || new Set(rebuilt.map(String)).size !== rebuilt.length) {
      stats.duplicateWordingUnfixable++
      continue
    }
    if (rebuilt.length < item.options.length) stats.optionSetsShortened++
    item.options = rebuilt
    stats.duplicateWordingFixed++
  }
}

// ---- defect 7: filler distractors -----------------------------------------

// 172 items shipped as "<the answer> / A different value / Cannot be
// determined / None of these" — the only concrete option is the correct one,
// so the learner never has to compute anything. Filler is replaced with real
// distractors derived from the answer.
const FILLER_OPTION = /^(?:a different value|cannot be determined|none of (?:these|the above)|all of the above|not enough information|no answer|other)\.?$/i

function replaceFillerOptions(list, pool, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    const answer = String(item.answer)
    if (!item.options.some((option) => FILLER_OPTION.test(String(option).trim()))) continue

    const candidates = variantsOf(answer).filter((variant) => variant !== answer)
    const used = new Set([answer])
    // Worded answers ("Wednesday", "cube") have no numeric variants, so borrow
    // same-shape answers from elsewhere in the grade instead.
    const borrow = () => borrowPlausible(item, pool, used)
    let exhausted = false

    const rebuilt = item.options.map((option) => {
      const text = String(option)
      if (text === answer) return text
      if (!FILLER_OPTION.test(text.trim()) && !used.has(text)) {
        used.add(text)
        return text
      }
      const replacement = candidates.find((variant) => !used.has(variant)) ?? borrow()
      if (!replacement) {
        exhausted = true
        return text
      }
      used.add(replacement)
      return replacement
    })

    if (exhausted || new Set(rebuilt.map(String)).size !== rebuilt.length) {
      stats.fillerOptionsUnfixable++
      continue
    }
    item.options = rebuilt
    stats.fillerOptionsReplaced++
  }
}

// ---- defect 6: formatting that flags the answer ---------------------------

// Options must not differ in bookkeeping. "₱62.95" among "63.95 / 61.95 /
// 125.9" is spotted by the peso sign alone, and a lone two-decimal option is
// just as loud. Distractors are re-rendered to match the answer's currency
// symbol and decimal precision.
const CURRENCY = /^([₱$])/

function decimalPlaces(text) {
  const match = String(text).match(/\.(\d+)/)
  return match ? match[1].length : 0
}

function normalizeOptionFormatting(list, stats) {
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    const answer = String(item.answer)
    if (answerShape(answer) === 'words') continue

    const symbol = (answer.match(CURRENCY) ?? [])[1] ?? ''
    const places = decimalPlaces(answer)
    let changed = false

    const rebuilt = item.options.map((option) => {
      const text = String(option)
      if (text === answer) return text
      if (answerShape(text) === 'words') return text

      const bare = text.replace(CURRENCY, '')
      // Only reformat plain single values; lists keep their own punctuation.
      if (!/^-?\d+(?:\.\d+)?$/.test(bare)) return text

      const rendered = places ? Number(bare).toFixed(places) : bare
      const next = `${symbol}${rendered}`
      if (next !== text) changed = true
      return next
    })

    // Never let reformatting collapse two options into one.
    if (changed && new Set(rebuilt.map(String)).size === rebuilt.length) {
      item.options = rebuilt
      stats.optionFormatsNormalized++
    }
  }
}

// A numeric set that lost options to an earlier pass is topped back up with
// values derived from the answer, so learners still get four real choices.
function topUpNumericOptions(list, stats) {
  const TARGET = 4
  for (const item of list) {
    if (item.type !== 'mcq' || !Array.isArray(item.options)) continue
    if (item.options.length >= TARGET) continue
    const answer = String(item.answer)
    if (familyOf(answer)) continue
    // Comparisons read as 'words' by shape but top up from their own false
    // variants; everything else uses numeric perturbation.
    const isRelation = relationIsTrue(answer) === true
    if (!isRelation && answerShape(answer) === 'words') continue

    const used = new Set(item.options.map(String))
    const candidates = (isRelation ? falseRelationVariants(answer) : variantsOf(answer))
      .filter((variant) => !used.has(variant))
    const added = []
    for (const candidate of candidates) {
      if (item.options.length + added.length >= TARGET) break
      used.add(candidate)
      added.push(candidate)
    }
    if (!added.length) continue
    item.options = [...item.options, ...added]
    stats.numericOptionsToppedUp++
  }
}

// ---- defect 4: duplicate items --------------------------------------------

// Some items differed only by a trailing written-work instruction, so removing
// that instruction reveals them as true duplicates. A competency that asks the
// same question twice in a row wastes the learner's time.
function dedupeItems(list, stats) {
  const kept = new Set()
  for (let index = 0; index < list.length; index++) {
    const signature = JSON.stringify(list[index]?.q ?? null)
    if (signature === 'null') continue
    if (kept.has(signature)) {
      list.splice(index, 1)
      index--
      stats.duplicatesRemoved++
      continue
    }
    kept.add(signature)
  }
}

// ---- run ----------------------------------------------------------------

const stats = {
  repairedOptions: 0,
  shortenedOptions: 0,
  droppedRubricAnswer: 0,
  droppedUnfixableOptions: 0,
  trueFalseSeen: 0,
  trueFalseFlipped: 0,
  trueFalseUnchanged: 0,
  relationsCorrected: 0,
  strippedWrittenWork: 0,
  duplicatesRemoved: 0,
  optionShapesAligned: 0,
  optionShapesUnfixable: 0,
  ambiguousRelationsFixed: 0,
  ambiguousRelationsUnfixable: 0,
  optionFormatsNormalized: 0,
  fillerOptionsReplaced: 0,
  fillerOptionsUnfixable: 0,
  implausibleDistractorsFixed: 0,
  implausibleDistractorsUnfixable: 0,
  optionSetsShortened: 0,
  duplicateWordingFixed: 0,
  duplicateWordingUnfixable: 0,
  numericOptionsToppedUp: 0,
}

for (const grade of GRADES) {
  const path = join(ROOT, 'src', 'curriculum', `grade${grade}.json`)
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const pool = []
  forEachItemList(data, (list) => pool.push(...list))
  forEachItemList(data, (list) => {
    repairRubricOptions(list, pool, stats)
    repairTrueFalse(list, stats)
    verifyFalseRelations(list, stats)
    stripWrittenWorkInstructions(list, stats)
    replaceFillerOptions(list, pool, stats)
    repairImplausibleDistractors(list, pool, stats)
    collapseDuplicateFamilyWording(list, pool, stats)
    topUpNumericOptions(list, stats)
    alignOptionShapes(list, stats)
    fixAmbiguousRelationOptions(list, stats)
    normalizeOptionFormatting(list, stats)
    dedupeItems(list, stats)
  })
  if (!DRY_RUN) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

console.log(DRY_RUN ? 'repair-question-quality (dry run)' : 'repair-question-quality')
for (const [key, value] of Object.entries(stats)) console.log(`  ${key}: ${value}`)
