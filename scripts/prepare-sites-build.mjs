import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')
const client = resolve(dist, 'client')
const server = resolve(dist, 'server')

await rm(client, { recursive: true, force: true })
await rm(server, { recursive: true, force: true })
await mkdir(client, { recursive: true })
await mkdir(server, { recursive: true })

for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (entry.name === 'client' || entry.name === 'server' || entry.name === '.openai') continue
  await cp(resolve(dist, entry.name), resolve(client, entry.name), { recursive: true })
  await rm(resolve(dist, entry.name), { recursive: true, force: true })
}

await cp(resolve(root, 'scripts/sites-worker.js'), resolve(server, 'index.js'))
