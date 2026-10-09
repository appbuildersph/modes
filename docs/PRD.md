# Product Requirements Document — Gabay

Status: draft v0.2, 2026-10-09. Owner: Team CrossCampus. This PRD describes the product as it exists in this repo ("Current") and what is being added ("Planned"). Anything marked **Unconfirmed** is a proposal that needs a team decision.

**Context: hackathon.** This work is the team's entry in the AppBuildersPH Hackathon 2026 (theme Local AI). Official judging criteria are in `docs/JUDGING.md` (Problem and Usefulness 25%, Local AI Implementation 25%, Technical Execution 20%, Innovation 15%, Product and Demo Quality 15%) and rules in `docs/HACKATHON.md`. Submission deadline is 10:00 AM on 2026-10-10. Where this PRD lists P1/P2 items that do not help the live Local AI demo, defer them. The FR-A1 to FR-A6 requirements (on-device model) are the hackathon deliverable; everything else is the pre-existing base to protect, not extend.

## 1. Summary

**The product is an offline-first tutor.** The tutor must work with no network; every cloud feature is an optional upgrade. **The on-device model is Gemma 4 E2B** (confirmed 2026-10-10, unverified on device; see `docs/LOCAL_AI.md`). **The demo device is an iPhone 13 running the installed PWA.**

Gabay is an offline-first PWA study companion for Filipino Grade 4-6 learners studying Mathematics under the DepEd MATATAG curriculum. A friendly tutor mascot, Teacher Gabay, explains lessons, checks answers, answers questions (text or voice), and tracks mastery, all of which keep working without internet. When a connection exists, the app upgrades itself: cloud Gemini tutoring, adaptive AI-generated practice, natural Filipino text-to-speech, and Gemini transcription.

The current workstream adds an **open-source on-device language model** so the AI tutor itself can run offline on iPhone, where Chrome's built-in Gemini Nano does not exist.

## 2. Problem

- Many Filipino learners have inconsistent or no internet at home and in school. Cloud-only AI tutors fail exactly when they are needed.
- Generic AI tutors are not grounded in the DepEd MATATAG competencies, do not speak natural Taglish, and tend to hand over answers instead of teaching.
- Account-based products add friction and privacy concerns for children.
- The offline AI path today depends on Chrome's Prompt API (Gemini Nano), which is not available on iOS (all iOS browsers use WebKit) and only exists on capable desktop/Android Chrome. A large share of target devices, and the team's own test devices, are therefore excluded from offline AI.

## 3. Goals

| ID | Goal |
|---|---|
| G1 | A learner can complete the full learning loop (lesson, practice, feedback, mastery) with the network off, on the first load after install and on every later load. |
| G2 | Teacher Gabay can answer a learner's math question fully on-device on an iPhone, using an open-source model, with no network call. (Planned) |
| G3 | AI behaviour degrades gracefully: best available option first, never a broken screen. |
| G4 | Content is grounded in DepEd MATATAG Grades 4-6 and presented in English, Tagalog, or Taglish. |
| G5 | The tutor teaches rather than answers: guided steps, short, warm, plain text, Filipino real-life contexts. |
| G6 | No accounts, no client-side secrets, learner data stored locally. |
| G7 | Three learning modes (Kalma, Pakinig, Hakbang) that change both the UI/UX and the local AI behaviour so the same lesson fits learners who need calm and focus, listening support, or step-by-step concrete teaching. |

## 4. Non-goals

- Grades 1-3 in the default experience and all non-math subjects. Exception: Hakbang mode unlocks Grade 1-3 content (curriculum JSON for Grades 1-3 is retained in the repo but is not bundled today; see `docs/TUTOR_MODES.md` section 6).
- Diagnosing, screening, or making clinical or therapeutic claims. The modes are designed to support learners with different needs; the app does not ask for or store a diagnosis.
- User accounts, cloud sync, leaderboards, or any server-side learner profile.
- A native App Store app in this phase (Capacitor is deferred; see `docs/DECISIONS.md`).
- Training or fine-tuning a model in this phase (may be revisited if base-model Filipino quality is inadequate).
- Replacing the teacher. Gabay supports classroom and home study; printable term packets exist for teachers.

## 5. Users

| Persona | Needs | Notes |
|---|---|---|
| **Learner, Grade 4-6 (primary)** | Understand a lesson, practise, get encouraging feedback, ask questions by typing or speaking, do it on a phone | Ages roughly 9-12. Reads English, Tagalog, or a mix. May share a family phone. |
| **Learner who benefits from a mode (primary)** | Kalma: learners with ADHD, autism, or sensory sensitivity who need a calm, low-stimulus, predictable screen. Pakinig: learners with dyslexia, low vision, or weak reading who need large clear text and read-aloud. Hakbang: learners with dyscalculia or intellectual disability who need one concrete step at a time | Described as design intent, not diagnosis. Any learner may choose any mode |
| **Teacher (secondary)** | Printable lesson plans, quizzes, activity sheets, and exams aligned to MATATAG; trust that content is curriculum-correct | Served today by the PDF packets in `Term1-3/` and the root PDFs, generated from `_src/`. No in-app teacher view exists. |
| **Parent/guardian (tertiary)** | Confidence the app is safe, private, and works without data | No accounts, no tracking. |
| **Developer/AI agent** | Clear contracts and docs | See `CLAUDE.md`, `docs/ARCHITECTURE.md`. |

## 6. Scope: what exists today (Current)

Verified by reading the code in this repo on 2026-10-09. The test suite has not been run in this checkout.

- **Curriculum:** 155 competencies (Grade 4: 54, Grade 5: 49, Grade 6: 52) and 1,571 bundled practice items across three domains: Number and Algebra, Measurement and Geometry, Statistics and Probability. Each competency has explanation, worked example, items, game tags, and a source trace.
- **Flow:** Splash -> Onboarding (name, grade) -> Home/Lessons -> Topic picker (browse or practice) -> Lesson brief -> Classroom (2D) or 3D Classroom -> Progress. Bottom navigation: Lessons, Practice, Games, Profile.
- **Classroom:** explanation and worked example, guided practice with step-by-step items, answer checking tolerant of formatting, feedback, and "Ask Teacher Gabay" (text or voice input, spoken replies).
- **Mastery:** per-grade mastery score per competency, spaced-repetition due ticks, daily streak, attempt history for review. Bands: red below 40%, orange 40-69%, green 70% and up; a lesson is complete at 100%.
- **Games (4):** store, garden, house, fiesta. Each draws on competencies tagged for that theme and uses the same question-session pipeline.
- **3D classroom:** Three.js scene with textured, themeable room; falls back to 2D.
- **Languages:** English, Tagalog (`fil`), Taglish across UI, feedback, and tutor reply language.
- **Audio:** procedural/bundled sound effects and background music with mute and music toggles.
- **AI today:** tutor chain (Gemini Nano -> `/api/tutor` Vertex/Gemini -> bundled explanation); adaptive question generation with an independent verification pass (`/api/questions`); Google Cloud TTS (`/api/tts`) with `speechSynthesis` fallback; Gemini transcription (`/api/transcribe`) with Web Speech fallback.
- **PWA:** Workbox precache of the app shell and assets, `navigateFallback` to `index.html` so offline reloads work, auto-update service worker.
- **Connectivity detection:** real request to `/api/ping` every 8 seconds, not `navigator.onLine`.

## 7. Functional requirements

Priority: **P0** must have for the local-AI milestone, **P1** should have, **P2** nice to have. "Current" requirements are listed for traceability and regression protection.

### 7.1 Learning loop (Current, P0 regression guard)

| ID | Requirement |
|---|---|
| FR-L1 | The app shell, curriculum, images, and sound load from the service-worker cache with no network. |
| FR-L2 | A learner can pick a grade (4-6) and name once; both persist. |
| FR-L3 | Each lesson shows an explanation and worked example in the chosen language. |
| FR-L4 | Practice answers are checked locally; numeric answers tolerate formatting (spaces, peso sign, percent, commas, trailing zeros). |
| FR-L5 | Mastery moves +0.1 per correct and -0.1 per wrong answer, clamped 0 to 1, per competency per grade. |
| FR-L6 | The next suggested competency is the lowest-mastery, longest-due one. |
| FR-L7 | Learner-facing questions never expose curriculum metadata or rubric text. |

### 7.2 Question sessions (Current, P0 regression guard)

| ID | Requirement |
|---|---|
| FR-Q1 | When reachable, request an AI question batch (5-20 questions) grounded in the selected competencies and the learner's mastery; validate and independently verify it server-side and client-side. |
| FR-Q2 | Before committing to the 90-second AI window, a 3-second reachability check decides whether to try; on any failure fall back to the bundled rotation. |
| FR-Q3 | The bundled rotation shuffles without repeating until the pool is exhausted, and never repeats the last question across a reshuffle. |

### 7.3 Local AI tutor (Planned)

| ID | Pri | Requirement |
|---|---|---|
| FR-A1 | P0 | On an iPhone running the installed PWA, with the network off, a learner can ask a question and receive a relevant answer generated by an open-source model on the device. **Unverified that this is feasible on target hardware.** |
| FR-A2 | P0 | Tutor provider order: on-device Nano (where available), on-device open-source model, cloud `/api/tutor`, bundled explanation. The first available provider answers; failures fall through silently to the next. |
| FR-A3 | P0 | The model is downloaded once on explicit learner/guardian consent over a good connection, with a visible progress bar, resumable if interrupted, and an estimate of size before starting. |
| FR-A4 | P0 | If the model is missing (evicted by the OS or never downloaded) the app detects it, keeps working through the next provider, and offers to download again. |
| FR-A5 | P0 | Tutor output obeys the active mode's rules by construction: plain text only, sentence limits, fractions spelled out for speech. Enforced by post-processing code, not only by the prompt. |
| FR-A6 | P0 | The model only discusses the active competency; student text is treated as data, not instructions. |
| FR-A7 | P1 | Replies are cached per `ref`, language, and question as today (`tutor:{ref}:{lang}:{hash}`). |
| FR-A8 | P1 | The UI labels which source answered (on-device, online, bundled). |
| FR-A9 | P1 | A hidden "AI Lab" page loads a chosen model, runs a fixed prompt set, and reports load time, tokens per second, and memory outcome, for on-device evaluation. |
| FR-A10 | P2 | Allow the learner or teacher to remove the downloaded model to free storage. |

### 7.4 Learning modes (Planned; definitions confirmed 2026-10-09)

Full definitions, per-mode UI/UX and local AI changes, and code touch points are in `docs/TUTOR_MODES.md`.

| ID | Pri | Requirement |
|---|---|---|
| FR-M1 | P0 | Three modes exist and can be selected: **Kalma** (calm/focus), **Pakinig** (listen), **Hakbang** (step). The selection persists on the device and applies across lessons, practice, and the tutor. |
| FR-M2 | P0 | Tutor replies obey the active mode, for every provider, with the rules enforced in code after generation. Kalma: at most 2 short sentences, one idea, calm neutral tone. Pakinig: no symbols or markdown, fractions and symbols spoken as words ("3/4" is "three fourths"). Hakbang: one step then a check question, simple words, concrete Filipino examples. |
| FR-M3 | P1 | Kalma UI: plain background, no music, coins, doodles, or 3D, one question per screen, a fixed layout, about 5 questions per session. |
| FR-M4 | P1 | Pakinig UI: large readable font, high contrast, wide spacing, slower speech, auto read-aloud. P2: word highlighting, voice answers to practice items. |
| FR-M5 | P2 | Hakbang UI: bigger StepScaffold, concrete visuals first (blocks, number lines). |
| FR-M6 | P2 | Hakbang content: unlock Grade 1-3 content (lazy-loaded, only in this mode) and generate questions from the `madali` tier and lower grades. |
| FR-M7 | P0 | The app never asks for, infers, or stores a diagnosis; copy describes who a mode is designed to support, with no clinical or efficacy claims. |

### 7.5 Voice (Current, P1 regression guard)

| ID | Requirement |
|---|---|
| FR-V1 | Replies can be spoken: cloud TTS in a Filipino or English voice when online, `speechSynthesis` offline. Audio is cached per language and text. |
| FR-V2 | Questions can be spoken: Gemini transcription when online, Web Speech otherwise, typing always available. |

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| **Offline** | Core loop works with the network off from the second launch onward. Offline reload shows the app, not a browser error. |
| **Resilience** | No AI failure may block learning. Every online or heavy feature has a cheaper fallback. |
| **Performance (local AI)** | Targets are TBD until measured on real devices. Capture: model load time, time to first token, tokens per second, peak memory, and tab survival. Draft aspiration: first token in a few seconds and a full short reply within about 15 seconds on the minimum supported iPhone. |
| **Device support** | Minimum iPhone model and iOS version are an open decision (see section 12). Believed baseline: iOS 26 or later for WebGPU in Safari; unverified. |
| **Storage** | Model files must not be precached by the service worker. Request persistent storage; assume the OS can still evict it. |
| **Privacy** | No accounts, no analytics identifiers of children, no learner data leaves the device except the question text sent to the cloud tutor and the audio sent to transcription when online. Disclose this. |
| **Safety** | Child-appropriate language. Prompt-injection resistant. Topic locked to the active math competency. |
| **Accessibility** | Spoken output, plain text replies, large tap targets (mobile first, portrait). |
| **Security** | Secrets only on the server; per-IP rate limits and origin allow-listing on every endpoint; request size caps. |
| **Maintainability** | Tests via `node --test`; pure helpers exported from API handlers; docs updated with decisions. |

## 9. Success metrics

Baselines are not yet measured. Fill these in as data becomes available.

| Metric | Definition | Target |
|---|---|---|
| Offline AI answer rate | Share of tutor questions answered on-device on a real iPhone with network off | TBD (draft: at least 90% across the eval prompt set) |
| Eval quality score | Average reviewer score on the Taglish eval prompt set, per mode | TBD by reviewer rubric |
| Mode compliance | Share of replies that satisfy the mode's hard rules after post-processing | 100% (enforced in code) |
| Math correctness | Share of eval answers that are mathematically correct | TBD |
| Time to first token / tokens per second | On minimum supported iPhone | TBD, measure first |
| Tab survival | Share of model loads and replies that complete without the OS killing the page | TBD (draft: no crashes across the eval set) |
| Regression | `npm test` passes | 100% |

## 10. Milestones (proposed)

**Hackathon time box:** work is due by 10:00 AM on 2026-10-10 (about 10 hours remained when this was written at 11:30 PM on 2026-10-09). The table below is the full plan; the minimum viable cut for the deadline is M0, a laptop-browser version of M2 to M4 (one model, one runtime, one device), the README and disclosures from M7, and the demo video. M1 (real iPhone), M3's full Taglish evaluation, M5's iPhone checklist, and M6 (modes) are stretch goals unless time allows. See `docs/LOCAL_AI.md` section 0.

| # | Milestone | Exit criteria |
|---|---|---|
| M0 | Baseline | `npm install` and `npm test` pass; app runs in iPhone simulator |
| M1 | Device ready | Real iPhone reaches the dev server over HTTPS; `navigator.gpu` confirmed |
| M2 | AI Lab spike | Test page loads at least two candidate models on a real iPhone and records speed, size, and crashes |
| M3 | Model decision | Winner chosen with written reasons; license reviewed; Filipino-reading reviewer scored the Taglish eval |
| M4 | Integration | Local provider wired into `tutor.js` with download UX, persistence check, and post-processing; tests added |
| M5 | Offline verification | Airplane-mode run on a real iPhone passes the acceptance checklist |
| M6 | Modes | Kalma, Pakinig, Hakbang defined by the team and implemented |
| M7 | Docs and demo | README written (judges must be able to recreate the project from the repo); disclosures complete per `docs/SUBMISSION.md`; demo video and social post done; repo public before 10:00 AM |

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| iOS kills the page when memory use is too high (anecdotally around 2 GB per web process on iOS 26; not an Apple figure) | Model never loads or crashes mid-answer | Prefer sub-1 GB models; test on physical devices; fall through to next provider; consider a native runtime later |
| Small models are weak at Filipino/Taglish generation | Poor or wrong explanations | Own eval set scored by a Filipino reader; strong grounding in the competency; short constrained prompts; code-level rules; consider fine-tuning later |
| Small models give wrong math | Misleads children | Verify numeric answers in code where possible; ground in bundled worked examples; keep the bundled explanation visible |
| Browser storage eviction deletes the model | Offline AI silently disappears | Persistent storage request; detect missing model; re-download flow |
| Model license terms (Gemma custom terms, Llama attribution) | Distribution blocked | Prefer Apache-2.0 models unless quality demands otherwise; read terms before shipping |
| Large first download on a slow or metered connection | Learners abandon or burn data | Consent screen with size; Wi-Fi advice; resumable; optional |
| Simulator hides real memory behaviour | False confidence | Physical-device testing is required, simulator is not evidence |
| Prompt drift between client and server | Inconsistent tutor behaviour | Share or test the prompt in one place |

## 12. Open questions

1. Which model, and is its Taglish quality acceptable? (needs the eval, a Filipino-reading reviewer)
2. What is the minimum supported iPhone model and iOS version?
3. Where is the mode chosen and can it change mid-lesson? Is the Grade 1-3 unlock in scope for the hackathon? (The three modes and their definitions are confirmed; see `docs/TUTOR_MODES.md`.)
4. Is the model download offered to the learner, the guardian, or a teacher-managed flow?
5. Should the bundled Filipino/Taglish content be translated properly (all bundled item text is currently English in every language field)?
6. Where will the app be hosted for the next phase (affects `QUESTION_CORS_ORIGINS` and `VITE_QUESTION_API_BASE`)?
7. Does a pre-existing project qualify, and what disclosure do the organisers expect? (ask in the hackathon Telegram group; see `docs/HACKATHON.md` section 8.1)
8. Is a native wrapper still wanted later for Android and for native model runtimes?

## 13. Release notes for the PRD

Update this file when a requirement changes. Keep requirement IDs stable so other docs and tests can reference them.
