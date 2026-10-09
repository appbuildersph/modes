import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.env.SHOT_DIR || resolve(root, 'shots')
const BASE = process.env.BASE || 'http://localhost:4173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const log = []
page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`))

async function shot(name) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: true })
  console.log('shot', name)
}
async function tap(rx) {
  try {
    await page.getByText(rx).first().click({ timeout: 5000 })
    await page.waitForTimeout(500)
    return true
  } catch (e) {
    log.push(`tap fail ${rx}: ${e.message.split('\n')[0]}`)
    return false
  }
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await shot('1-splash')
await tap(/MAGSIMULA/)
await shot('2-home')
await tap(/Buksan/)
await shot('3-start')
await tap(/Magsimula na|Tingnan ang listahan/)
await shot('4-topics')
await tap(/Percent, Fractions|Percent & Discounts|Percentage, Rate/)
await shot('5-lesson')
await tap(/Pumasok sa 2D Klase/)
await shot('6-classroom')
await tap(/Pagsasanay/)
await shot('7-practice')
await tap(/Itaas ang kamay/)
await shot('8-ask')

console.log('---LOG---\n' + (log.join('\n') || 'no errors'))
await browser.close()
