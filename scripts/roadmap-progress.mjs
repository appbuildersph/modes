// Computes overall progress from docs/ROADMAP.md.
//
//   node scripts/roadmap-progress.mjs           print the summary
//   node scripts/roadmap-progress.mjs --write   also rewrite the block between
//                                               the progress markers in the file
//
// Task line format (one per task, under a "## X. Name (N pts)" heading):
//   - [ ] **B2** · 8 pts · owner: TBD · text      todo
//   - [~] **B2** · 8 pts · owner: TBD · text      in progress (counts 0)
//   - [x] **B2** · 8 pts · owner: TBD · text      done (counts its full points)
// Only fully done tasks count, so the number cannot be inflated by partial work.

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const FILE = resolve(import.meta.dirname, '../docs/ROADMAP.md')
const START = '<!-- progress:start -->'
const END = '<!-- progress:end -->'

const text = await readFile(FILE, 'utf8')
const groups = new Map()
let current = null

for (const line of text.split('\n')) {
  const heading = line.match(/^## ([A-Z])\. (.+?) \((\d+) pts\)\s*$/)
  if (heading) {
    current = heading[1]
    groups.set(current, { name: heading[2], points: Number(heading[3]), done: 0, active: 0, todo: 0, sum: 0, tasks: 0 })
    continue
  }
  const task = line.match(/^- \[([ x~])\] \*\*([A-Z]\d+)\*\* · (\d+) pts/)
  if (!task) continue
  const group = groups.get(task[2][0])
  if (!group || task[2][0] !== current) throw new Error(`Task ${task[2]} is not under its workstream heading`)
  const pts = Number(task[3])
  group.tasks += 1
  group.sum += pts
  if (task[1] === 'x') group.done += pts
  else if (task[1] === '~') group.active += pts
  else group.todo += pts
}

let total = 0
let done = 0
let active = 0
const problems = []
for (const [key, group] of groups) {
  total += group.sum
  done += group.done
  active += group.active
  if (group.sum !== group.points) problems.push(`${key}: heading says ${group.points} pts but tasks add up to ${group.sum}`)
}
if (total !== 100) problems.push(`Total points are ${total}, expected 100`)

const bar = (value, max) => {
  const width = 20
  const filled = Math.round((value / max) * width)
  return `${'#'.repeat(filled)}${'.'.repeat(width - filled)}`
}

const rows = [...groups].map(
  ([key, g]) => `| ${key}. ${g.name} | ${g.done} / ${g.points} | ${g.active} | ${g.todo} | \`${bar(g.done, g.points)}\` |`,
)
const block = [
  START,
  `**Overall: ${done}% complete** (${done} of ${total} points done; ${active} points in progress, not counted).`,
  '',
  `\`${bar(done, total)}\` ${done}%`,
  '',
  '| Workstream | Done | In progress | To do | |',
  '|---|---|---|---|---|',
  ...rows,
  END,
].join('\n')

console.log(block.replace(START, '').replace(END, '').trim())
if (problems.length) {
  console.error(`\nROADMAP PROBLEMS:\n- ${problems.join('\n- ')}`)
  process.exitCode = 1
}

if (process.argv.includes('--write') && !problems.length) {
  const from = text.indexOf(START)
  const to = text.indexOf(END)
  if (from < 0 || to < 0) throw new Error('Progress markers not found in ROADMAP.md')
  await writeFile(FILE, text.slice(0, from) + block + text.slice(to + END.length))
  console.log('\nUpdated docs/ROADMAP.md')
}
