# Submission Draft — AppBuildersPH Hackathon 2026

Status: DRAFT, 2026-10-09. Submission deadline: **10:00 AM, October 10, 2026, no extensions, one submission, no edits.** Submit on the Cerebral Valley event page (see `docs/HACKATHON.md`). Everything marked TBD must be filled with facts that are true at submission time. Do not write a claim here that has not been verified; a wrong disclosure is worse than a missing feature (fake benchmarks and pre-existing projects are dispute grounds).

## 1. Project

| Field | Value |
|---|---|
| Project name | **UNDECIDED.** The team has not chosen the submission name. The code, UI, and storage keys currently say "Gabay" (and the mascot is "Teacher Gabay"); that is the existing app's name, not a confirmed project name. Decide before submitting, since the name is typed once into the form |
| Short description | Offline AI math companion for Filipino Grade 4-6 learners, with Teacher Gabay tutoring on the learner's own device. (TBD: update once the on-device model works) |
| Team name and members | Team CrossCampus. Names must match the official list on appbuildersph.com/hackathon exactly. TBD: confirm who is registered and present |
| Public GitHub repository | `https://github.com/appbuildersph/modes` (origin of this checkout; confirm it is the repository to submit and that it is **public** before 10:00 AM) |
| Demo video | TBD (ideally about 1 minute) |
| X / LinkedIn post URL | TBD (tag Devin / Cognition, include `#AppBuildersPH`) |

## 2. Why does this product benefit from running AI locally? (required answer)

Draft, to be tightened after the demo works:

> Gabay is built for learners with unreliable or no internet, and for children whose questions should not need to leave the device. A cloud-only tutor fails exactly when a learner in a low-connectivity home or classroom needs it, costs per question, and sends a child's typed or spoken questions to a server. Running the tutor model on the device lets Teacher Gabay answer a math question with the network off, with no per-question cost, lower waiting once the model is loaded, and no learner text leaving the phone or laptop. Cloud AI stays as an optional upgrade, not a requirement.

Facts that back this and are true today: the learning loop already works offline from the service-worker cache and IndexedDB; there are no accounts; credentials are server-side only. Facts that are NOT yet true and must not be claimed until verified: that an open-source model runs on-device in the demo; any speed, size, or quality number; iPhone support.

### Learning modes (confirmed; describe only what works in the demo)

The project has three modes, Kalma (calm/focus), Pakinig (listen), and Hakbang (step), that change both the interface and how the on-device AI replies (`docs/TUTOR_MODES.md`). In the submission and pitch, describe them as designed to support learners with different needs. Do not make clinical, therapeutic, or efficacy claims, and do not list a mode feature as shipped unless it works live.

## 3. Disclosures (required)

### What runs locally

| Item | Status |
|---|---|
| Learning loop (lessons, practice, answer checking, mastery, history, streak) | Runs locally today (not AI) |
| On-device open-source LLM tutor replies | TBD: model, runtime, device. Fill in only after it runs |
| Fallback: Chrome built-in Gemini Nano via Prompt API | Existing code; runs locally on supported Chrome setups only |
| Fallback: on-device speech synthesis (`speechSynthesis`) and Web Speech recognition | Browser-provided; local depending on browser and OS |
| Bundled curriculum and explanations | Local |

### What requires internet

| Item | Needed for |
|---|---|
| Cloud Gemini tutor (`/api/tutor`) | Tutor replies when no on-device model is available (optional) |
| Adaptive AI question generation and verification (`/api/questions`) | AI-generated practice sessions (optional; bundled rotation is the offline floor) |
| Google Cloud Text-to-Speech (`/api/tts`) | Natural Filipino voice (optional; `speechSynthesis` floor) |
| Gemini transcription (`/api/transcribe`) | Spoken questions (optional; Web Speech or typing floor) |
| First model download | One-time download of the model weights, if the model is not bundled |
| First app load | Install the PWA and precache the shell |

### Models used

**UNDECIDED.** The on-device model has not been chosen; do not submit a name here until it is chosen and verified to run. List every model with exact name, size, quantization, license, and source. Candidates under evaluation: Gemma 3 1B IT, Qwen3-0.6B / 1.7B (see `docs/LOCAL_AI.md`). Existing cloud models used by the pre-existing server code: Gemini (`gemini-2.5-pro` for the tutor, `gemini-2.5-flash` for questions and transcription by default).

### Technologies and frameworks

React 19, Vite 6, Tailwind CSS 3, vite-plugin-pwa (Workbox), idb-keyval (IndexedDB), Three.js, `@google/genai`, `@google-cloud/text-to-speech`, Node serverless functions, `node --test`, Playwright and sharp (tooling). Local AI runtime: TBD (WebLLM / WebGPU is the leading option).

### APIs and cloud services

Google Vertex AI / Gemini API, Google Cloud Text-to-Speech, optional Upstash Redis (rate limiting), a serverless host for `api/` (TBD which). Hugging Face (model weights hosting) if used.

### Existing code and assets (MUST be stated plainly)

> Gabay existed before this hackathon. The application base (React PWA, DepEd MATATAG Grades 4-6 curriculum data, mastery tracking, 3D classroom, mini-games, cloud tutor/question/speech endpoints, tests, and printable resources) was developed in the `CrossCampus` repository between 2026-06-23 and 2026-08-22 (139 commits). This repository's initial 10 commits, dated 2026-10-09 22:45-22:56 (+0800), import and clean up that existing code. The work built during the hackathon, starting 2:30 PM on October 9, is: TBD (list precisely from the git history, for example: on-device open-source model provider, model download and persistence handling, tutor mode post-processing, AI Lab evaluation page, tests, documentation).

Also disclose: curriculum content derived from the DepEd MATATAG package (see `source_trace` fields), textures, illustrations, sound effects, and fonts in `public/` and `textures/` and their origins and licenses (TBD: confirm origin of each asset set; some may have been AI-generated).

### AI development tools

Claude Code (Anthropic) was used for planning, documentation, and code assistance in this session. TBD: list every other AI tool used by the team (for example Devin, others) and for what.

## 4. Repository requirements (judges recreate it from the repo)

- [ ] Repository is **public** before 10:00 AM Oct 10.
- [ ] `README.md` exists (this repo has none yet) with: what it is, why local AI, architecture, how to install and run, how to download or provide the model, how to test offline, hardware and browser requirements (device, OS version, browser), known limitations, and the existing-code disclosure.
- [ ] Instructions work from a clean clone (`npm install`, `npm run dev`); verified by someone following them.
- [ ] No secrets committed (`.env` is gitignored; check history with a search before the repo goes public).
- [ ] Licenses for code, assets, and the model are stated.
- [ ] Hackathon commits are real, descriptive, and dated after 2:30 PM Oct 9.
- [ ] No commits after 10:00 AM Oct 10.

## 5. Demo video outline (about 1 minute)

1. One line: who it is for and the problem (no reliable internet).
2. Show network off (airplane mode or disabled Wi-Fi) on screen.
3. Open the app, show a lesson.
4. Ask Teacher Gabay a question; the reply appears, labelled as on-device.
5. Show one more capability (spoken reply, a tutor mode).
6. One line on what is local versus optional cloud.
Record on the device that will be used in the live pitch. Do not show results that were not obtained live.

## 6. Pitch outline (finalists, 5 minutes + 3 Q&A)

Problem and user (30s) -> live offline demo (2.5 min) -> how local AI works and why it matters (1 min) -> what is built during the hackathon versus existing (30s, honest) -> what is next (30s). Prepare Q&A: model choice and licence, accuracy and safety for children, Filipino/Taglish quality, device requirements, what happens when the model is missing, privacy, what is pre-existing.

## 7. Open items before submitting

1. Confirm all members are on the official list, and who attends Demo Day in person.
2. Ask the organisers (Telegram) whether a pre-existing project qualifies and what disclosure they expect.
3. Fill every TBD above with verified facts.
4. Record the video, post it, collect the URL.
5. Make the repo public and verify from a logged-out browser.
