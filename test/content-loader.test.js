import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('client curriculum loader fetches and caches one grade at a time', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    const { getContentByRef, loadContentByGrade } = await server.ssrLoadModule('/src/lib/content.js')
    assert.equal(getContentByRef('4MG-Ia-1'), null)
    const grade4 = await loadContentByGrade(4)
    assert.equal(grade4.length, 54)
    assert.equal(getContentByRef('4MG-Ia-1')?.grade, 4)
    assert.strictEqual(await loadContentByGrade(4), grade4)
    // Out-of-scope grades resolve to nothing rather than loading their file.
    assert.deepEqual(await loadContentByGrade(1), [])
    assert.deepEqual(await loadContentByGrade(3), [])
  } finally {
    await server.close()
  }
})
