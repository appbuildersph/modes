# Design System — current state and mode specification

Status: 2026-10-10. Written by reading the code in this repo (`tailwind.config.js`, `src/index.css`, `src/ui/*`, `src/screens/*.css`, `index.html`) and the Hiyang mockup (`mockups/hiyang/`). Contrast ratios were calculated with the WCAG formula from the hex values in the code; they were not measured on a device. Anything a person has not looked at on the real iPhone 13 is marked **unverified**. Section 8 is the specification for the three learning modes; the rest describes what exists today.

**Two design files; the mockup notes take precedence.** `mockups/hiyang/DESIGN.md` (added by `rieCodes`, commits `a3e1cca` and `2f16a11`, pushed after this file) is the team's newest design direction. Wherever it differs from this file, follow it: the layout of each mockup screen, the sample copy for each mode, the Hakbang step sequence, the build map, and the open decisions (project name candidates, Pakinig voice engine, where the mode is chosen). It also has the live mockup (https://hiyang-mockup.vercel.app, deep links `#setup`, `#kalma`, `#pakinig`, `#hakbang`, `#default`). The mockup notes themselves hand exact sizes, colors and contrast ratios to this file, so the tokens, components, accessibility audit, and per-mode values stay here. If the mockup notes change, update the matching lines here instead of keeping two versions, and link rather than copy values.

Target device (D-017): an iPhone 13 (390 x 844 pt screen) running the app as an installed Home Screen PWA, portrait. Since D-018 the phone is a client of the edge AI hub; the Mac's own browser at `http://localhost:8787` is the offline demo surface.

## 1. Principles (as practised in the code)

1. **Friendly neo-brutalist.** Thick dark outlines, hard offset shadows, rounded pills, flat pastel fills. Playful but legible.
2. **One mascot, one voice.** The mascot image is "Nova" (`src/assets/nova.png`, alt text "Nova"); the tutor persona is "Teacher". Replies are warm, short, plain text.
3. **Drawn, not emoji.** Icons and doodles are inline SVG with the same outline color, so they survive text or emoji stripping (comment in `Primitives.jsx`).
4. **Mobile column first.** A phone-width column (max 440 px). On screens 500 px and wider the app sits inside a decorative phone frame; on a real phone the frame wrappers are transparent.
5. **Offline-safe visuals.** Everything shown must work with the network off. Fonts are the known exception (section 7).
6. **Three languages.** Every learner-facing string exists in English, Tagalog and Taglish and goes through `t()`.

## 2. Color

All colors are CSS variables on `:root` in `src/index.css`. Tailwind aliases (`tailwind.config.js`): `cream` = background, `mint` = secondary, `sky`, `rose`, `peach`, `yellow` = primary, `lavender`, `ink`, `outline`. Do not hardcode hex values in components; use the variables.

| Token | Hex | Use |
|---|---|---|
| `--gb-background` | `#fbf1da` | Page background (cream), with a faint dot grid |
| `--gb-surface` / `--gb-surface-strong` | `#fffaf0` / `#ffffff` | Cards and panels |
| `--gb-primary` (yellow) | `#f7d26a` | Primary buttons, active nav, badges; `-hover #e5b943`, `-soft #fff0ba`, `-dark #9b6810` |
| `--gb-secondary` (mint) | `#8fd9b6` | Positive actions, success surfaces; `-hover #70c99f`, `-soft #dff4eb`, `-dark #245d54` |
| `--gb-sky` | `#a9d8f0` | Info, accents |
| `--gb-rose` | `#f4c3d0` | Lowest mastery band, soft error, `-soft #f9e5e2` |
| `--gb-peach` | `#f4a87c` | Accents, middle band area; `-hover #e99162` |
| `--gb-lavender` | `#cdbcec` | Accents; `-soft #eee8fa`, `-dark #725bb6` |
| `--gb-ink` | `#3a2e2a` | Text |
| `--gb-muted` | `#62564e` | Secondary text |
| `--gb-outline` | `#1c1410` | Every border and hard shadow |
| `--gb-divider` | `#dfd0ba` | Rules |
| `--gb-success` / `--gb-info` / `--gb-danger` | `#25765b` / `#237ca6` / `#c0414b` | Status text |
| `--gb-focus` | `#237ca6` | Focus ring color |
| `--gb-disabled-bg` / `-text` | `#e7edf3` / `#596473` | Disabled controls |

**Mastery bands** (`masteryColor` in `src/lib/mastery.js`): below 40% red (rose), 40-69% orange (`#f7b955` bar fill), 70% and up green (mint). Bands also carry a translated text label (`band.*` in `i18n.js`), so color is not the only signal.

### Contrast (calculated from the hex values)

| Pair | Ratio | WCAG AA for normal text (4.5:1) |
|---|---|---|
| ink on background | 11.7 | pass |
| ink on white | 13.1 | pass |
| ink on yellow / mint / peach / sky / rose / lavender | 9.0 / 8.0 / 6.7 / 8.6 / 8.5 / 7.5 | pass |
| muted `#62564e` on background | 6.3 | pass |
| danger / success / info on white | 5.1 / 5.5 / 4.7 | pass |
| disabled text on disabled bg | 5.1 | pass |
| **Inactive bottom-nav label (ink at 55%) on white** | **3.3** | **fails** (13 px bold text) |
| **ink at 60% on white** (e.g. small captions) | **3.8** | **fails** |
| ink at 60% on cream (`.reply-source`-style captions) | 3.6 | fails |
| ink at 70% on cream | 4.8 | pass |

Rule: secondary text may use `--gb-muted` or ink at 70% or more, never ink below 70% at small sizes.

## 3. Typography

- Display: **Baloo 2** (500-800), fallback Fredoka then system sans. Used for headings, buttons, chips, step prompts (`font-display`).
- Body: **Nunito** (400-800), fallback system sans.
- Loaded from Google Fonts in `index.html` with `display=swap`. **They are not precached**: offline, the app falls back to system fonts (see section 7).
- Headings `h1`-`h3` default to Baloo 2 in the ink color. Typical sizes in components: chips 14 px (`text-sm`) or 12 px, nav labels 13 px extra-bold, step prompt 18 px (`text-lg`), body 16 px. Minimum observed text is 12 px (chips, captions).
- Emphasis inside copy uses `**bold**` markup rendered by `RichText`. Tutor replies must not use markdown (they pass through `stripMarkdown`).

## 4. Shape, depth, spacing, motion

- **Border:** 2.5 px solid `--gb-outline` on cards, buttons, chips, inputs (`borderWidth` 2.5 in Tailwind). Thinner 2 px is used for secondary callouts.
- **Radius:** cards 24 px (`rounded-card`), buttons and chips fully round (pill), mascot bubbles with a rotated square tail.
- **Shadow:** hard offsets, no blur: `shadow-hard-sm` 2 px, `shadow-hard` 4 px, `shadow-hard-lg` 6 px, all in the outline color. Pressed state moves the element 2 px and shrinks the shadow (`active:translate-x-[2px]`).
- **Layout:** `.gb-shell` is a single column, `max-width: 440px`, centered. The bottom nav is `fixed`, `max-w-[430px]`. Side padding is typically 16-20 px (`px-5`).
- **Safe areas:** `viewport-fit=cover` is set. Splash, Home, and the floating sound toggle use `env(safe-area-inset-*)`. **The bottom nav does not add `safe-area-inset-bottom` padding** (`BottomNav.jsx`), so on an iPhone 13 in standalone mode the labels may sit close to the home indicator. **Unverified on device; check it first.**
- **Motion:** about 17 named keyframes (pop, float, Nova idle/correct/wrong, answer shake, doodle drift, classroom entrances). `prefers-reduced-motion: reduce` is handled in `index.css` and in `Classroom.css`, `TopicPicker.css`, `LessonBrief.css`, `Progress.css`, and `Home.css`. Whether every keyframe is covered has not been audited.
- **Shared motion layer (`src/lib/motion.js`, `src/styles/motion.css`):** one spring for the whole app (a damped spring sampled into a CSS `linear()` easing by `springEasing`, falling back to `--gb-spring`, `cubic-bezier(0.34, 1.56, 0.64, 1)`, where `linear()` is unsupported), installed once in `main.jsx` and needing no per-screen code. Every pressable element (buttons, links, tabs, choice labels, ARIA roles) squashes on press and springs back on release. Every screen bounces in when it mounts, with its top-level sections staggered; the splash gets a larger first entrance, and the bottom nav springs up from below. In-screen swaps (onboarding steps, next question), dialogs, and late-loading cards pop in. Kalma gets soft fades with no overshoot or stagger; reduced motion turns all of it off. It uses the Web Animations API on the individual `scale`/`translate` properties, so it stacks with existing `transform` keyframes. Elements with their own CSS entrance only get a fade, so nothing double-pops, and a release always springs from wherever the squash had got to. Button `transition`s keep their own easing: a spring there also overshoots box-shadow and made hard-shadow buttons jitter. Opt an element out with `data-no-motion`.
- **Sound:** buttons play a click (`playButtonSfx`), music via `startBgm`; a floating `SoundToggle` mutes both. The splash button starts audio (needed for browser autoplay rules).

## 5. Iconography and imagery

- Inline SVG line icons, 24 px viewBox, 2.2 px stroke in `--gb-outline`, no fill unless meaningful (`BottomNav.jsx`, `Icons.jsx`, `SoundToggle.jsx`). All are `aria-hidden`; the control carries the label.
- Decorative SVG doodles (`Sparkle`, `Cloud`, `Plant`, `Doodles`) at 60-70% opacity, `pointer-events-none`.
- Illustrations in `public/` (home, game, review images, splash background, `og.png`) and 3D classroom textures in `textures/`. Origins and licenses of these assets are not documented yet (needed for the submission disclosure; see `docs/SUBMISSION.md`).
- Icons for the PWA: `nova.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `mascot.svg`. There is **no `apple-touch-icon` link and no `apple-mobile-web-app-*` meta** in the source `index.html`; the Home Screen icon and standalone behaviour on iOS are **unverified on device**.

## 6. Components

| Component | File | Notes |
|---|---|---|
| `.gb-card`, `.gb-btn`, `.gb-chip` | `src/index.css` (`@layer components`) | The three base surfaces; every other component composes them |
| `Button`, `Card`, `Chip` | `src/ui/Primitives.jsx` | Color props: yellow, mint, sky, rose, peach, lavender, white. Button plays a click sound |
| `RefBadge` | `Primitives.jsx` | Yellow chip with the learner-friendly learning-area name (never the code) |
| `MasteryBar` | `Primitives.jsx` | 16 px pill bar, outlined, colored by band |
| `RichText` | `Primitives.jsx` | Renders `**bold**` |
| `Mascot`, `SpeechBubble` | `src/ui/Mascot.jsx` | Nova image (optional `gb-float`); white card bubble with tail, mint ring while speaking |
| `StepScaffold` | `src/ui/StepScaffold.jsx` | One step at a time: counter, prompt, numeric input (decimal keypad), Answer button, shake on a wrong answer, `Enter` submits. This is the base for Hakbang |
| `BottomNav` | `src/ui/BottomNav.jsx` | 4 tabs (Lessons, Practice, Games, Profile), min 56 px tall, active tab yellow with hard shadow |
| `SoundToggle` | `src/ui/SoundToggle.jsx` | 44 px round floating button (`aria-pressed`), anchored to the app column |
| `OnlineBadge`, `LessonIcon`, `LearningVisual`, `Icons` | `src/ui/` | Connectivity chip, lesson glyphs, visual aids (`src/lib/visual-assets.js`), icon set |
| Screens | `src/screens/*.jsx` plus per-screen `.css` (about 6,300 lines of CSS) | Splash, Onboarding, Lessons, TopicPicker, LessonBrief, Classroom, Classroom3D, Generating, Progress, Games. `Home.jsx` and `StartChoice.jsx` exist but `App.jsx` does not use them |

Interaction targets seen in code: nav tabs `min-h-[56px]`, several controls `min-h-[44px]` to `min-h-[52px]`, sound toggle 44 x 44 px. Practice and Pakinig-style large targets do not exist yet.

## 7. Accessibility and offline: audit of today

**Present:** `aria-label` (41 uses), `aria-hidden` on decorative SVG (100), `aria-pressed`, `aria-expanded`, `aria-labelledby`, `role="progressbar"` with values (5), visible `:focus-visible` rules in `index.css` and most screens, color plus text labels for mastery bands, spoken replies (`speak`), voice input, trilingual UI, reduced-motion handling.

**Findings, with a recommended fix each (none applied):**

| # | Finding | Why it matters | Fix |
|---|---|---|---|
| 1 | `index.html` viewport is `maximum-scale=1.0, user-scalable=no` | Blocks pinch zoom; hurts low-vision learners (Pakinig's target) | Remove those two parameters (iOS ignores `user-scalable=no` in recent versions, but do not rely on that) |
| 2 | Inactive nav labels and other `ink/55` and `ink/60` text are 3.3 to 3.8 : 1 | Fails AA | Use `--gb-muted` or ink at 70% or more |
| 3 | Fonts load from Google Fonts only | Offline, headings and body fall back to system fonts, so the offline look differs from the online look | Self-host Baloo 2, Nunito (and Atkinson Hyperlegible for Pakinig) as woff2 under `public/fonts` and let Workbox precache them; subset to keep size small |
| 4 | Bottom nav ignores `safe-area-inset-bottom` | Overlap with the iPhone home indicator in standalone mode (unverified) | Add `padding-bottom: max(0.375rem, env(safe-area-inset-bottom))` to the nav; adjust the sound toggle offset that assumes 76 px |
| 5 | No `apple-touch-icon` or iOS web-app meta | Home Screen icon and splash may not match on iOS (unverified) | Add `apple-touch-icon` (180 x 180) and `apple-mobile-web-app-capable`, `-title`, `-status-bar-style` |
| 6 | 10 uses of `outline: none` / `outline-none` | Some inputs rely on a background change for focus | Confirm each has a visible `:focus-visible` replacement |
| 7 | `html lang="fil"` is static while the UI can be English | Screen readers pick the wrong voice | Set `document.documentElement.lang` from the language setting (`en`, `fil`; Taglish maps to `fil`) |
| 8 | Several interactive controls are under 44 x 44 pt | Hard for motor-impaired and young learners | Raise to at least 44 pt, 56 pt in Pakinig and Hakbang |

## 8. Learning modes: design specification

Confirmed definitions: `docs/TUTOR_MODES.md` section 1. Visual reference: the static **Hiyang mockup** (`mockups/hiyang/index.html`, a mockup of the math practice screen with sample content; no live AI). The classroom styles adapt the app's `src/screens/Classroom.css`, base CSS is adapted from `src/index.css`, and `modes.css` adds the three modes. Screen-by-screen layout, sample copy and the Hakbang step table are in `mockups/hiyang/DESIGN.md`, which takes precedence over this section where they differ. The mockup is not integrated into the app. Hiyang is the mockup's wordmark; the project name is undecided.

### 8.1 Mechanism

- Store the mode as a preference (proposed key `pref:mode`, values `none | kalma | pakinig | hakbang`, default `none`).
- Apply it as a class on the screen root (the mockup uses `mode-kalma`, `mode-pakinig`, `mode-hakbang` on `.classroom-page`) or a `data-mode` attribute on `#root`. Prefer overriding CSS variables over `!important`; the mockup uses `!important` heavily because it patches a copy of the app CSS, which should not be carried into the app.
- The mode setup screen (the mockup's Profile tab "Mode setup": a vertical list of mode cards with an icon tile, name, gloss, one line of description and a radio, plus a dashed "No mode" card) is the proposed place to choose a mode.
- **Who picks the mode (mockup proposal, not confirmed for the app):** the mockup's setup screen shows a learner card ("Ana, Grade 4, set up by her teacher") and the note "A teacher or parent picks the mode. Ana only sees the mode's name." Whether the mode is chosen by an adult, by the learner, or both, and whether it can change mid-lesson, is still open (`docs/TUTOR_MODES.md` section 9). Any learner may use any mode.
- Describe each mode as designed to support certain learners. Never label the learner or ask for a diagnosis.

### 8.2 Kalma (calm / focus)

| Aspect | Spec (confirmed) | Values seen in the mockup |
|---|---|---|
| Background | Plain, no music, coins, doodles or 3D | `background-image: none`; no `::before/::after` decorations; no animation; panel `--gb-secondary-dark` `#245d54` with cream text (cream on `#245d54` is 6.8 : 1; cream at 88% 5.6 : 1) |
| Layout | One question per screen; the same layout every time | Shadows reduced to 3 px; every button stays in the same place; no celebration flash or shaking |
| Count | Around 5 questions per session | `kalma-count` label |
| Sound | No music (confirmed). Off by default and hide the control (proposed) | Not shown in the mockup. Proposed: do not call `startBgm`; hide `SoundToggle` |
| Reply | Max 2 short sentences, one idea, calm neutral tone | See `docs/TUTOR_MODES.md` |

### 8.3 Pakinig (listen)

| Aspect | Spec (confirmed) | Values seen in the mockup |
|---|---|---|
| Type | Large readable font, high contrast, wide spacing | Atkinson Hyperlegible 700, question 1.85 rem, line-height 1.7, letter-spacing 0.03 em, word-spacing 0.22 em; title 2.5 rem; replies 1.3 rem |
| Contrast | High | Panel `#111`, text `#fff7cc` (17.5 : 1); highlight `--gb-primary` with outline-color text (12.4 : 1) |
| Read-aloud | Auto read aloud with word highlighting | `.w` / `.w.on` spans highlight the current word; reads on screen open; Listen again, pause/play, and speed `0.8x`, `0.65x`, `1x` (today's `speech.js` rate is `0.95`, so Pakinig needs a slower default of about `0.8`) |
| Answers | Voice answers | A 96 px round mic button (`p-mic`) with a pulsing active state, a large label, and a typing fallback; voice answers are simulated in the mockup |
| Controls | Large | Answer input 1.45 rem, min height 4 rem; primary button 1.4 rem, min height 4.2 rem; icon buttons 3 rem |
| Reply | No symbols or markdown; "3/4" is "three fourths"; slower TTS; avoids visual-only items | See `docs/TUTOR_MODES.md` |

Voice engine for Pakinig is an open decision recorded in the mockup notes: Kokoro (Apache-2.0) gives better English voices offline but has no Tagalog; Tagalog options are Meta's MMS-TTS Tagalog model (non-commercial licence, which matters for a submission) or the phone's own Filipino voice (availability on the iPhone 13 unverified). Any engine chosen must be disclosed in `docs/SUBMISSION.md`.

Implementation notes: word highlighting needs word boundary events. `speechSynthesis` provides them on some browsers; the Google Cloud TTS audio (`/api/tts`) returns MP3 with no word timings, so highlighting there needs SSML marks or a timing estimate. **Uncertain until prototyped on the iPhone.** The Atkinson Hyperlegible font must be self-hosted to work offline (finding 3).

### 8.4 Hakbang (step)

| Aspect | Spec (confirmed) | Values seen in the mockup |
|---|---|---|
| Scaffold | Bigger StepScaffold | `h-scaffold`: padding 1.2 rem, prompt 1.6 rem / weight 800, input 1.6 rem, answer button 1.3 rem and min height 4 rem, help button with Nova 3.6 rem |
| Visuals | Concrete visuals first (blocks, number lines) | 4-column grid of block tiles (`h-tile`, yellow, 2.5 px outline); "eaten" tiles are dashed with a rose strike line; an SVG number line with jump arcs and a dot; question text 1.45 rem |
| Content | Unlocks Grade 1 to 3 content | Shown as "Grade 2 / Madali" and "Grades 1-3 unlocked" chips on a lower-grade sample item; the real unlock is not built (`docs/TUTOR_MODES.md` section 6). The three-step sample (count 8, ate 2, left 6) with the visuals changing per step is in `mockups/hiyang/DESIGN.md` |
| Reply | One step, then a check question; simple words; concrete Filipino examples | See `docs/TUTOR_MODES.md` |

Contrast note from the mockup: the dashed "eaten" tile text (cream at 60% on `#245d54`) is 3.6 : 1; raise it for text, or rely on the strike line plus a label.

### 8.5 Mockup versus app: what exists and where it lands

Not in the app yet: mode selection and storage (`pref:mode`); the setup screen; the `mode-*` styles; word-highlighted read-aloud; the voice-answer mic; block tiles and number-line visuals; the Kalma question counter; the Grade 1-3 unlock.

Existing app pieces to build on, with the touch points verified in the code:

| Mode behaviour | Where it lands today |
|---|---|
| Kalma hides the 3D classroom entry | `LessonBrief.jsx` renders the 3D button (`onEnter3D`, line 60) |
| Kalma hides coins | `Games.jsx` keeps a `coins` count and plays the `coin` sound; a coins chip shows during play |
| Kalma has no celebration flash or shake | `Classroom.jsx` (`showCorrectOverlay`) and the `answer-shake` class on `StepScaffold` |
| Kalma has no music and no sound control | `App.jsx` (`startBgm`) and `SoundToggle` |
| Pakinig slower speech and word highlighting | `speech.js` (`u.rate = 0.95`; no word-boundary callback yet) |
| Pakinig voice answers | `voicein.js` and the answer input in `Classroom.jsx` |
| Hakbang bigger step card and visuals | `StepScaffold.jsx`, `LearningVisual.jsx`, `visual-assets.js` |

The full file-by-file build map is in `mockups/hiyang/DESIGN.md` ("Build map"); it matches this table and `docs/TUTOR_MODES.md` sections 4 to 7.

## 9. Rules for AI sessions changing the UI

1. Use the CSS variables and the existing `gb-*` classes; do not introduce new hex values or a second component style.
2. Keep SVG icons drawn in the outline color; no emoji in the UI.
3. Every new string goes into `i18n.js` in all three languages. Do not add English-only labels.
4. Keep tap targets at least 44 pt (56 pt in Pakinig and Hakbang). Keep text contrast at 4.5 : 1 or better; do not use ink below 70% for small text.
5. Honour `prefers-reduced-motion` for every new animation; Kalma shows no decorative animation at all.
6. Do not add network-dependent visuals (remote fonts or images) without a bundled fallback; the app must look right offline.
7. Do not copy the Hiyang mockup's `!important` overrides or its duplicated classroom CSS into the app; port the mode rules onto the real classes and variables.
8. Test layout at 390 x 844 pt, portrait, standalone, with the network off. The simulator is not evidence for iPhone behaviour.
9. No clinical or efficacy wording in any UI copy (see `docs/TUTOR_MODES.md` section 2).

## 10. Open questions

1. Where is the mode chosen, and can it change mid-lesson?
2. Does Kalma hide the Games tab, or simplify the games?
3. Are the Atkinson Hyperlegible font and the other fonts allowed to be bundled (license: they are open fonts, but the files must be added and their licenses listed in the submission)?
4. What are the origins and licenses of the illustrations, textures, and sound effects?
5. Project name: the mockup notes list Hiyang, Akma ("fitting"), Sari ("variety"), or another. Decided 2026-10-10: the app is **SIBOL** (Student-centered Inclusive Bilingual Offline Learning), with a sprout logo as the app icon and the tutor named Teacher Gabo (commits `520d58e`, `88b176d`). Storage keys were not renamed.
6. Voice engine for Pakinig (Kokoro for English, which Tagalog option) and its license.
7. Is dark mode wanted? None exists (`color-scheme: light`); Pakinig's dark panel is mode-specific.

## 11. Source map

| Topic | Files |
|---|---|
| Tokens, base components, motion, phone frame | `src/index.css`, `tailwind.config.js` |
| Shared UI | `src/ui/Primitives.jsx`, `Mascot.jsx`, `StepScaffold.jsx`, `BottomNav.jsx`, `SoundToggle.jsx`, `Icons.jsx` |
| Screens and their styles | `src/screens/*.jsx`, `*.css` |
| Fonts and meta | `index.html` |
| 3D classroom theme | `src/lib/theme.js` (`pref:theme3d`, default `classic`), `src/three/scene.js` (`THEMES`, `THEME_LIST`) |
| Mode mockup | `mockups/hiyang/` (`index.html`, `app.js`, `modes.css`, `classroom.css`, `base.css`) and its notes `mockups/hiyang/DESIGN.md` |
| Mode definitions | `docs/TUTOR_MODES.md` |
