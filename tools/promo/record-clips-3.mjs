// Practice-screen clips 13-15. Helpers copied from record2.mjs. Usage: node record3.mjs Kalma|Pakinig|Hakbang
import { chromium } from 'file:///C:/dev/appbuildersph/modes/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/eirmo/AppData/Local/Temp/claude/C--dev-appbuildersph-modes/9924c2a2-845c-462a-8aee-b58bd2e6b04e/scratchpad/clips';
const APP = 'https://math-companion-edge.vercel.app';
const EXE = 'C:/Users/eirmo/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
fs.mkdirSync(OUT, { recursive: true });

const mode = process.argv[2];
const NAMES = { Kalma: '13-practice-kalma', Pakinig: '14-practice-pakinig', Hakbang: '15-practice-hakbang' };
const name = NAMES[mode];
if (!name) throw new Error('mode must be Kalma, Pakinig or Hakbang');
const browser = await chromium.launch({ headless: true, executablePath: EXE });

const UI_MODE = { Standard: 'Standard', Kalma: 'Calm', Pakinig: 'Listen', Hakbang: 'Step by Step' };
const modeLoc = (p, m) => p.getByRole('radio', { name: new RegExp('^' + (UI_MODE[m] || m), 'i') });

async function newClip(n) {
  const rawDir = path.join(OUT, '_raw', n);
  fs.mkdirSync(rawDir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    reducedMotion: 'no-preference', recordVideo: { dir: rawDir, size: { width: 780, height: 1688 } },
  });
  const page = await ctx.newPage();
  return { name: n, ctx, page, rawDir, t0: Date.now(), marks: [], skipped: [], tutor: null };
}
const mark = (c, label) => { const t = ((Date.now() - c.t0) / 1000).toFixed(1); c.marks.push(`${label} at ${t} s`); log(`[${c.name}] ${label} at ${t} s`); };
const skip = (c, why) => { c.skipped.push(why); log(`[${c.name}] SKIPPED: ${why}`); };
async function vis(loc) { try { return await loc.first().isVisible({ timeout: 400 }); } catch { return false; } }
async function tapFirst(locs, timeout = 3000) {
  for (const loc of locs) {
    try { const l = loc.first(); await l.waitFor({ state: 'visible', timeout }); await l.click({ timeout }); return true; } catch {}
  }
  return false;
}
async function dump(p, label) {
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 700).replace(/\n+/g, ' | '));
  const btns = await p.evaluate(() => [...document.querySelectorAll('button,a,[role=tab],[role=radio],textarea,input')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).slice(0, 50)
    .map(e => `${e.tagName} "${(e.innerText || e.value || e.placeholder || e.getAttribute('aria-label') || '').trim().slice(0, 40).replace(/\n/g, ' | ')}"`));
  log(`--- DOM ${label}\n` + btns.join('\n') + `\n--- TEXT ${label}: ${txt}`);
}
async function shot(c, label) { await c.page.screenshot({ path: path.join(OUT, `${c.name}.png`) }); log(`[${c.name}] screenshot ${label}`); }
async function finish(c) {
  const v = c.page.video();
  await c.ctx.close();
  const src = await v.path();
  const dst = path.join(OUT, `${c.name}.webm`);
  fs.renameSync(src, dst);
  fs.rmSync(c.rawDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(OUT, `${c.name}.marks.json`), JSON.stringify({ marks: c.marks, skipped: c.skipped, tutor: c.tutor }, null, 2));
  log(`[${c.name}] saved ${dst}`);
}

async function onboard(c, { grade = 'Grade 4', name: who = 'Ana', lang = 'English' } = {}) {
  const p = c.page;
  let gradeDone = false, nameDone = false, modeDone = false, langDone = false;
  const finishRe = /Let.s start|Finish|Get started|Start learning|Done|Continue/i;
  for (let i = 0; i < 14; i++) {
    await sleep(500);
    if (!gradeDone && await vis(p.getByRole('button', { name: grade, exact: true }))) {
      await tapFirst([p.getByRole('button', { name: grade, exact: true })]); gradeDone = true; await sleep(400);
    }
    if (!nameDone && await vis(p.getByRole('textbox'))) {
      await p.getByRole('textbox').first().fill(who); nameDone = true; await sleep(400);
    }
    if (!modeDone && (await vis(modeLoc(p, 'Standard')) || await vis(p.getByText('Standard', { exact: true })))) {
      await tapFirst([modeLoc(p, mode)]); modeDone = true; await sleep(600);
    }
    if (!langDone && await vis(p.getByRole('button', { name: new RegExp('^' + lang + '$', 'i') }))) {
      await tapFirst([p.getByRole('button', { name: new RegExp('^' + lang + '$', 'i') })]); langDone = true; await sleep(400);
    }
    if (await homeVisible(c)) break;
    if (await vis(p.getByRole('button', { name: /^Next/i }))) { await tapFirst([p.getByRole('button', { name: /^Next/i })]); await sleep(700); continue; }
    if (await vis(p.getByRole('button', { name: finishRe }))) { await tapFirst([p.getByRole('button', { name: finishRe })]); await sleep(700); continue; }
  }
  if (!modeDone) skip(c, `onboarding mode ${mode} not picked`);
  log(`[${c.name}] onboarding done: mode=${modeDone} home=${await homeVisible(c)}`);
  if (!(await homeVisible(c))) await dump(c.page, 'onboarding stuck');
}
async function homeVisible(c) {
  return await vis(c.page.getByRole('button', { name: /practice|quick challenge|lesson/i })) || await vis(c.page.getByRole('link', { name: /practice|lesson|profile/i }));
}

// Lesson overview: Next (enables "Enter 2D Class"), then the classroom.
async function openClassroom(c) {
  const p = c.page;
  if (!(await tapFirst([p.getByRole('button', { name: /^(lessons?|topics?)$/i }), p.getByRole('link', { name: /^(lessons?|topics?)$/i })]))) skip(c, 'Lessons nav not tapped (may already be on list)');
  await sleep(800);
  if (!(await tapFirst([p.getByRole('button', { name: /^Angle Types/ }), p.getByRole('link', { name: /^Angle Types/ })]))) { await dump(p, 'lesson list'); return false; }
  mark(c, 'lesson opened'); await sleep(1000);
  // Real labels: step 0 nav button is "Next" (-> step 1, which is labelled "Done"); "Done" unlocks Enter.
  if (!(await tapFirst([p.getByRole('button', { name: /^Next/i })]))) skip(c, 'overview Next not found');
  await sleep(1000);
  if (!(await tapFirst([p.getByRole('button', { name: /^Done/i })]))) skip(c, 'overview Done not found');
  await sleep(1000);
  if (!(await tapFirst([p.getByRole('button', { name: /enter 2d class/i })], 12000))) { await dump(p, 'enter 2d class'); return false; }
  mark(c, 'entered classroom'); await sleep(1200);
  return true;
}
async function openPractice(c) {
  const p = c.page;
  // Tabs are locked by step (Classroom.jsx unlockedStep): the classroom "Next →" button advances it.
  if (await tapFirst([p.getByRole('button', { name: /^next/i })])) { mark(c, 'classroom Next tapped'); await sleep(800); }
  if (await tapFirst([p.getByRole('tab', { name: /^example/i })])) { mark(c, 'example tab clicked'); await sleep(800); }
  else skip(c, 'Example tab not found');
  // After Example the forward button reads "Ready to Practice →" (it unlocks the Practice tab).
  if (await tapFirst([p.getByRole('button', { name: /^(next|ready to practice)/i })])) { mark(c, 'Ready to Practice tapped'); await sleep(800); }
  if (!(await tapFirst([p.getByRole('tab', { name: /practice/i }), p.getByRole('button', { name: /^practice$/i })]))) { skip(c, 'Practice tab not found'); await dump(p, 'tabs'); return false; }
  mark(c, 'practice tab clicked'); await sleep(800);
  if (await tapFirst([p.getByRole('button', { name: /start the practice|ready to practice/i })])) { mark(c, 'start-practice tapped'); await sleep(800); }
  return true;
}
const CHOICE_RE = /^\s*(?:[A-Da-d][.)]\s*)?-?\d[\d.,/ ]*\s*$|^\s*[A-Da-d][.)]\s/;
async function waitQuestion(c, ms = 10000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await vis(c.page.getByRole('radio')) || await vis(c.page.locator('button').filter({ hasText: CHOICE_RE }))) return true;
    await sleep(400);
  }
  return false;
}
async function tapChoice(c) {
  const r = c.page.getByRole('radio').first();
  if (await vis(r)) { await r.click(); return true; }
  const b = c.page.locator('button').filter({ hasText: CHOICE_RE }).first();
  if (await vis(b)) { await b.click(); return true; }
  return false;
}
async function askTutor(c) {
  const p = c.page;
  const opener = p.getByRole('button', { name: /ask teacher|gabo|tutor/i });
  if (await vis(opener)) { await tapFirst([opener]); await sleep(800); mark(c, 'tutor opened'); }
  const box = p.getByRole('textbox').last();
  if (!(await vis(box))) { skip(c, 'tutor input not found'); await dump(p, 'tutor'); return; }
  const before = await p.evaluate(() => document.body.innerText);
  await box.fill('How do I add 12 and 15?'); await sleep(400);
  const send = p.getByRole('button', { name: /send/i });
  if (await vis(send)) await tapFirst([send]); else await p.keyboard.press('Enter');
  mark(c, 'tutor question sent');
  const start = Date.now(); let now = before;
  while (Date.now() - start < 25000) {
    now = await p.evaluate(() => document.body.innerText);
    if (now.length > before.length + 40) break;
    await sleep(500);
  }
  if (now.length <= before.length + 40) { skip(c, 'no tutor reply within 25 s'); return; }
  await sleep(800);
  now = await p.evaluate(() => document.body.innerText);
  const added = now.slice(Math.max(0, now.indexOf('How do I add'))).slice(0, 300).replace(/\n+/g, ' | ');
  const label = /AI server/i.test(now) && !/AI server/i.test(before) ? 'AI server'
    : /bundled/i.test(now) && !/bundled/i.test(before) ? 'bundled' : 'other';
  c.tutor = { label, snippet: added };
  mark(c, `tutor reply visible (label: ${label})`);
  log(`[${c.name}] tutor text: ${added}`);
  await sleep(3000);
}

async function run() {
  const c = await newClip(name);
  await c.page.goto(APP, { waitUntil: 'networkidle' }); await sleep(1000);
  await tapFirst([c.page.getByRole('button', { name: /^START/i })]); await sleep(600);
  await onboard(c, { lang: 'English' });
  mark(c, 'home reached'); await sleep(800);
  if (!(await openClassroom(c))) { skip(c, 'classroom not reached'); await finish(c); return false; }
  if (!(await openPractice(c))) { await finish(c); return false; }
  await sleep(600);
  let questionOk = false;
  if (await waitQuestion(c)) { mark(c, 'question visible'); questionOk = true; }
  else { skip(c, 'question not detected within 10 s'); await dump(c.page, 'question?'); }
  if (await vis(c.page.getByText(/STEP 1 OF/i))) mark(c, 'STEP 1 OF shown');
  await sleep(4000);
  if (mode === 'Pakinig') {
    if (await tapFirst([c.page.getByRole('button', { name: /read again/i })])) mark(c, 'Read again tapped'); else skip(c, 'Read again not found');
    await sleep(5000);
  }
  await shot(c, `${mode} question`);
  let answered = false;
  if (questionOk && await tapChoice(c)) {
    mark(c, 'choice tapped'); await sleep(500);
    if (await tapFirst([c.page.getByRole('button', { name: /^answer$/i })])) { mark(c, 'answer tapped'); answered = true; }
    else skip(c, 'Answer button not found');
    await sleep(3000); mark(c, 'feedback hold'); await shot(c, `${mode} feedback`);
  } else if (questionOk) skip(c, 'choice not found');
  await askTutor(c);
  await finish(c);
  return questionOk && answered;
}

let ok = false;
for (let a = 1; a <= 2 && !ok; a++) { log(`=== ${name} attempt ${a}`); ok = await run(); }
log(`RESULT ${name}: ${ok ? 'complete' : 'incomplete'}`);
await browser.close();
log('DONE');
