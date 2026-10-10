import { chromium } from 'file:///C:/dev/appbuildersph/modes/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

// Helpers copied from record.mjs (that file runs its clips on import, so it cannot be imported).
const OUT = 'C:/Users/eirmo/AppData/Local/Temp/claude/C--dev-appbuildersph-modes/9924c2a2-845c-462a-8aee-b58bd2e6b04e/scratchpad/clips';
const APP = 'https://math-companion-edge.vercel.app';
const EXE = 'C:/Users/eirmo/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const results = {};

async function newClip(name) {
  const rawDir = path.join(OUT, '_raw', name);
  fs.mkdirSync(rawDir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    reducedMotion: 'no-preference', recordVideo: { dir: rawDir, size: { width: 780, height: 1688 } },
  });
  const page = await ctx.newPage();
  const c = { name, ctx, page, rawDir, t0: Date.now(), marks: [], skipped: [], tutor: null };
  results[name] = c;
  return c;
}
const mark = (c, label) => { const t = ((Date.now() - c.t0) / 1000).toFixed(1); c.marks.push(`${label} at ${t} s`); log(`[${c.name}] ${label} at ${t} s`); };
const skip = (c, why) => { c.skipped.push(why); log(`[${c.name}] SKIPPED: ${why}`); };
async function vis(loc) { try { return await loc.first().isVisible({ timeout: 400 }); } catch { return false; } }
async function tapFirst(locs) {
  for (const loc of locs) {
    try { const l = loc.first(); await l.waitFor({ state: 'visible', timeout: 3000 }); await l.click(); return true; } catch {}
  }
  return false;
}
async function dump(p, label) {
  const d = await p.evaluate(() => [...document.querySelectorAll('button,a,input,textarea,label,[role=radio],[role=button],[role=tab],h1,h2,h3')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).slice(0, 60)
    .map(e => `${e.tagName}${e.type ? '[' + e.type + ']' : ''} "${(e.innerText || e.value || e.placeholder || e.getAttribute('aria-label') || '').trim().slice(0, 50).replace(/\n/g, ' | ')}"`));
  log(`--- DOM ${label}\n` + d.join('\n'));
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 600).replace(/\n+/g, ' | '));
  log(`--- TEXT ${label}: ${txt}`);
}
async function shot(c, label) { await c.page.screenshot({ path: path.join(OUT, `${c.name}.png`) }); log(`[${c.name}] screenshot ${label}`); }
async function openApp(c) { await c.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(1000); }
async function splashStart(c) { await tapFirst([c.page.getByRole('button', { name: /^START/i })]); await sleep(600); }
const UI_MODE = { Standard: 'Standard', Kalma: 'Calm', Pakinig: 'Listen', Hakbang: 'Step by Step' };
const modeLoc = (p, m) => p.getByRole('radio', { name: new RegExp('^' + (UI_MODE[m] || m), 'i') });
async function clickMode(c, m) {
  const ok = await tapFirst([modeLoc(c.page, m)]);
  if (!ok) { skip(c, `mode card ${m} not found`); await dump(c.page, `mode card ${m} missing`); }
  return ok;
}
async function homeVisible(c) {
  return await vis(c.page.getByRole('button', { name: /practice|quick challenge|lesson/i })) || await vis(c.page.getByRole('link', { name: /practice|lesson|profile/i }));
}
async function onboard(c, { grade = 'Grade 4', name = 'Ana', mode = null, lang = 'English' } = {}) {
  const p = c.page;
  let gradeDone = false, nameDone = false, modeDone = false, langDone = false;
  const finishRe = /Let.s start|Finish|Get started|Start learning|Done|Continue/i;
  for (let i = 0; i < 14; i++) {
    await sleep(500);
    if (!gradeDone && await vis(p.getByRole('button', { name: grade, exact: true }))) {
      await tapFirst([p.getByRole('button', { name: grade, exact: true })]); gradeDone = true; await sleep(400);
    }
    if (!nameDone && await vis(p.getByRole('textbox'))) {
      await p.getByRole('textbox').first().fill(name); nameDone = true; await sleep(400);
    }
    if (!modeDone && mode && (await vis(modeLoc(p, 'Standard')) || await vis(p.getByText('Standard', { exact: true })))) {
      await clickMode(c, mode); modeDone = true; await sleep(600);
    }
    if (!langDone && await vis(p.getByRole('button', { name: new RegExp('^' + lang + '$', 'i') }))) {
      await tapFirst([p.getByRole('button', { name: new RegExp('^' + lang + '$', 'i') })]); langDone = true; await sleep(400);
    }
    if (await homeVisible(c)) break;
    if (await vis(p.getByRole('button', { name: /^Next/i }))) { await tapFirst([p.getByRole('button', { name: /^Next/i })]); await sleep(700); continue; }
    if (await vis(p.getByRole('button', { name: finishRe }))) { await tapFirst([p.getByRole('button', { name: finishRe })]); await sleep(700); continue; }
  }
  if (mode && !modeDone) skip(c, `onboarding mode ${mode} not picked`);
  log(`[${c.name}] onboarding done: mode=${modeDone} home=${await homeVisible(c)}`);
  if (!(await homeVisible(c))) await dump(p, 'onboarding stuck');
}
async function finish(c) {
  const v = c.page.video();
  await c.ctx.close();
  const src = await v.path();
  const dst = path.join(OUT, `${c.name}.webm`);
  fs.renameSync(src, dst);
  fs.rmSync(c.rawDir, { recursive: true, force: true });
  log(`[${c.name}] saved ${dst}`);
}
function writeMarks() {
  for (const c of Object.values(results)) {
    fs.writeFileSync(path.join(OUT, `${c.name}.marks.json`), JSON.stringify({ marks: c.marks, skipped: c.skipped, tutor: c.tutor }, null, 2));
  }
}

// Clip 09: same as clip 03 with long holds per mode.
async function clip09() {
  const c = await newClip('09-mode-morph-long'); await openApp(c);
  await splashStart(c);
  await tapFirst([c.page.getByRole('button', { name: 'Grade 4', exact: true })]); await sleep(500);
  await tapFirst([c.page.getByRole('button', { name: /^Next/i })]); await sleep(700);
  await c.page.getByRole('textbox').first().fill('Ana'); await sleep(500);
  await tapFirst([c.page.getByRole('button', { name: /^Next/i })]); await sleep(900);
  await sleep(1000); mark(c, 'mode step (still 1 s)');
  const prev = c.page.getByText('What is 12 + 15?').first();
  try { await prev.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch { skip(c, 'preview card text not found'); await dump(c.page, 'mode step'); }
  await sleep(600); await shot(c, 'mode step');
  for (const m of ['Standard', 'Kalma', 'Pakinig', 'Hakbang']) {
    await clickMode(c, m); mark(c, `${m} selected`); await sleep(6000);
  }
  await clickMode(c, 'Kalma'); mark(c, 'Kalma again'); await sleep(3000);
  await shot(c, 'kalma again');
  await finish(c);
}

// Clips 10-12: onboard with a mode, open a lesson's Practice, answer one question.
async function enterPractice(c) {
  const p = c.page;
  // Path A: Quick Challenge card on home.
  if (await tapFirst([p.getByRole('button', { name: /quick challenge/i }), p.getByRole('link', { name: /quick challenge/i })])) { mark(c, 'Quick Challenge tapped'); return true; }
  // Path B: Lessons / Topics list, then a known lesson, then its Practice tab.
  await tapFirst([p.getByRole('button', { name: /^(lessons?|topics?)$/i }), p.getByRole('link', { name: /^(lessons?|topics?)$/i })]);
  await sleep(800);
  if (!(await tapFirst([p.getByRole('button', { name: /^Angle Types/ }), p.getByRole('link', { name: /^Angle Types/ })]))) {
    await dump(p, 'lesson list not found'); return false;
  }
  mark(c, 'lesson opened'); await sleep(800);
  // Bottom-nav "Practice" is the review hub (no question), so only use the lesson's own tab.
  await tapFirst([p.getByRole('tab', { name: /practice/i })]);
  await sleep(600);
  const entered = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /enter 2d class/i.test(x.innerText.trim())); if (b) { b.click(); return true; } return false; }).catch(() => false);
  if (!entered) await tapFirst([p.getByRole('button', { name: /enter 2d class/i })]);
  await sleep(800);
  await dump(p, 'after enter');
  return true;
}
async function waitQuestion(c, ms = 10000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await tapChoiceVisible(c)) return true;
    await sleep(400);
  }
  return false;
}
const CHOICE_RE = /^\s*(?:[A-Da-d][.)]\s*)?-?\d[\d.,/ ]*\s*$|^\s*[A-Da-d][.)]\s/;
async function tapChoiceVisible(c) {
  return await vis(c.page.getByRole('radio')) || await vis(c.page.locator('button').filter({ hasText: CHOICE_RE }));
}
async function tapChoice(c) {
  const r = c.page.getByRole('radio').first();
  if (await vis(r)) { await r.click(); return true; }
  const b = c.page.locator('button').filter({ hasText: CHOICE_RE }).first();
  if (await vis(b)) { await b.click(); return true; }
  return false;
}
async function practiceClip(name, mode) {
  const c = await newClip(name); await openApp(c);
  await splashStart(c); await onboard(c, { mode, lang: 'English' });
  mark(c, 'home reached'); await sleep(800);
  if (!(await enterPractice(c))) { skip(c, 'practice entry not found'); await finish(c); return; }
  await sleep(600);
  if (await waitQuestion(c)) mark(c, 'question screen visible');
  else { skip(c, 'question screen (choice) not detected within 10 s'); await dump(c.page, 'question?'); }
  if (await vis(c.page.getByText(/STEP 1 OF/i))) mark(c, 'STEP 1 OF shown');
  await sleep(4000);
  if (mode === 'Pakinig') {
    if (await tapFirst([c.page.getByRole('button', { name: /read again/i })])) mark(c, 'Read again tapped'); else skip(c, 'Read again not found');
    await sleep(5000);
  }
  await shot(c, `${mode} question`);
  if (await tapChoice(c)) mark(c, 'choice tapped'); else skip(c, 'choice not found');
  await sleep(500);
  if (await tapFirst([c.page.getByRole('button', { name: /^answer$/i })])) mark(c, 'Answer tapped');
  else skip(c, 'Answer button not found');
  await sleep(3000); mark(c, 'feedback hold'); await shot(c, `${mode} feedback`);
  await finish(c);
}

const which = process.argv[2] ? process.argv[2].split(',') : ['09', '10', '11', '12'];
if (which.includes('09')) await clip09();
if (which.includes('10')) await practiceClip('10-practice-kalma', 'Kalma');
if (which.includes('11')) await practiceClip('11-practice-pakinig', 'Pakinig');
if (which.includes('12')) await practiceClip('12-practice-hakbang', 'Hakbang');

await browser.close();
writeMarks();
log('DONE');
