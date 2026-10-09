# Architecture — Gabay

Status: 2026-10-09, derived by reading the code in this repo. File paths are relative to the repo root. The test suite has not been run in this checkout; treat behavioural claims as "per the code", not "per a passing test run".

## 1. Stack

| Layer | Technology |
|---|---|
| UI | React 19, Tailwind CSS 3 plus per-screen `.css`, function components with hooks |
| 3D | Three.js 0.171 (`src/three/scene.js`, `src/screens/Classroom3D.jsx`, lazy-loaded) |
| Build | Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa` (Workbox) |
| Local data | `idb-keyval` over IndexedDB (no `localStorage`) |
| Server | Node serverless functions in `api/` (Vercel-style `(req, res)` handlers) |
| Cloud AI | `@google/genai` against Vertex AI or a Gemini API key; `@google-cloud/text-to-speech` |
| Tests | `node --test` (`test/*.test.js`) |
| Tooling | `sharp` (icons), `playwright` (screenshots in `scripts/shoot.mjs`) |

## 2. Layout

```
index.html, vite.config.js, tailwind.config.js, postcss.config.js
src/
  main.jsx            entry; registers the service worker (auto-update)
  App.jsx             screen state machine, connectivity probe, learning state
  screens/            Splash, Onboarding, Lessons, TopicPicker, LessonBrief, Classroom (2D),
                      Classroom3D, Generating, Progress, Games. Home.jsx and StartChoice.jsx
                      exist but App.jsx does not import them.
  ui/                 BottomNav, SoundToggle, Mascot, Primitives, Icons, LearningVisual, ...
  lib/                all non-UI logic (see section 4)
  curriculum/         grade1-6.json + teaching-overrides.json (grades 1-3 not bundled)
  content.json        small curated Grade 6 set; no runtime code imports it (only referenced
                      in comments and by scripts/generate-content.js as the target schema)
  three/              scene.js, textures.js
api/                  tutor, questions, tts, transcribe, ping, _shared
scripts/              content + curriculum tooling, icon generation, screenshots
test/                 13 test files
textures/, public/    3D textures, mascot, game art, sfx, PWA icons
_src/, Term1-3/, *.pdf   printable teacher packets (HTML source -> PDF via _src/build.py)
```

## 3. Runtime overview

```
                      +--------------------------------------------+
                      |                 PWA (browser)              |
  learner  <--------> |  React screens  <->  lib/ (logic)          |
                      |        |               |                   |
                      |  IndexedDB (idb-keyval) | Service worker    |
                      |  mastery, history,      | (Workbox precache)|
                      |  prefs, caches          |                   |
                      +--------+-----------------------------------+
                               | only when reachable (/api/ping)
                               v
                      +--------------------+     +------------------+
                      |  api/* functions   | --> | Vertex / Gemini  |
                      |  guard(): CORS,    |     | Google Cloud TTS |
                      |  origin, size,     |     +------------------+
                      |  rate limit        |
                      +--------------------+
```

The client never holds credentials. Every `/api/*` call goes through `apiUrl()` (`src/lib/api-base.js`), which prefixes `VITE_QUESTION_API_BASE` when the app is hosted separately from the functions.

## 4. Client modules (`src/lib/`)

| Module | Responsibility |
|---|---|
| `mastery.js` | Per-grade mastery and due-tick storage, `recordAnswer`, `pickNext`, `masteryBand`, daily streak, legacy-key migration |
| `progress.js` | Canonical definitions: started, completed (mastery 100%), in progress; `summarizeLessons` |
| `history.js` | Attempt log for review (cap 200), prunes legacy non-reviewable entries and their mastery |
| `check.js` | `checkAnswer` (tolerant normalisation, numeric compare), `choiceOptions` |
| `content.js` | Lazy per-grade curriculum loader (dynamic `import`), `getContentByRef` over loaded grades |
| `content-catalog.js` | Static all-grades catalog (4-6) used by `api/` and tests |
| `curriculum-overrides.js` + `curriculum/teaching-overrides.json` | Per-competency and per-item repairs applied at load |
| `lesson-teaching.js` | Regex-rule lesson explanations and guides in `{ en, fil, taglish }` |
| `topics.js` | Learner-facing topic titles by competency `ref`, search labels |
| `difficulty.js` | `madali` / `katamtaman` / `mahirap` classification from competency text |
| `question-session.js` | Builds a session: AI batch or bundled rotation; validation; rotation state |
| `question-quality.js` | Rejects metadata-like questions, rubric-text options, degenerate true/false |
| `tutor.js` | `askTeacherGabay`: provider chain and cache (the main file the local AI changes) |
| `strip-markdown.js` | Removes markdown from tutor text before display and TTS |
| `speech.js` | Voice out: cloud TTS then `speechSynthesis`; audio cache; stop/pause/resume |
| `voicein.js` | Voice in: MediaRecorder -> `/api/transcribe`, else Web Speech, else typing |
| `sound.js` | Procedural SFX, background music, mute/music prefs |
| `i18n.js` | `t(key, lang, vars)` with `{ en, fil, taglish }` string table (about 620 lines) |
| `lang.js` | `LANGS`, `LANG_NAME` (tutor reply language), `SPEECH_LANG`, load/save pref |
| `grades.js` | `GRADES = [4,5,6]`, `DEFAULT_GRADE = 6`, `isSupportedGrade` |
| `feedback.js`, `visual-assets.js`, `theme.js` | Answer feedback copy, visual aids, theme tokens |
| `api-base.js` | `API_BASE` and `apiUrl()` |

## 5. Screen flow

`App.jsx` holds a `screen` string state, not a router.

```
splash -> onboarding (first run: name, grade) -> home / start (Lessons)
Lessons / BottomNav -> topics (browse | practice) -> brief -> generating -> classroom | classroom3d -> progress
BottomNav: lessons -> start, practice -> topics(practice), games -> games, profile -> progress
```

- `enterClassroom` calls `prepareQuestionSession` (mode `quiz`, 5 questions, scope = the active competency) and shows `generating` meanwhile. On failure it returns to `brief`.
- `Classroom3D` is lazy-loaded and can fall back to the 2D `Classroom` (`onFallback2D`).
- Changing grade clears that grade's mastery in the profile flow (`handleProfileGradeChanged`).
- Initial `grade` state is 6 and `DEFAULT_GRADE` is 6; a stored grade outside 4-6 is reset.

## 6. Connectivity model

`App.jsx` polls `GET`/any request to `/api/ping` (204, no work) every 8 s with a 4 s timeout, and also on the `online` event; the `offline` event sets offline immediately. Reason (from the code comment): `navigator.onLine` does not flip when DevTools throttling is set to Offline. `question-session.js` re-checks reachability with a 3 s timeout right before committing to the 90 s AI window.

Note: `api/_shared.js` `guard()` is POST-only and returns 405 for other methods, but `api/ping.js` does not call `guard()` and answers 204 to any method.

## 7. Fallback chains (best available first, never broken)

| Capability | 1 | 2 | 3 | Floor |
|---|---|---|---|---|
| Tutor reply | On-device Gemini Nano (`self.LanguageModel`, if `availability() === 'available'`) | `POST /api/tutor` (Vertex/Gemini) | none | Bundled `competency.explanation[lang]`, else fixed offline message |
| Questions | `POST /api/questions` (generate then independently verify) | none | none | Bundled rotation from `competency.items` |
| Voice out | `POST /api/tts` (Google Cloud TTS) | none | none | `window.speechSynthesis` |
| Voice in | MediaRecorder -> `POST /api/transcribe` | Web Speech API | none | Typing |

The local-AI work inserts a new provider between Nano and `/api/tutor` in the tutor chain. See `docs/LOCAL_AI.md`.

## 8. Tutor flow in detail (`src/lib/tutor.js`)

1. `findCompetency(ref)` from loaded curriculum; build `gabayPrompt(competency, lang)`.
2. Cache lookup in IndexedDB: key `tutor:{ref}:{lang}:{hash(question)}`; hit returns immediately with `fromCache: true`.
3. If Nano is available: `LanguageModel.create({ initialPrompts: [{ role: 'system', content }] })`, `prompt(question)`, destroy, cache, return `source: 'nano'`.
4. Else if `navigator.onLine`: `fetch(apiUrl('/api/tutor'))` with body `{ question, ref, lang }` only (never a system instruction). On success cache and return `source: 'online'`.
5. Else return the bundled explanation (`source: 'cached'`).

`Classroom.jsx` calls `askTeacherGabay`, passes the text through `stripMarkdown`, and speaks it via `speak(text, { lang })`.

Observed quirk: step 4 checks `navigator.onLine`, while the rest of the app uses the `/api/ping` probe. A throttled connection can look online here.

## 9. Server (`api/`)

| Endpoint | File | Purpose | Rate limit (per IP/min) | Body cap |
|---|---|---|---|---|
| `POST /api/tutor` | `tutor.js` | Gemini tutor reply; prompt built server-side from `ref` + `lang`; returns `{ text, source }`; no creds -> `placeholder` text; failure -> 502 `vertex_failed` | `TUTOR_RATE_LIMIT` (10) | 8 KB |
| `POST /api/questions` | `questions.js` | Generate a batch with schema-constrained JSON, validate, then run an independent verifier model pass; themes: store, garden, house, fiesta | `QUESTION_RATE_LIMIT` (8) | 24 KB |
| `POST /api/tts` | `tts.js` | Cloud TTS, `fil-PH-Wavenet-A` (or English `en-US-Neural2-F`), returns `audio/mpeg`; 501 when unconfigured so the client falls back | `TTS_RATE_LIMIT` (30) | 4 KB |
| `POST /api/transcribe` | `transcribe.js` | Gemini audio transcription (allowed mimes: webm, ogg, mp4, mpeg, wav) | `STT_RATE_LIMIT` (10) | 1.5 MB |
| any `/api/ping` | `ping.js` | 204 connectivity probe | none | none |

`api/_shared.js` provides `guard()` (CORS headers, OPTIONS 204, POST-only, origin allow-list, content-length cap, rate limit), `parseBody()`, `allowedOrigin(origin, host)` and `withinRateLimit()`.

- **Origin policy:** same-origin (`origin` host equals request `host`) always passes; otherwise the origin must appear in `QUESTION_CORS_ORIGINS` (comma-separated exact match). Requests with no `Origin` header pass.
- **Rate limit:** durable per-IP counter via Upstash Redis REST when `UPSTASH_REDIS_REST_URL`/`_TOKEN` (or `KV_REST_API_*`) are set, else a per-instance in-memory map capped at 10,000 IPs. Store failure -> 503.
- **Models:** tutor `GEMINI_MODEL` (default `gemini-2.5-pro`, `maxOutputTokens: 2048` because thinking tokens consume the budget), questions `QUESTION_MODEL` (default `gemini-2.5-flash`), transcription `STT_MODEL` (default `gemini-2.5-flash`).
- **Auth to Google:** `GEMINI_API_KEY`/`GOOGLE_API_KEY` (questions only) or Vertex via `GCP_PROJECT` + `GCP_LOCATION` + `GCP_SA_KEY` (single-line service-account JSON).
- The transcription prompt hardcodes "a Filipino Grade 6 student" regardless of the learner's grade.

## 10. Data model

Curriculum record (`src/curriculum/gradeN.json`, array):

```
{ grade, ref (e.g. "4MG-Ia-1"), domain, content_standard, competency, performance_standard,
  difficulty ('madali' | 'katamtaman' | 'mahirap'), game_tags: [...],
  explanation: { en, fil, taglish }, worked_example: { en, fil, taglish },
  items: [ { q: {en,fil,taglish}, answer, type: 'mcq'|'numeric'|'matching'|'true_false',
             options?, solution: {en,fil,taglish}, steps?, step_answers?, source: {...} } ],
  source_trace: { ... } }
```

Counts: Grade 4: 54 competencies / 591 items; Grade 5: 49 / 494; Grade 6: 52 / 486; total 155 / 1,571. Domains: Number and Algebra, Measurement and Geometry, Statistics and Probability.

**Translation state:** in every one of the 1,571 items `q.fil === q.en` (and likewise `taglish`), and in every one of the 155 competencies `explanation.fil === explanation.en`. The localized lesson text a learner sees comes from `lesson-teaching.js` rules and `i18n.js`, not from these fields.

## 11. IndexedDB keys

| Key | Value | Owner |
|---|---|---|
| `gabay:mastery:g{4|5|6}` | `{ [ref]: 0..1 }` | `mastery.js` |
| `gabay:dueAt:g{N}` | `{ _tick, [ref]: dueTick }` | `mastery.js` |
| `gabay:streak`, `gabay:lastAnswerDate` | number, `YYYY-MM-DD` | `mastery.js` |
| `gabay:history` | attempt array, cap 200 | `history.js` |
| `gabay:selectedGrade`, `gabay:studentName` | number, string | `App.jsx`, onboarding |
| `gabay:gamesPlayed` | count | `Games.jsx` |
| `pref:lang` | `en` \| `fil` \| `taglish` | `lang.js` |
| `gabay:question-rotation:v1:{grade}:{mode}:{scopeKey}` | `{ queue, last, poolSize, updatedAt }` | `question-session.js` |
| `tutor:{ref}:{lang}:{hash}` | `{ text, source }` | `tutor.js` |
| `tts:{lang}:{hash}` | cached audio | `speech.js` |
| sound prefs | mute/music flags | `sound.js` |

Legacy keys `gabay:mastery` and `gabay:dueAt` are migrated to Grade 6 on startup by `migrateMastery`.

## 12. PWA and caching

`vite.config.js`: `registerType: 'autoUpdate'`; Workbox precache glob `**/*.{js,css,html,json,png,svg,webp,wav,mp3,webmanifest}`; `maximumFileSizeToCacheInBytes` 4 MB; `navigateFallback: 'index.html'` with `/api/` denied; `cleanupOutdatedCaches`. `src/main.jsx` calls `registerSW({ immediate: true })` and force-updates on `onNeedRefresh`. Manifest: name Gabay, standalone, portrait, theme `#F7D26A`.

**Implication for local AI:** model weights (hundreds of MB) must be stored by the model runtime in Cache Storage or OPFS, not by Workbox precache. Confirm the precache glob and the 4 MB per-file limit never touch model files, and that the service worker does not intercept the model host.

## 13. Build and environment

- Static-only hosting needs `VITE_QUESTION_API_BASE` pointing at the host that serves `/api/*`, and that host must list the PWA origin in `QUESTION_CORS_ORIGINS`.
- A native-wrapper build would send origins like `capacitor://localhost` (iOS) or `https://localhost` (Android); add them to `QUESTION_CORS_ORIGINS` if that path is revived.
- `.env.example` documents every variable. `.env*` is gitignored except the example.
- `scripts/import-matatag-package.js` expects an external MATATAG package path (defaults to a `/private/tmp/...` location) and writes `src/curriculum/*.json`; `scripts/generate-content.js` writes a generated file for human review, never over curated content.

## 14. Testing

13 files in `test/`: content-loader, curriculum, filipino-shapes, history, lesson-teaching, progress, question-quality, question-session, questions-api, strip-markdown, topics, tutor-api, visual-assets. `tutor-api.test.js` and `questions-api.test.js` exercise the exported pure helpers. Run with `npm test`. There is no browser or device test suite; manual device testing is described in `docs/DEV_SETUP.md`.

## 15. Extension points for the local AI

| Change | Where |
|---|---|
| New provider (WebGPU model) | `src/lib/tutor.js`, between the Nano block and the `/api/tutor` block |
| Model runtime wrapper (load, generate, unload, availability) | new `src/lib/local-llm.js` (proposed) |
| Download/consent/progress UI | new screen or sheet, reachable from the Classroom "Ask" panel |
| Mode rules and post-processing | new `src/lib/tutor-modes.js` (proposed), used by every provider |
| Evaluation page | new hidden `src/screens/AiLab.jsx` (proposed) |
| Prompt parity | shared prompt builder imported by both `src/lib/tutor.js` and `api/tutor.js` (the API already imports from `src/lib`) |
| Service worker exclusion | `vite.config.js` Workbox config |
| Tests | `test/` (pure functions: mode post-processing, provider selection with injected fakes) |
