# Hiyang mockup: design notes

Companion to the clickable mockup in this folder. **Hiyang** is the mockup's wordmark and working name, with the tagline "Different modes for different disabilities." The project name is still undecided (`CLAUDE.md`).

- The design system and the UI specification for the three modes (tokens, contrast, sizes, accessibility rules) are in `docs/DESIGN.md`. That file is the source of truth for UI work.
- The mode definitions and the local AI enforcement rules are in `docs/TUTOR_MODES.md`.
- This file adds what those two do not cover: the layout of each mockup screen, each mode's sample copy, the Hakbang step sequence, and a file-level build map.

Live: https://hiyang-mockup.vercel.app (deep links `#setup`, `#kalma`, `#pakinig`, `#hakbang`, `#default`). Questions and Teacher Gabay replies are fixed samples, voice answers are simulated, and read-aloud uses the browser's built-in voice.

## Screens

### Mode setup (Profile tab)

Nova with the "Learning mode" title, a learner card ("Ana, Grade 4, set up by her teacher"), the tagline, four radio cards (Kalma, Pakinig, Hakbang, and a dashed "No mode" card), the note "A teacher or parent picks the mode. Ana only sees the mode's name.", a "Start practice" button, the sound toggle, and the bottom navigation with Profile active.

Any learner may choose any mode; modes are preferences, not labels (`docs/TUTOR_MODES.md` section 2). Where the mode is chosen in the real app is still open.

### Practice screen

Top to bottom, as in the practice tab of `src/screens/Classroom.jsx`:

1. Header: Exit chip, the mode chip (hidden in No mode), Offline badge.
2. Heading: learning-area chip, lesson title, one-line support text.
3. Tabs: Explanation, Example, Practice (active; the other tabs show a "mockup" notice).
4. Chalkboard panel: label and progress dots, the question, feedback after answering.
5. Answer card: hint line and answer field (Pakinig adds the mic).
6. Action row: primary button (Answer, then Next or Try again in the same spot) and the Nova help button.
7. Teacher Gabay panel, opened from Nova: guidance bubble, Listen again, Pause, Ask Teacher. Ask Teacher opens a question field with Mic and Ask, then a reply card labelled "On-device (offline)".

Sample item in No mode, Kalma and Pakinig: "Ana has 8 slices of bibingka. She ate 2 slices. What fraction of the bibingka is left?" Accepted answers: `3/4`, `6/8`, any equal fraction, `0.75`, "three fourths", "six eighths".

## Modes on screen, with sample copy

Exact sizes, colours and contrast ratios are in `docs/DESIGN.md` section 8.

### Kalma (Calm / Focus)

- Plain background with no doodles, sparkles, music, coins or 3D; flat chalkboard; lighter shadows.
- "Question 1 of 5" instead of "Quick Challenge".
- No "Correct!" flash and no shake on a wrong answer; every button stays in the same place.

| Moment | Text |
| --- | --- |
| Guidance | Read the question once. Take your time. |
| Ask Teacher reply | Start with 8 slices and take away the 2 Ana ate. Write what is left out of 8. |
| Correct | Correct. 6 out of 8 slices, or 3/4, are left. |
| Wrong | Not yet. Try once more. |

### Pakinig (Listen)

- Black question panel with large, widely spaced Atkinson Hyperlegible text.
- The question is read aloud when the screen opens, with the current word highlighted; Listen and Speed controls (`0.8×`, `0.65×`, `1×`) sit in the panel.
- Voice answer: a large mic button, then "Heard 'three fourths', so 3/4". Typing still works.
- A chip says when a picture-only question was skipped.

| Moment | Text |
| --- | --- |
| Guidance | I will read each question with you. Tap Listen again any time. |
| Ask Teacher reply | Ana started with eight slices and ate two. Count the slices that are left. Then say your answer as a fraction, like five eighths. |
| Correct (also spoken) | Correct. Three fourths of the bibingka is left. |
| Wrong | Not yet. Listen to the question again, then try. |

Voice engine (open): Kokoro (Apache-2.0) gives better English voices offline but has no Tagalog. Tagalog options are Meta's MMS-TTS Tagalog model (non-commercial licence) or the phone's own Filipino voice on Android.

### Hakbang (Step)

- Concrete visuals first: 8 bibingka tiles and a number line from 0 to 8 on the chalkboard, above the question.
- A lower-grade item, with "Grade 2 · Madali" and "Grades 1–3 unlocked" chips.
- A bigger step card replaces the answer card until the steps are done.

Item: "Ana has 8 slices of bibingka. She ate 2. How many slices are left?"

| Step | Prompt | Answer | What the visuals do | Teacher Gabay hint |
| --- | --- | --- | --- | --- |
| 1 | Count all the slices. How many are there? | 8 | Tiles get numbers 1 to 8 | Let's count the slices first. How many slices are there in all? |
| 2 | How many slices did Ana eat? | 2 | Tiles 7 and 8 turn dashed with a strike | Look at the story again. How many slices did Ana eat? |
| 3 | How many slices are left? | 6 | The number line hops back from 8 to 6 | Count the slices that are still there. How many are left? |

Wrong step: "Not yet. Count again, one slice at a time." Done: "Correct! 6 slices are left." with "8 take away 2 is 6."

### No mode (the app today)

Kept for comparison: drifting doodles, sparkles, "Quick Challenge", the full-screen "Correct!" flash, the shake on a wrong answer, and a long reply with every step, symbols and emoji.

## Build map

Where each mockup behaviour lands in the app, aligned with `docs/TUTOR_MODES.md` sections 4 to 7. Port the mode rules onto the real classes and CSS variables; do not copy this folder's `!important` overrides or `gabay-classroom.css` into the app (`docs/DESIGN.md` section 9).

| Area | Change |
| --- | --- |
| `src/lib/tutor-modes.js` (proposed) | `MODES`, `modePrompt(modeId, lang)` and a pure `applyMode(modeId, lang, text)`, unit-tested in `test/`. |
| Storage | `pref:mode` in IndexedDB through `idb-keyval`, default none. |
| `App.jsx` | Load the mode and pass it to the screens. Kalma skips `startBgm` and hides `SoundToggle`. |
| `Progress.jsx` (Profile) | Mode picker, as on the setup screen. |
| `Classroom.jsx` | Kalma: skip `showCorrectOverlay` and `answer-shake`, show the question count. Pakinig: word-highlighted read-aloud of the question and a voice answer. Hakbang: render the visuals and always go through `StepScaffold`. |
| `StepScaffold.jsx`, `LearningVisual.jsx`, `visual-assets.js` | Large step card; blocks and number line. |
| `speech.js` | Rate `0.8` in Pakinig (now `0.95`); word-boundary callback for highlighting. |
| `src/lib/tutor.js` and `api/tutor.js` | Append `modePrompt()` in both copies of `gabayPrompt()` and keep them in sync. The server accepts an allow-listed `mode` field, never a client-written instruction. The tutor cache key includes the mode. |
| `question-session.js`, `api/questions.js`, `grades.js` | Hakbang: `madali` tier, plus Grade 1 to 3 content loaded lazily and only in Hakbang (`docs/TUTOR_MODES.md` section 6). |
| `LessonBrief.jsx`, `Games.jsx` | Kalma hides the 3D classroom entry and coins. |

## Files in this folder

| File | What it is |
| --- | --- |
| `index.html` | Page shell: header, mode buttons, phone frame, notes card |
| `app.js` | Screens, sample content, answer checks, read-aloud with word highlighting, simulated mic |
| `gabay-base.css` | Gabay tokens, `gb-card`, `gb-btn`, `gb-chip`, phone frame (adapted from `src/index.css`) |
| `gabay-classroom.css` | Copy of `src/screens/Classroom.css`, unchanged |
| `modes.css` | Page around the phone, setup screen, and each mode's overrides |
| `assets/nova.png`, `assets/bg-tile.png` | Gabay's mascot and doodle tile |

The live site is the Vercel project `hiyang-mockup` (scope `riecodes-projects`). To redeploy from this folder, link it once with `vercel link --yes --project hiyang-mockup`, then run `vercel deploy --prod --yes` (`.vercel` is gitignored). The styles, Nova and the doodle tile come from the pre-existing Gabay app; disclose them with the rest of the base project (`docs/SUBMISSION.md`).

## Open decisions

- Project name: Hiyang, Akma ("fitting"), Sari ("variety"), or another.
- Voice engine for Pakinig: Kokoro for English, and which Tagalog option.
- Where the mode is chosen and whether it can change mid-lesson (`docs/TUTOR_MODES.md` section 9).
