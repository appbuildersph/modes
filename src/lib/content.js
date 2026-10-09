// Vite serves JSON imports as JavaScript modules in both development and builds.
// Adding a native JSON MIME assertion breaks the development server because the
// transformed response is JavaScript, not application/json.
import { applyCurriculumOverrides } from './curriculum-overrides.js'

// Grades 4-6 only. Listing grades 1-3 here would let a stale stored grade pull
// out-of-scope curriculum into the bundle on demand.
const loaders = {
  4: () => import('../curriculum/grade4.json'),
  5: () => import('../curriculum/grade5.json'),
  6: () => import('../curriculum/grade6.json'),
}

const cache = new Map()

export async function loadContentByGrade(grade) {
  const key = Number(grade)
  if (!loaders[key]) return []
  if (!cache.has(key)) {
    cache.set(key, loaders[key]().then((module) => {
      const curriculum = applyCurriculumOverrides(module.default)
      cache.set(key, curriculum)
      return curriculum
    }))
  }
  return await cache.get(key)
}

export function getContentByRef(ref) {
  for (const content of cache.values()) {
    if (Array.isArray(content)) {
      const found = content.find((competency) => competency.ref === ref)
      if (found) return found
    }
  }
  return null
}
