import teachingOverrides from '../curriculum/teaching-overrides.json' with { type: 'json' }

// Per-competency repairs: rebuild an item set for a competency whose source
// content is unusable. Empty now that Gabay is Grades 4-6 — every entry here
// targeted Grade 1. Add entries keyed by competency ref when a 4-6 topic needs
// the same treatment.
const COMPETENCY_REPAIRS = Object.freeze({})

function applyItemOverrides(items, itemOverrides) {
  if (!itemOverrides) return items

  return items.map((item, index) => {
    const override = itemOverrides[String(index)]
    return override ? { ...item, ...override } : item
  })
}

export function applyCurriculumOverrides(curriculum) {
  return curriculum.map((competency) => {
    const override = teachingOverrides[competency.ref]
    const { item_overrides: itemOverrides, ...lessonOverride } = override ?? {}
    const overridden = override ? {
      ...competency,
      ...lessonOverride,
      items: applyItemOverrides(competency.items, itemOverrides),
    } : competency
    const competencyRepair = COMPETENCY_REPAIRS[competency.ref]
    if (!competencyRepair) return overridden

    const { repairItem, ...teaching } = competencyRepair
    return {
      ...overridden,
      ...teaching,
      items: overridden.items.map(repairItem),
    }
  })
}
