# Learning Modes — Kalma, Pakinig, Hakbang

Status: **CONFIRMED by the team lead on 2026-10-09** (definition table supplied as an image and transcribed below). **IMPLEMENTED (2026-10-10)**: mode picker (onboarding and Profile), mode-aware server prompt, rules enforced in code after the model replies (`src/lib/tutor-modes.js`), per-mode screens (`src/lib/mode-ui.js`, `src/styles/modes.css`) and per-mode voice, with tests. Not built: the Grade 1-3 unlock (section 6). Implementation details not in the table are marked *proposed*.

The project ships three accessibility-oriented learning modes. Each changes both the UI/UX and the local AI behaviour, so the same lesson can be taught in a way that fits different learners.

## 1. Definitions (confirmed)

| Mode | For | UI/UX changes | Local AI changes |
|---|---|---|---|
| **Kalma** (Calm / Focus) | ADHD, autism, sensory sensitivity | Plain background; no music, coins, doodles, or 3D; one question per screen; same layout every time | Replies capped at 2 short sentences; one idea per reply; calm, neutral tone; fewer questions per session (around 5) |
| **Pakinig** (Listen) | Dyslexia, low vision, weak readers | Large readable font; high contrast; wide spacing; auto read-aloud with word highlighting; voice answers | Replies written for speech: no symbols or markdown; "3/4" becomes "three fourths"; slower TTS; avoids items that only work visually |
| **Hakbang** (Step) | Dyscalculia, intellectual disability | Bigger StepScaffold; concrete visuals first (blocks, number lines); unlocks Grade 1 to 3 content | One step per reply, then a check question; simple words; concrete Filipino examples; question generation pulls from the `madali` tier and lower grades |

## 2. Wording and claims

- The "For" column describes the learners each mode is designed to support. It is **not** a diagnosis, screening, or clinical claim. The app does not diagnose and must never ask for or store a diagnosis.
- In the submission, pitch, and UI copy, say "designed to support learners who..." and avoid claims of treatment, therapy, or proven outcomes. Do not state efficacy figures that were not measured.
- Mode names follow the app language: English shows Calm, Listen, Step by Step; Tagalog and Taglish show the Filipino names Kalma, Pakinig, Hakbang. The ids stay `kalma`, `pakinig`, `hakbang` (stored preference, do not rename). A short gloss is shown under the name.
- Any learner may choose any mode; modes are preferences, not labels attached to the learner.

## 3. How modes relate to the rest of the app

- The tutor already has global rules (plain text, no markdown, guide step by step, short and warm, Filipino real-life examples, never just give the final answer). Modes are a tighter layer on top, not a replacement.
- Modes must apply to every tutor provider (on-device model, Gemini Nano, cloud `/api/tutor`, bundled explanation) so behaviour is consistent offline and online.
- Hard output rules are enforced **in code after generation**, not only in the prompt, because small on-device models follow format instructions unreliably (see `docs/DECISIONS.md` D-009).
- UI changes are driven by a single `mode` value (proposed: stored in IndexedDB as `pref:mode`, default none/standard) read by the screens, not by scattered flags.

## 4. Local AI behaviour per mode (enforcement)

| Mode | Prompt instruction (proposed) | Post-processing in code (proposed) |
|---|---|---|
| Kalma | Exactly two short sentences, one idea, calm neutral tone, at most one gentle question | Split into sentences, keep the first two, trim length, drop exclamation-heavy phrasing and emoji; session question count about 5 |
| Pakinig | Write for listening: words not symbols, short sentences | `stripMarkdown`; replace symbols and fractions with spoken words in the active language ("3/4" to "three fourths", "x" to "times", "=" to "equals", "%" to "percent"); remove emoji and bullets; set slower speech rate; avoid prompts that reference "the picture" or "the table" |
| Hakbang | Give only the next single step in simple words with a concrete Filipino example, then ask one check question | Keep one step plus one sentence ending in a question mark; if no question is present, append a templated check question in the active language; cap word length and sentence length |

All modes: remove `<think>...</think>` content, collapse whitespace, reject empty or off-topic replies, and fall through to the next provider when the result fails validation.

Proposed module `src/lib/tutor-modes.js`:

```
MODES = { kalma, pakinig, hakbang }          // id, labels per language, prompt fragment, ui flags
modePrompt(modeId, lang) -> string           // appended to the shared prompt
applyMode(modeId, lang, text) -> string      // pure, deterministic post-processing
```

Keep `applyMode` pure and unit-tested in `test/` with fixed inputs; it is the part that gives the guarantees. The server `api/tutor.js` should accept a validated `mode` field (allow-list) and reuse the same prompt fragment. The tutor cache key must include the mode.

## 5. UI/UX changes per mode (scope notes against the current code)

| Mode requirement | Where it lands | Notes |
|---|---|---|
| Plain background, no music, coins, doodles, or 3D (Kalma) | `App.jsx` (skip `startBgm`, hide `SoundToggle`), `Classroom.css` and screen decorations, `Classroom3D` entry hidden | `startBgm`/`pauseBgm` are in `sound.js`; 3D is lazy-loaded from `LessonBrief` via `onEnter3D`; "coins" and "doodles" need to be located in the screens and CSS |
| One question per screen; same layout every time (Kalma) | `Classroom.jsx` practice flow | Check how the current practice view is laid out before changing |
| Fewer questions per session, around 5 (Kalma) | `prepareQuestionSession` `count` (the lesson classroom already requests 5; games request more) | Games may need a cap or to be hidden in Kalma |
| Large font, high contrast, wide spacing (Pakinig) | A mode class on the root plus CSS variables in `index.css`/`theme.js` | |
| Auto read-aloud with word highlighting (Pakinig) | `speech.js` plus the reply and explanation components | `speechSynthesis` exposes word boundary events on some browsers; cloud Google TTS audio returns an MP3 without word timings, so highlighting there would need SSML marks or a timing estimate. Treat word-level highlighting as **uncertain** until prototyped |
| Voice answers (Pakinig) | `voicein.js`, `Classroom.jsx` answer input | The app already has voice questions for the tutor; voice answers to practice items are not confirmed to exist |
| Slower TTS (Pakinig) | `speech.js` rate | |
| Bigger StepScaffold; concrete visuals first (Hakbang) | `src/ui/StepScaffold.jsx`, `src/ui/LearningVisual.jsx`, `src/lib/visual-assets.js` | Blocks and number lines need assets; check what `visual-assets.js` already provides |
| Unlock Grade 1 to 3 content (Hakbang) | `src/lib/grades.js`, `content.js`, `content-catalog.js`, `api/*` validators | **Conflicts with the current Grades 4-6 scope** (see section 6) |
| Question generation from `madali` tier and lower grades (Hakbang) | `api/questions.js`, `src/lib/difficulty.js`, `question-session.js` | Curriculum records already carry `difficulty` (`madali`, `katamtaman`, `mahirap`) |

## 6. Consequence for scope: Grades 1-3

The current app deliberately bundles only Grades 4-6 (`src/lib/grades.js`, `docs/DECISIONS.md` D-002). Hakbang "unlocks Grade 1 to 3 content". The Grade 1-3 JSON files exist in `src/curriculum/` (about 13-16k lines each, 47 / 53 / 51 competencies per the import script's expected counts) but are not imported. To honour the confirmed mode definition without regressing the default experience:

- Load Grade 1-3 data lazily and only when Hakbang is active (dynamic `import`, as `content.js` already does for 4-6), so the default bundle does not grow.
- Update every place that assumes grades 4-6: `GRADES`/`isSupportedGrade`, the onboarding grade picker, mastery storage keys, `api/tutor.js` and `api/questions.js` validation (`isSupportedGrade`, `catalogByRef`), and `content-catalog.js`.
- Re-check the quality of the Grade 1-3 content before exposing it; earlier code comments say entries for Grade 1 needed repairs (the `COMPETENCY_REPAIRS` note in `curriculum-overrides.js`).
- Record the change as a decision (`D-014`) and update the PRD scope.

## 7. Time-boxing for the hackathon

Submission is due 10:00 AM on 2026-10-10 (`docs/HACKATHON.md`). Judges weight Local AI Implementation at 25%, so the mode behaviour that runs through the on-device model comes first.

1. **Must (supports the Local AI score):** `applyMode` post-processing and mode prompts for Kalma, Pakinig, Hakbang, with unit tests; mode selection stored and passed to the tutor; tutor cache key includes the mode.
2. **Should (visible in the demo, cheap):** Kalma UI (hide music, 3D, decorations) and Pakinig UI (large font, high contrast, slower speech); a visible mode switch.
3. **Could (larger):** word highlighting, voice answers to practice items, Hakbang visuals, Grade 1-3 unlock.
4. **Do not claim** any item in the table as shipped in the submission unless it works in the demo.

## 8. Evaluation

For the on-device model evaluation (`docs/LOCAL_AI.md` section 8), use about 30 prompts per mode. Score raw model output compliance (to learn how much post-processing the model needs) and post-processed compliance (must be 100%). A Filipino-reading reviewer should approve the spoken forms of symbols and fractions and the templated check questions.

## 9. Open questions

1. Where is the mode chosen (onboarding, Profile, a switch in the Classroom)? Can it change mid-lesson?
2. Do modes persist per learner on the device? (Proposed: yes, `pref:mode`.)
3. Exact templated check questions for Hakbang and spoken forms of math symbols in English, Tagalog, and Taglish (needs Filipino-reading review).
4. Games in Kalma: hide, simplify, or cap?
5. Is the Grade 1-3 unlock in scope for the hackathon, given the time?
