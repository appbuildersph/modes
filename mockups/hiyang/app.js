"use strict";

/* Hiyang mockup: practice screen with three learning modes.
   Static sample data and no backend. Voice answers are simulated; read-aloud uses the browser's own voices. */

const NOVA = "assets/nova.png";
const INK = "var(--gb-outline)";
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Line icons in app style (src/ui/Icons.jsx, BottomNav.jsx, SoundToggle.jsx), plus three mode icons. */
const ICON = {
  ear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 9.2a3.4 3.4 0 0 1 6.8 0c0 2.1-2 2.9-2.6 4.3-.4 1-.2 2.2-1.5 2.6a1.7 1.7 0 0 1-2.2-1.6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.8" cy="9.2" r="0.7" fill="${INK}"/><path d="M16.6 7.1a4 4 0 0 1 0 5.6M18.4 5.4a6.6 6.6 0 0 1 0 9M20.1 3.8a9 9 0 0 1 0 12.2" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M10 8.5v7M14 8.5v7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M10 8.4 16 12l-6 3.6Z" fill="${INK}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="${INK}" stroke-width="2.2"/><circle cx="11" cy="9" r="1.9" fill="none" stroke="${INK}" stroke-width="1.8"/><path d="M7.7 17.2c0-2.4 1.5-3.9 3.3-3.9 1.4 0 2.5.8 3 2.1M13.2 13.6l2.2-5" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.7" cy="7.7" r="1.1" fill="${INK}"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-3.1 3.7M6.6 6.6C4.2 8.2 3 12 3 12s4 6 9 6a9 9 0 0 0 4.3-1.1" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  kalma: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="3" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M3 14.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity="0.45"/></svg>`,
  steps: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h5v-5h5v-5h5V5h3" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3Z" fill="var(--gb-primary)" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3l4-3v12l-4-3H4Z" fill="${INK}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 9a4 4 0 0 1 0 6M17.5 7a7 7 0 0 1 0 10" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H5Z" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M19 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6Z" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19l1-4L16 5l3 3L9 18Z" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="${INK}" stroke-width="2.2"/></svg>`,
  game: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="10" rx="5" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M7 11v4M5 13h4" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="12.5" r="1.2" fill="${INK}"/><circle cx="18.5" cy="14.5" r="1.2" fill="${INK}"/></svg>`,
  person: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

const MODES = {
  kalma: {
    name: "Kalma", gloss: "Calm / Focus", forWho: "ADHD, autism, sensory sensitivity", tile: "bg-mint", icon: "kalma",
    ui: ["Plain background, no music, coins, doodles or 3D", "One question per screen", "Same layout every time"],
    ai: ["Replies capped at 2 short sentences", "One idea per reply", "Calm, neutral tone", "Fewer questions per session (around 5)"],
    tryIt: "Type 3/4 and tap Answer. No celebration flash, no shaking, and every button stays in the same place.",
  },
  pakinig: {
    name: "Pakinig", gloss: "Listen", forWho: "Dyslexia, low vision, weak readers", tile: "bg-yellow", icon: "ear",
    ui: ["Large readable font, high contrast, wide spacing", "Auto read-aloud with word highlighting", "Voice answers"],
    ai: ["Replies written for speech: no symbols or markdown", "“3/4” becomes “three fourths”", "Slower text-to-speech", "Avoids items that only work visually"],
    tryIt: "The question reads itself aloud as each word lights up. Tap the mic to answer by voice (simulated), or tap Nova, then Ask Teacher.",
  },
  hakbang: {
    name: "Hakbang", gloss: "Step", forWho: "Dyscalculia, intellectual disability", tile: "bg-peach", icon: "steps",
    ui: ["Bigger step-by-step card (StepScaffold)", "Concrete visuals first: blocks and a number line", "Unlocks Grade 1 to 3 content"],
    ai: ["One step per reply, then a check question", "Simple words", "Concrete Filipino examples", "Questions from the madali tier and lower grades"],
    tryIt: "Answer each step: 8, then 2, then 6. The blocks and number line change as you go. Tap Nova for a one-step hint.",
  },
  default: {
    name: "No mode", gloss: "Default", forWho: "", tile: "bg-white", icon: "spark",
    ui: ["Drifting doodles, sparkles and background music", "Coins in games and a 3D classroom", "Quick Challenge label and a full-screen Correct! flash"],
    ai: ["Long, cheerful replies with every step", "Symbols like 8 − 2 = 6 and 6/8 in replies", "Questions at the learner's own grade"],
    tryIt: "This is the default mode without modifications. Tap Nova, then Ask Teacher, and compare the reply with each mode.",
  },
};

const FRACTION_Q = "Ana has 8 slices of bibingka. She ate 2 slices. What fraction of the bibingka is left?";
const HAKBANG_Q = "Ana has 8 slices of bibingka. She ate 2. How many slices are left?";
const LESSON = {
  fraction: { title: "Fractions", support: "Name a part of a whole as a fraction." },
  hakbang: { title: "Taking away", support: "Take away, then count what is left." },
};

const GUIDE = {
  default: "For Question 1, read what is being asked and compare each choice carefully before deciding.",
  kalma: "Read the question once. Take your time.",
  pakinig: "I will read each question with you. Tap Listen again any time.",
  hakbang: "We will do this one small step at a time.",
};

const REPLY = {
  default: "Great question! Let's solve it step by step. Step 1: Count all the slices. Ana has 8. Step 2: She ate 2, so 8 − 2 = 6 slices are left. Step 3: Put what is left over the total, so 6/8. Step 4: Simplify it: 6/8 = 3/4. You're doing amazing! Want to try a harder one next? \u{1F31F}",
  kalma: "Start with 8 slices and take away the 2 Ana ate. Write what is left out of 8.",
  pakinig: "Ana started with eight slices and ate two. Count the slices that are left. Then say your answer as a fraction, like five eighths.",
};

const STEPS = [
  { prompt: "Count all the slices. How many are there?", answer: 8, reply: "Let's count the slices first. How many slices are there in all?" },
  { prompt: "How many slices did Ana eat?", answer: 2, reply: "Look at the story again. How many slices did Ana eat?" },
  { prompt: "How many slices are left?", answer: 6, reply: "Count the slices that are still there. How many are left?" },
];
const HAKBANG_DONE_REPLY = "You did every step. Are you ready for the next one?";

const FEEDBACK = {
  default: { ok: ["Great job!", ""], bad: ["Not quite. Give it another shot!", "Ana ate 2 of the 8 slices, so 6/8 = 3/4 of the bibingka is left."] },
  kalma: { ok: ["Correct. 6 out of 8 slices, or 3/4, are left.", ""], bad: ["Not yet. Try once more.", ""] },
  pakinig: { ok: ["Correct. Three fourths of the bibingka is left.", ""], bad: ["Not yet. Listen to the question again, then try.", ""] },
};

/* ---------- answer checks ---------- */
function isThreeFourths(value) {
  const s = String(value).toLowerCase().replace(/[-\s]+/g, " ").trim();
  if (["three fourths", "three fourth", "three quarters", "six eighths", "six eights", "0.75", ".75", "75%"].includes(s)) return true;
  const m = s.replace(/\s/g, "").match(/^(\d+)\/(\d+)$/);
  return Boolean(m) && Number(m[2]) > 0 && Number(m[1]) * 4 === Number(m[2]) * 3;
}
const toNumber = (v) => (/^\d+$/.test(String(v).trim()) ? Number(String(v).trim()) : NaN);

/* Wrap each word in a span that remembers its character offset, for read-aloud highlighting. */
function wordsHTML(text) {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(/\S+/g)) {
    html += esc(text.slice(last, m.index)) + `<span class="w" data-c="${m.index}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return html + esc(text.slice(last));
}

/* ---------- read-aloud ---------- */
const tts = {
  ok: "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function",
  timer: null,
  current: null,
  paused: false,
  voice() {
    const english = (this.ok ? speechSynthesis.getVoices() : []).filter((v) => /^en/i.test(v.lang));
    return english.find((v) => /en[-_]PH/i.test(v.lang)) || english.find((v) => v.localService) || english[0] || null;
  },
  clear() {
    document.querySelectorAll(".w.on").forEach((w) => w.classList.remove("on"));
  },
  stop() {
    clearTimeout(this.timer);
    this.timer = null;
    this.current = null;
    this.paused = false;
    if (this.ok) speechSynthesis.cancel();
    this.clear();
  },
  speak(el) {
    if (!el) return;
    this.stop();
    const text = el.dataset.say || el.textContent;
    const words = [...el.querySelectorAll(".w")];
    const starts = words.map((w) => Number(w.dataset.c));
    const rate = state.mode === "pakinig" ? state.rate : 0.95; // Default speech reads at 0.95; Pakinig slows down
    let boundary = false;
    const mark = (i) => {
      this.clear();
      words[i]?.classList.add("on");
    };
    // Fallback highlighting for voices that send no word events.
    const walk = (i) => {
      if (boundary) return;
      if (i >= words.length) return this.clear();
      mark(i);
      this.timer = setTimeout(() => walk(i + 1), (280 + words[i].textContent.length * 60) / rate);
    };
    if (!this.ok) {
      if (words.length) walk(0);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = "en-US";
    const v = this.voice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.onboundary = (e) => {
      if (!words.length || (e.name && e.name !== "word")) return;
      boundary = true;
      clearTimeout(this.timer);
      let k = 0;
      for (let j = 0; j < starts.length; j++) if (starts[j] <= e.charIndex) k = j;
      mark(k);
    };
    u.onstart = () => {
      if (words.length) this.timer = setTimeout(() => !boundary && walk(0), 450);
    };
    u.onend = () => {
      if (this.current !== u) return;
      clearTimeout(this.timer);
      this.clear();
      this.current = null;
    };
    this.current = u;
    setTimeout(() => this.current === u && speechSynthesis.speak(u), 60);
  },
  togglePause() {
    if (!this.ok || !this.current) return false;
    if (this.paused) speechSynthesis.resume();
    else speechSynthesis.pause();
    this.paused = !this.paused;
    return true;
  },
};
if (tts.ok) speechSynthesis.getVoices(); // starts loading the voice list early

/* ---------- state and routing ---------- */
const state = {
  screen: "setup",
  mode: "kalma",
  rate: 0.8,
  token: 0,
};

function resetLesson() {
  state.token += 1;
  Object.assign(state, {
    input: "", result: null, teacher: false, askOpen: false, reply: false,
    step: 0, stepInput: "", stepWrong: false, listening: false, heard: "",
  });
}

function readHash() {
  const h = location.hash.slice(1);
  if (MODES[h]) {
    state.mode = h;
    state.screen = "class";
  } else {
    state.screen = "setup";
  }
}

function go(hash) {
  if (location.hash.slice(1) === hash) route();
  else location.hash = hash;
}

function route() {
  tts.stop();
  readHash();
  resetLesson();
  render({ autoRead: true });
}
window.addEventListener("hashchange", route);

/* ---------- views ---------- */
const screenHost = $("#screen");
const notes = $("#notes");

function setupView() {
  const cards = ["kalma", "pakinig", "hakbang", "default"].map((k) => {
    const m = MODES[k];
    const on = state.mode === k;
    const line = k === "default" ? "Default mode" : `For ${m.forWho}`;
    return `<button type="button" role="radio" aria-checked="${on}" class="gb-card mp-mode${on ? " is-on" : ""}${k === "default" ? " is-plain" : ""}" data-action="select" data-mode="${k}">
      <span class="mp-icon ${m.tile}">${ICON[m.icon]}</span>
      <span class="mp-text"><strong>${m.name}</strong><em>${m.gloss}</em><span>${line}</span></span>
      <span class="mp-radio" aria-hidden="true"></span>
    </button>`;
  }).join("");
  return `<div class="gb-shell modes-page">
    <header class="mp-head">
      <img src="${NOVA}" alt="" class="gb-float" width="72" height="72">
      <div><p class="mp-kicker">Profile</p><h1 class="mp-title">Learning mode</h1></div>
    </header>
    <div class="gb-card mp-learner"><span class="mp-avatar" aria-hidden="true">A</span><div><strong>Ana</strong><span>Grade 4 · set up by her teacher</span></div></div>
    <p class="mp-tag">Hiyang: different modes for different disabilities.</p>
    <div class="mp-list" role="radiogroup" aria-label="Learning mode">${cards}</div>
    <p class="mp-note">A teacher or parent picks the mode. Ana only sees the mode's name.</p>
    <button type="button" class="gb-btn bg-yellow w-full mp-start" data-action="start">Start practice &rarr;</button>
  </div>
  <button type="button" class="sound-toggle" data-action="sound" aria-label="Music and sounds">${ICON.sound}</button>
  ${bottomNav()}`;
}

function bottomNav() {
  const items = [["book", "Lessons"], ["pencil", "Practice"], ["game", "Games"], ["person", "Profile"]];
  return `<nav class="bottom-nav" aria-label="App sections">${items
    .map(([icon, label]) => `<span class="${label === "Profile" ? "on" : ""}">${ICON[icon]}${label}</span>`)
    .join("")}</nav>`;
}

function classView() {
  const m = state.mode;
  const hak = m === "hakbang";
  const lesson = hak ? LESSON.hakbang : LESSON.fraction;
  const question = hak ? HAKBANG_Q : FRACTION_Q;
  const stepsLeft = hak && state.step < STEPS.length;
  const chips = hak
    ? `<span class="gb-chip bg-yellow">Number and Algebra</span><span class="gb-chip bg-white">Grade 2 · Madali</span><span class="gb-chip bg-lavender">Grades 1&ndash;3 unlocked</span>`
    : `<span class="gb-chip bg-yellow">Number and Algebra</span>`;
  const modeChip = m === "default" ? "" : `<span class="gb-chip mode-chip ${MODES[m].tile}">${MODES[m].name}</span>`;
  const shake = state.result === false && m !== "kalma" ? " answer-shake" : "";
  const meta = m === "kalma" ? `<span class="kalma-count">Question 1 of 5</span>` : `<span class="classroom-quick-challenge">Quick Challenge</span>`;
  const dots = Array.from({ length: 5 }, (_, i) => `<span class="${i === 0 ? "is-complete" : ""}" aria-hidden="true"></span>`).join("");
  return `<div class="classroom-page gb-shell is-practice-tab mode-${m}">
    <header class="classroom-header">
      <button type="button" class="classroom-exit gb-chip bg-white" data-action="setup"><span aria-hidden="true">&larr;</span>Exit</button>
      <span class="badge-row">${modeChip}<span class="online-badge classroom-online"><i></i>Offline</span></span>
    </header>
    <div class="classroom-heading">
      <div class="chip-row">${chips}</div>
      <h1 class="classroom-title">${lesson.title}</h1>
      <p class="classroom-support">${lesson.support}</p>
    </div>
    <nav class="classroom-tabs" role="tablist" aria-label="Lesson sections">
      <button type="button" role="tab" aria-selected="false" class="is-unlocked is-complete" data-action="tab"><span>Explanation</span></button>
      <button type="button" role="tab" aria-selected="false" class="is-unlocked is-complete" data-action="tab"><span>Example</span></button>
      <button type="button" role="tab" aria-selected="true" class="is-active is-unlocked"><span class="classroom-tab-check" aria-hidden="true">&#10003;</span><span>Practice</span></button>
    </nav>
    <main class="classroom-panel${shake}" role="tabpanel" aria-label="Practice">
      <section class="classroom-practice">
        ${m === "pakinig" ? readBar() : ""}
        <div class="classroom-question-meta">${meta}<span class="classroom-question-progress" role="progressbar" aria-label="Question 1 of 5" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1">${dots}</span></div>
        ${hak ? hakbangVisual() : ""}
        <p class="classroom-question-text" id="q-text">${m === "pakinig" ? wordsHTML(question) : esc(question)}</p>
        ${stepsLeft ? `<div class="steps-note">Solve step by step</div>` : ""}
        ${feedback()}
      </section>
    </main>
    ${hak ? "" : answerCard()}
    <section class="classroom-teacher-zone ${state.teacher ? "is-open" : "is-collapsed"}" id="teacher-zone">
      ${stepsLeft ? stepScaffold() : actionRow()}
      ${state.teacher ? teacherDropdown() : ""}
    </section>
  </div>`;
}

function readBar() {
  return `<div class="p-readbar">
    <span class="gb-chip p-skip">${ICON.eyeOff}Skipped 1 picture-only question</span>
    <div class="p-read-controls">
      <button type="button" class="classroom-voice-action p-voice" data-action="read-q"><span class="classroom-control-icon">${ICON.ear}</span><span>Listen</span></button>
      <button type="button" class="classroom-voice-action p-voice" data-action="speed" aria-label="Reading speed ${state.rate} times"><span class="classroom-control-icon p-speed">${state.rate}&times;</span><span>Speed</span></button>
    </div>
  </div>`;
}

function hakbangVisual() {
  const st = state.step;
  const tiles = Array.from({ length: 8 }, (_, i) => `<span class="h-tile${st >= 2 && i >= 6 ? " is-eaten" : ""}">${st >= 1 ? i + 1 : ""}</span>`).join("");
  const label = st >= 2 ? "8 slices of bibingka, 2 of them eaten" : "8 slices of bibingka";
  return `<div class="h-visual"><div class="h-tiles" role="img" aria-label="${label}">${tiles}</div>${numberLine(st)}</div>`;
}

function numberLine(st) {
  const x = (n) => 16 + n * 36;
  const ticks = Array.from({ length: 9 }, (_, n) => `<line class="tick" x1="${x(n)}" y1="29" x2="${x(n)}" y2="43"/><text x="${x(n)}" y="64">${n}</text>`).join("");
  const done = st >= STEPS.length;
  const jumps = done ? `<path class="jump" d="M${x(8)} 27 Q${x(7.5)} 4 ${x(7)} 27"/><path class="jump" d="M${x(7)} 27 Q${x(6.5)} 4 ${x(6)} 27"/>` : "";
  const label = done ? "Number line from 0 to 8, jumping back 2 from 8 to 6" : "Number line from 0 to 8, starting at 8";
  return `<svg class="numline" viewBox="0 0 320 72" role="img" aria-label="${label}"><line class="axis" x1="${x(0)}" y1="36" x2="${x(8)}" y2="36"/>${ticks}${jumps}<circle class="dot" cx="${done ? x(6) : x(8)}" cy="36" r="7"/></svg>`;
}

function feedback() {
  const m = state.mode;
  if (m === "hakbang") {
    if (state.step < STEPS.length) return "";
    return `<div class="fb ok" role="status"><p class="fb-head">Correct! 6 slices are left.</p><p class="fb-body">8 take away 2 is 6.</p></div>`;
  }
  if (state.result === null) return "";
  const [head, body] = FEEDBACK[m][state.result ? "ok" : "bad"];
  const headHTML = m === "pakinig"
    ? `<p class="fb-head" id="fb-head" data-say="${esc(head)}">${wordsHTML(head)}</p>`
    : `<p class="fb-head">${esc(head)}</p>`;
  return `<div class="fb ${state.result ? "ok" : "bad"}" role="status">${headHTML}${body ? `<p class="fb-body">${esc(body)}</p>` : ""}</div>`;
}

function answerCard() {
  const pakinig = state.mode === "pakinig";
  return `<section class="classroom-answer-card" aria-label="Your answer">
    <p class="classroom-answer-heading">${pakinig ? "Say your answer, or type it." : "Answer in English."}</p>
    ${pakinig ? micBlock() : ""}
    <input id="answer" class="classroom-answer-input" type="text" placeholder="Type your answer..." value="${esc(state.input)}" autocomplete="off" aria-label="Your answer"${state.result !== null ? " disabled" : ""}>
  </section>`;
}

function micBlock() {
  const label = state.listening ? "Listening..." : state.heard ? `Heard “${esc(state.heard)}”, so 3/4` : "Tap the mic and say your answer";
  return `<div class="p-mic-wrap">
    <button type="button" class="p-mic${state.listening ? " is-on" : ""}" data-action="mic" aria-label="Answer by voice"${state.result !== null ? " disabled" : ""}>${ICON.mic}</button>
    <p class="p-mic-label" aria-live="polite">${label}</p>
    <p class="p-sim">Mockup: the voice answer is simulated.</p>
  </div>`;
}

function novaButton(extra = "") {
  return `<button type="button" class="classroom-practice-help-button${extra}" data-action="teacher" aria-expanded="${state.teacher}" aria-label="${state.teacher ? "Close" : "Open"} Teacher help"><img src="${NOVA}" alt="" width="54" height="54"><span class="classroom-practice-help-question" aria-hidden="true">?</span></button>`;
}

function actionRow() {
  let primary;
  if (state.mode === "hakbang" || state.result === true) {
    primary = `<button type="button" class="gb-btn bg-sky classroom-submit-answer classroom-practice-primary w-full" data-action="next">Next &rarr;</button>`;
  } else if (state.result === false) {
    primary = `<button type="button" class="gb-btn bg-rose classroom-submit-answer classroom-practice-primary w-full" data-action="retry">Try again</button>`;
  } else {
    primary = `<button type="button" class="gb-btn bg-yellow classroom-submit-answer classroom-practice-primary w-full" data-action="submit" id="submit-btn"${state.input.trim() ? "" : " disabled"}>Answer</button>`;
  }
  return `<div class="classroom-practice-action-row">${primary}${novaButton()}</div>`;
}

function stepScaffold() {
  const s = STEPS[state.step];
  return `<div class="gb-card bg-white h-scaffold${state.stepWrong ? " answer-shake" : ""}">
    <div class="h-scaffold-top"><p class="h-counter">Step ${state.step + 1} / ${STEPS.length}</p>${novaButton(" h-help")}</div>
    <p class="h-prompt font-display" id="step-prompt">${esc(s.prompt)}</p>
    <div class="h-row">
      <input id="step-input" class="h-input" type="text" inputmode="numeric" placeholder="Type your answer..." value="${esc(state.stepInput)}" autocomplete="off" aria-labelledby="step-prompt">
      <button type="button" class="gb-btn bg-mint h-answer" data-action="step-submit" id="step-btn"${state.stepInput.trim() ? "" : " disabled"}>Answer</button>
    </div>
    ${state.stepWrong ? `<p class="h-wrong" role="alert">Not yet. Count again, one slice at a time.</p>` : ""}
  </div>`;
}

function teacherDropdown() {
  return `<div class="classroom-teacher-dropdown" role="dialog" aria-label="Teacher help">
    <button type="button" class="classroom-teacher-close" data-action="teacher" aria-label="Close Teacher">&times;</button>
    <div class="classroom-dropdown-message"><div class="classroom-tutor-bubble"><div class="gb-card bubble-card"><div class="bubble-text" id="guide-text">${esc(GUIDE[state.mode])}</div><div></div></div></div></div>
    <div class="classroom-voice-controls">
      <button type="button" class="classroom-voice-action" data-action="listen"><span class="classroom-control-icon">${ICON.ear}</span><span>Listen again</span></button>
      <button type="button" class="classroom-voice-action" data-action="pause"><span class="classroom-control-icon">${ICON.pause}</span><span>Pause</span></button>
      <button type="button" class="classroom-ask-teacher bg-lavender" data-action="ask-toggle" aria-expanded="${state.askOpen}">${ICON.hand}<span>Ask Teacher</span></button>
    </div>
    ${state.askOpen ? askPanel() : ""}
  </div>`;
}

function askPanel() {
  return `<div class="classroom-ask-panel">
    <div class="classroom-ask-row ask-row">
      <input id="ask-input" class="ask-input" value="How do I solve this?" placeholder="Ask Teacher..." aria-label="Ask Teacher">
      <button type="button" class="classroom-ask-mic gb-chip bg-rose" data-action="ask-mic">Mic</button>
      <button type="button" class="gb-btn bg-mint classroom-ask-submit" data-action="ask-send">Ask</button>
    </div>
    ${state.reply ? replyCard() : ""}
  </div>`;
}

function replyText() {
  if (state.mode !== "hakbang") return REPLY[state.mode];
  return state.step < STEPS.length ? STEPS[state.step].reply : HAKBANG_DONE_REPLY;
}

function replyCard() {
  const m = state.mode;
  const text = replyText();
  const source = m === "default" ? "On-device (offline)" : `On-device (offline) · ${MODES[m].name} rules`;
  const body = m === "pakinig"
    ? `<p class="reply-text" id="reply-text" data-say="${esc(text)}">${wordsHTML(text)}</p>`
    : `<p class="reply-text" id="reply-text">${esc(text)}</p>`;
  return `<div class="reply-card"><p class="reply-source">${source} · sample reply</p>${body}</div>`;
}

function renderNotes() {
  const k = state.mode;
  const m = MODES[k];
  const forLine = k === "default" ? "Default mode, for comparison" : `For ${m.forWho}`;
  const list = (items) => items.map((x) => `<li>${esc(x)}</li>`).join("");
  notes.innerHTML = `<div class="n-head"><span class="mp-icon ${m.tile}">${ICON[m.icon]}</span><div><h2>${m.name} <span>${m.gloss}</span></h2><p class="n-for">${forLine}</p></div></div>
    <div class="n-cols">
      <div><h3>${k === "default" ? "UI today" : "UI/UX changes"}</h3><ul>${list(m.ui)}</ul></div>
      <div><h3>${k === "default" ? "Default AI today" : "Local AI changes"}</h3><ul>${list(m.ai)}</ul></div>
    </div>
    <p class="n-try">${esc(m.tryIt)}</p>`;
}

const hasUserGesture = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;

function render(opts = {}) {
  const oldShell = $(".gb-shell", screenHost);
  const scroll = opts.keepScroll && oldShell ? oldShell.scrollTop : 0;
  screenHost.innerHTML = state.screen === "setup" ? setupView() : classView();
  const shell = $(".gb-shell", screenHost);
  if (shell && scroll) shell.scrollTop = scroll;
  renderNotes();
  document.querySelectorAll(".switch [data-action]").forEach((b) => {
    const on = b.dataset.action === "setup" ? state.screen === "setup" : state.screen === "class" && b.dataset.mode === state.mode;
    b.setAttribute("aria-pressed", String(on));
  });
  if (opts.focus) $(opts.focus, screenHost)?.focus({ preventScroll: true });
  if (opts.reveal) $(opts.reveal, screenHost)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (opts.speak) tts.speak($(opts.speak, screenHost));
  else if (opts.autoRead && state.screen === "class" && state.mode === "pakinig" && hasUserGesture()) {
    setTimeout(() => tts.speak($("#q-text", screenHost)), 300);
  }
}

/* ---------- actions ---------- */
let toastTimer;
function toast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function flashCorrect() {
  const el = document.createElement("div");
  el.className = "correct-overlay";
  el.innerHTML = `<p class="nova-correct">Correct! \u{1F31F}</p>`;
  $("#phone").appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function checkAnswer(value) {
  const m = state.mode;
  state.result = isThreeFourths(value);
  if (m === "default" && state.result) flashCorrect();
  render({
    keepScroll: true,
    speak: m === "pakinig" ? "#fb-head" : null,
    focus: m === "pakinig" ? null : '[data-action="next"], [data-action="retry"]',
  });
}

const actions = {
  open: (btn) => go(btn.dataset.mode),
  setup: () => go("setup"),
  start: () => go(state.mode),
  select(btn) {
    state.mode = btn.dataset.mode;
    render({ keepScroll: true, focus: `[data-mode="${state.mode}"]` });
  },
  sound: () => toast("Music and sounds (mockup). Kalma mode keeps them off."),
  tab: () => toast("Mockup: only the Practice tab is built."),
  submit() {
    const input = $("#answer", screenHost);
    if (input) state.input = input.value;
    if (state.input.trim()) checkAnswer(state.input);
  },
  retry() {
    Object.assign(state, { result: null, input: "", heard: "" });
    render({ keepScroll: true, focus: "#answer" });
  },
  next: () => toast("Mockup: the next question would load here."),
  teacher() {
    state.teacher = !state.teacher;
    if (!state.teacher) Object.assign(state, { askOpen: false, reply: false });
    tts.stop();
    render({
      keepScroll: true,
      reveal: state.teacher ? ".classroom-teacher-dropdown" : null,
      speak: state.teacher && state.mode === "pakinig" ? "#guide-text" : null,
    });
  },
  listen: () => tts.speak($("#reply-text", screenHost) || $("#guide-text", screenHost)),
  pause(btn) {
    if (!tts.togglePause()) return toast("Nothing is being read aloud right now.");
    btn.firstElementChild.innerHTML = tts.paused ? ICON.play : ICON.pause;
    btn.lastElementChild.textContent = tts.paused ? "Resume" : "Pause";
  },
  "ask-toggle"() {
    state.askOpen = !state.askOpen;
    if (!state.askOpen) state.reply = false;
    render({ keepScroll: true, reveal: state.askOpen ? ".classroom-ask-panel" : null });
  },
  "ask-send"() {
    state.reply = true;
    render({ keepScroll: true, reveal: ".reply-card", speak: "#reply-text" });
  },
  "ask-mic": () => toast("Mockup: voice questions are simulated."),
  "read-q": () => tts.speak($("#q-text", screenHost)),
  speed(btn) {
    const rates = [0.8, 0.65, 1];
    state.rate = rates[(rates.indexOf(state.rate) + 1) % rates.length];
    btn.querySelector(".p-speed").innerHTML = `${state.rate}&times;`;
    btn.setAttribute("aria-label", `Reading speed ${state.rate} times`);
    tts.speak($("#q-text", screenHost));
  },
  mic() {
    if (state.listening || state.result !== null) return;
    tts.stop();
    const token = state.token;
    Object.assign(state, { listening: true, heard: "" });
    render({ keepScroll: true });
    setTimeout(() => {
      if (token !== state.token || state.mode !== "pakinig") return;
      Object.assign(state, { listening: false, heard: "three fourths", input: "3/4" });
      checkAnswer("three fourths");
    }, 1800);
  },
  "step-submit"() {
    const input = $("#step-input", screenHost);
    const value = input ? input.value : "";
    if (!value.trim()) return;
    if (toNumber(value) === STEPS[state.step].answer) {
      Object.assign(state, { step: state.step + 1, stepInput: "", stepWrong: false, reply: false });
    } else {
      Object.assign(state, { stepInput: "", stepWrong: true });
    }
    render({ keepScroll: true, focus: state.step < STEPS.length ? "#step-input" : '[data-action="next"]' });
  },
};

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  actions[btn.dataset.action]?.(btn, e);
});

document.addEventListener("input", (e) => {
  if (e.target.id === "answer") {
    state.input = e.target.value;
    const b = $("#submit-btn", screenHost);
    if (b) b.disabled = !state.input.trim();
  } else if (e.target.id === "step-input") {
    state.stepInput = e.target.value;
    const b = $("#step-btn", screenHost);
    if (b) b.disabled = !state.stepInput.trim();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.teacher) return actions.teacher();
  if (e.key !== "Enter") return;
  if (e.target.id === "answer" && state.result === null) actions.submit();
  else if (e.target.id === "step-input") actions["step-submit"]();
  else if (e.target.id === "ask-input") actions["ask-send"]();
});

readHash();
resetLesson();
render();
