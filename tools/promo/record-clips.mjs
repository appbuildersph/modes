import { chromium } from 'file:///C:/dev/appbuildersph/modes/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

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
  const d = await p.evaluate(() => [...document.querySelectorAll('button,a,input,textarea,label,[role=radio],[role=button],h1,h2,h3')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).slice(0, 60)
    .map(e => `${e.tagName}${e.type ? '[' + e.type + ']' : ''} "${(e.innerText || e.value || e.placeholder || e.getAttribute('aria-label') || '').trim().slice(0, 50).replace(/\n/g, ' | ')}"`));
  log(`--- DOM ${label}\n` + d.join('\n'));
}
async function shot(c, label) { await c.page.screenshot({ path: path.join(OUT, `${c.name}.png`) }); log(`[${c.name}] screenshot ${label}`); }

async function openApp(c) {
  await c.page.goto(APP, { waitUntil: 'networkidle' });
  await sleep(1000); // fonts
}
async function splashStart(c) {
  await tapFirst([c.page.getByRole('button', { name: /^START/i })]);
  await sleep(600);
}
const UI_MODE = { Standard: 'Standard', Kalma: 'Calm', Pakinig: 'Listen', Hakbang: 'Step by Step' };
const modeLoc = (p, m) => p.getByRole('radio', { name: new RegExp('^' + (UI_MODE[m] || m), 'i') });
async function clickMode(c, m) {
  const ok = await tapFirst([modeLoc(c.page, m)]);
  if (!ok) { skip(c, `mode card ${m} not found`); await dump(c.page, `mode card ${m} missing`); }
  return ok;
}
// Generic onboarding: grade -> name -> mode -> language -> rest (Next until home)
async function onboard(c, { grade = 'Grade 4', name = 'Ana', mode = null, lang = 'English', holdAtMode = null } = {}) {
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
      if (holdAtMode) await holdAtMode();
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
  log(`[${c.name}] onboarding done: grade=${gradeDone} name=${nameDone} mode=${modeDone} lang=${langDone} home=${await homeVisible(c)}`);
  if (!(await homeVisible(c))) await dump(p, 'onboarding stuck');
}
async function homeVisible(c) {
  return await vis(c.page.getByRole('button', { name: /practice|quick challenge|lesson/i })) || await vis(c.page.getByRole('link', { name: /practice|lesson|profile/i }));
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
async function goPractice(c) {
  // Home has a recommended-lesson "Start" button; fall back to Practice tab then the first lesson.
  let ok = await tapFirst([c.page.getByRole('button', { name: 'Start', exact: true })]);
  if (!ok) {
    await tapFirst([c.page.getByRole('button', { name: 'Practice', exact: true })]); await sleep(700);
    ok = await tapFirst([c.page.getByRole('button', { name: /^Angle Types/ })]);
    await sleep(700);
    if (await vis(c.page.getByRole('button', { name: 'Enter 2D Class' }))) await tapFirst([c.page.getByRole('button', { name: 'Enter 2D Class' })]);
    await sleep(700);
    await dump(c.page, 'after lesson enter');
  }
  if (!ok) { skip(c, 'practice entry not found'); await dump(c.page, 'home'); }
  await sleep(900);
  // Lesson overview "Enter 2D Class" opens the first question
  const entered = await c.page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Enter 2D Class'); if (b) { b.click(); return true; } return false; }).catch(() => false);
  if (entered) { mark(c, 'Enter 2D Class tapped'); await sleep(1000); await dump(c.page, 'question page'); }
  return ok;
}
async function answerOnce(c, value) {
  const box = c.page.getByRole('textbox').first();
  if (await vis(box)) { await box.fill(value); await sleep(600); return true; }
  return false;
}
async function submitAnswer(c) {
  return await tapFirst([c.page.getByRole('button', { name: /^(check|submit|answer|done|next question)$/i }), c.page.getByRole('button', { name: /check|submit/i })]);
}
async function setProfileMode(c, mode) {
  const ok = await tapFirst([c.page.getByRole('button', { name: /profile/i }), c.page.getByRole('link', { name: /profile/i })]);
  if (!ok) { skip(c, 'profile nav not found'); return false; }
  await sleep(700);
  await tapFirst([c.page.getByRole('button', { name: /Learning mode/i })]); await sleep(900);
  await clickMode(c, mode);
  await sleep(500);
  await tapFirst([c.page.getByRole('button', { name: /save|apply|switch|change|done|close/i })]);
  await sleep(500);
  return true;
}

const which = process.argv[2] ? process.argv[2].split(',') : ['01', '02', '03', '04', '05', '06', '07', '08'];

// 01 splash
if (which.includes('01')) {
  const c = await newClip('01-splash-start'); await openApp(c); mark(c, 'splash visible');
  await sleep(1000); await shot(c, 'splash');
  await sleep(1500); mark(c, 'splash hold end');
  await splashStart(c); mark(c, 'START tapped'); await sleep(1000);
  await sleep(1000); await finish(c);
}
// 02 onboarding grade + name
if (which.includes('02')) {
  const c = await newClip('02-onboarding-grade-name'); await openApp(c);
  await splashStart(c); await sleep(600);
  mark(c, 'grade step'); await c.page.getByRole('button', { name: 'Grade 4', exact: true }).click(); await sleep(600); mark(c, 'Grade 4 selected');
  await tapFirst([c.page.getByRole('button', { name: /^Next/i })]); await sleep(800); mark(c, 'Next (grade)');
  await c.page.getByRole('textbox').first().fill('Ana'); await sleep(600); mark(c, 'name typed'); await shot(c, 'name');
  await tapFirst([c.page.getByRole('button', { name: /^Next/i })]); await sleep(900); mark(c, 'Next (name)');
  await sleep(1000); await finish(c);
}
// 03 mode morph hero
if (which.includes('03')) {
  const c = await newClip('03-mode-morph'); await openApp(c);
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
    await clickMode(c, m); mark(c, `${m} selected`); await sleep(2500);
  }
  await clickMode(c, 'Kalma'); mark(c, 'Kalma again'); await sleep(2000);
  await shot(c, 'kalma again');
  await sleep(1000); await finish(c);
}
// 04 kalma practice
if (which.includes('04')) {
  const c = await newClip('04-kalma-practice'); await openApp(c);
  await splashStart(c);
  await onboard(c, { mode: 'Kalma', lang: 'English' });
  mark(c, 'home reached'); await sleep(1000);
  if (await goPractice(c)) {
    mark(c, 'practice open'); await sleep(1000); await dump(c.page, 'practice'); await shot(c, 'practice question');
    if (await answerOnce(c, '27')) mark(c, 'answer typed'); else skip(c, 'answer input not found');
    if (await submitAnswer(c)) mark(c, 'submitted'); else skip(c, 'submit not found');
    await sleep(2500); mark(c, 'feedback hold'); await shot(c, 'feedback');
    const ask = c.page.getByRole('textbox', { name: /ask|teacher|gabo/i }).or(c.page.getByPlaceholder(/ask/i));
    if (await vis(ask)) {
      await ask.first().fill('How do I add 12 and 15?'); await sleep(500);
      await tapFirst([c.page.getByRole('button', { name: /send|ask|submit/i })]);
      mark(c, 'tutor question sent');
      const start = Date.now(); let found = null;
      while (Date.now() - start < 25000 && !found) {
        await sleep(1000);
        const t = await c.page.evaluate(() => document.body.innerText);
        const m = t.match(/AI server|bundled|on-device|offline|cloud|Gemma|Nano/i);
        if (m && /add|12|15|27/i.test(t)) found = m[0];
      }
      mark(c, 'tutor reply window end'); c.tutor = found ? `label "${found}" seen` : 'no label matched within 25 s';
      await shot(c, 'tutor'); await sleep(3000);
    } else skip(c, 'tutor ask box not found');
  }
  await sleep(800); await finish(c);
}
// 05 pakinig practice
if (which.includes('05')) {
  const c = await newClip('05-pakinig-practice'); await openApp(c);
  await splashStart(c); await onboard(c, { mode: 'Pakinig', lang: 'English' });
  mark(c, 'home reached');
  if (await goPractice(c)) {
    await sleep(600);
    if (await tapFirst([c.page.getByRole('button', { name: /read again/i })])) mark(c, 'Read again tapped'); else skip(c, 'Read again not found');
    await shot(c, 'pakinig');
    mark(c, 'word highlight hold');
    await sleep(6000);
    for (const sp of ['0.8x', '0.65x', '1x']) {
      if (!(await tapFirst([c.page.getByRole('button', { name: sp, exact: true }), c.page.getByText(sp, { exact: true })]))) skip(c, `speed chip ${sp} not found`); else mark(c, `${sp} chip`);
      await sleep(1200);
    }
    await sleep(1500);
  }
  await finish(c);
}
// 06 hakbang practice
if (which.includes('06')) {
  const c = await newClip('06-hakbang-practice'); await openApp(c);
  await splashStart(c); await onboard(c, { mode: 'Hakbang', lang: 'English' });
  mark(c, 'home reached');
  if (await goPractice(c)) {
    await sleep(800); await shot(c, 'hakbang first step');
    for (let i = 1; i <= 3; i++) {
      const hasStep = await vis(c.page.getByText(new RegExp('STEP ' + i + ' OF', 'i')));
      if (!hasStep) { skip(c, `step ${i} card not seen`); break; }
      mark(c, `STEP ${i} OF 3 shown`); await sleep(1500);
      await answerOnce(c, i === 1 ? '27' : '12'); await sleep(400);
      await submitAnswer(c); mark(c, `step ${i} answered`); await sleep(1500);
    }
    await shot(c, 'hakbang check');
    await sleep(2000);
  }
  await finish(c);
}
// 07 mode switch cover
if (which.includes('07')) {
  const c = await newClip('07-mode-switch-cover'); await openApp(c);
  await splashStart(c); await onboard(c, { mode: 'Kalma', lang: 'English' });
  mark(c, 'home reached'); await sleep(800);
  if (await setProfileMode(c, 'Pakinig')) { mark(c, 'Pakinig chosen in Profile'); await sleep(200); await shot(c, 'cover'); await sleep(2500); mark(c, 'cover hold'); }
  await finish(c);
}
// 08 home
if (which.includes('08')) {
  const c = await newClip('08-home'); await openApp(c);
  await splashStart(c); await onboard(c, { mode: 'Standard', lang: 'English' });
  mark(c, 'home reached'); await sleep(1000); await shot(c, 'home');
  mark(c, 'idle 4 s start'); await sleep(4000);
  mark(c, 'scroll down');
  await c.page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' })); await sleep(1500);
  await c.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(1500);
  await sleep(800); await finish(c);
}

await browser.close();
for (const c of Object.values(results)) {
  fs.writeFileSync(path.join(OUT, `${c.name}.marks.json`), JSON.stringify({ marks: c.marks, skipped: c.skipped, tutor: c.tutor }, null, 2));
}
log('DONE');
