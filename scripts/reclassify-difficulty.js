import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { difficultyFor } from '../src/lib/difficulty.js'

const root = resolve(import.meta.dirname, '..')

for (let grade = 1; grade <= 6; grade++) {
  const path = resolve(root, `src/curriculum/grade${grade}.json`)
  const curriculum = JSON.parse(await readFile(path, 'utf8'))
  const counts = { madali: 0, katamtaman: 0, mahirap: 0 }
  for (const lesson of curriculum) {
    lesson.difficulty = difficultyFor(lesson.competency)
    counts[lesson.difficulty] += 1
  }
  await writeFile(path, `${JSON.stringify(curriculum, null, 2)}\n`)
  console.log(`Grade ${grade}:`, counts)
}
