# Submission Draft — AppBuildersPH Hackathon 2026

Status: DRAFT, updated 2026-10-10 ~05:00 PHT for the edge AI hub design (D-018). Submission deadline: **10:00 AM, October 10, 2026, no extensions, one submission, no edits.** Submit on the Cerebral Valley event page (see `docs/HACKATHON.md`). Everything marked TBD must be filled with verified facts prior to submission.

## 1. Project


| Field                    | Value                                                                                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project name             | **UNDECIDED.** The team has not chosen the final submission name. Decide before submitting, since the name is typed once into the form |
| Short description        | Offline AI math companion for Filipino Grade 4-6 learners, with AI tutoring on the learner's own device or local edge server. |
| Team name and members    | TBD. Names must match the official list on appbuildersph.com/hackathon exactly. TBD: confirm who is registered and present |
| Public GitHub repository | `https://github.com/appbuildersph/modes` (origin of this checkout; confirm it is the repository to submit and that it is **public** before 10:00 AM)                                                                                                                                      |
| Demo video               | TBD (ideally about 1 minute)                                                                                                                                                                                                                                                              |
| X / LinkedIn post URL    | TBD (tag Devin / Cognition, include `#AppBuildersPH`)                                                                                                                                                                                                                                     |


## 2. Why does this product benefit from running AI locally? (required answer)

Answer for the form (every claim in it is backed by the README, D-018 and the measurements below):

> Our learners are Filipino Grade 4-6 children, many in homes and classrooms with weak or no internet. A cloud-only tutor fails exactly when they need it, charges per question, and sends a child's questions to a third-party server. So the tutor's language model, Gemma 4 E2B, runs on a machine the class controls: a laptop acting as an edge AI server, through LM Studio, with no cloud AI API in the answer path. On that laptop the app and the tutor work with the network switched off. Phones on the same hub get the same tutor; if they cannot reach it, the app still teaches from bundled explanations. Local inference also means no per-question cost and replies in about a second (measured median 0.6-1.1 s for the learning modes on an Apple M5 MacBook Air). Cloud services are optional extras only, not the tutor's brain.

Wording rule: say "runs on a local edge server / the team's laptop", never "runs on the phone" (it does not; D-018).

Facts that back this and are true today: the learning loop already works offline from the service-worker cache and IndexedDB; there are no accounts; credentials are server-side only; speed of the edge model on the team's Mac is measured (section 3, "Measured performance"). Facts that are NOT yet true and must not be claimed until verified: that an open-source model runs inside the phone's browser in the demo (it was tried and crashed, D-018); any speed number measured on a phone; any quality score; iPhone support beyond the phone acting as a client of the Mac.

### Learning modes (confirmed; describe only what works in the demo)

The project has three modes, Kalma (calm/focus), Pakinig (listen), and Hakbang (step), that change both the interface and how the on-device AI replies (`docs/TUTOR_MODES.md`). In the submission and pitch, describe them as designed to support learners with different needs. Do not make clinical, therapeutic, or efficacy claims, and do not list a mode feature as shipped unless it works live.

## 3. Disclosures (required)

### What runs locally


| Item                                                                                | Status                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Learning loop (lessons, practice, answer checking, mastery, history, streak)        | Runs locally today (not AI)                                 |
| Tutor replies from Gemma 4 E2B (LM Studio, MLX 4-bit) on the team's MacBook Air (edge AI server, `scripts/edge-hub.mjs`) | Runs locally; verified with the Mac's own browser at `http://localhost:8787`, including with the Mac's Wi-Fi off (2026-10-10 05:07; README and `docs/images/verification/`) |
| Mode rules (Kalma, Pakinig, Hakbang) applied to every reply in code (`src/lib/tutor-modes.js`) | Local                                                      |
| Fallback: Chrome built-in Gemini Nano via Prompt API                                | Runs locally on supported Chrome setups only                |
| Fallback: on-device speech synthesis (`speechSynthesis`) and Web Speech recognition | Browser-provided; local depending on browser and OS         |
| Bundled curriculum and explanations                                                 | Local                                                       |


### What requires internet


| Item                                                                | Needed for                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Phone to laptop (ngrok tunnel, `tweed-thinner-quickly.ngrok-free.dev`) | A phone reaching the edge AI server over the internet. The laptop itself does not need it |
| PWA hosting (Vercel, `hiyang.vercel.app`, also `math-companion-edge.vercel.app`) | Serving the app's static files to phones; the first load installs the PWA and precaches the shell |
| ElevenLabs text-to-speech (cloud API, via the hub's `/api/tts`)      | Natural spoken replies (optional; the reply text is sent to ElevenLabs). Offline floor: the device's `speechSynthesis` |
| Cloud Gemini tutor (`/api/tutor` without the edge backend)          | Older fallback only; not configured in the demo deployment (no cloud credentials set) |
| Adaptive AI question generation (`/api/questions`), Gemini transcription (`/api/transcribe`), Google Cloud Text-to-Speech | Older optional cloud features; not configured in the demo. Offline floors: bundled question rotation, Web Speech or typing, `speechSynthesis` |
| First model download                                                | One-time download of the model in LM Studio (about 4.4 GB) on the laptop          |


### Models used

- **Gemma 4 E2B** (Google), LM Studio model `google/gemma-4-e2b`, MLX 4-bit build, 4.37 GB on disk, context 8192, served on the team's MacBook Air (Apple M5, 16 GB). This is the tutor model. Licence: **Apache 2.0**, as stated on the official model card (`huggingface.co/google/gemma-4-E2B-it`, checked 2026-10-10; terms at `ai.google.dev/gemma/docs/gemma_4_license`). The MLX 4-bit conversion LM Studio downloads is a community build of these weights; its own page was not opened.
- **Tried and not used:** Gemma 4 E2B in the phone's browser via transformers.js (`onnx-community/gemma-4-E2B-it-ONNX`; page killed during download on the iPhone 13) and Gemma 3 1B via WebLLM (loaded, then the page crashed). Earlier browser candidates on the Mac: Gemma 3 1B, Qwen3 0.6B. See D-018.
- **Optional, not used in the demo:** Chrome's built-in Gemini Nano (only on supported Chrome), and the older cloud fallbacks (Gemini `gemini-2.5-pro` for the tutor, `gemini-2.5-flash` for questions and transcription), which need credentials the demo does not have.
- **Voice:** ElevenLabs `eleven_flash_v2_5` with a premade library voice (cloud API, optional).

### Measured performance (honest numbers)

Measured 2026-10-10 04:26 PHT with `node scripts/bench-edge.mjs --runs 3`. Raw output, every run included: `docs/benchmarks/edge-2026-10-10.json`. Re-run it to check.

- **Machine:** Apple M5 Mac, 16 GB RAM, macOS 26.6.2, LM Studio serving `google/gemma-4-e2b` (MLX 4-bit) on 127.0.0.1:1234.
- **Settings:** exactly what the app sends (`api/tutor.js`): compact tutor prompt, temperature 0.4, max 300 tokens, `reasoning_effort: "none"`. One Grade 4 fractions question (`4NA-IIe-1`), English and Tagalog, 4 modes, 3 runs each (24 timed requests after 1 untimed warm-up).
- **Token counts** come from LM Studio's `usage` field, not estimates. Decode speed = (completion tokens - 1) / time from first to last token.

| Mode | Median reply length | Time to first token (median) | Full reply, median (range) | Decode speed, median (range) |
|---|---|---|---|---|
| No mode | 246 tokens | 0.20 s | 5.13 s (2.32-5.88 s) | 51.0 tok/s (48.0-53.4) |
| Kalma | 30 tokens | 0.17 s | 0.77 s (0.59-1.01 s) | 56.4 tok/s (40.6-62.4) |
| Pakinig | 53 tokens | 0.19 s | 1.14 s (0.85-1.23 s) | 56.0 tok/s (52.8-57.1) |
| Hakbang | 23 tokens | 0.22 s | 0.56 s (0.35-1.22 s) | 73.6 tok/s (53.2-115.2) |

- **Steady decode speed: about 48-53 tok/s.** That is the range over the 6 replies of 100+ tokens. Short replies show higher and noisier numbers (up to 115 tok/s) because a 20-token reply is timed over a few tenths of a second and LM Studio may send several tokens per stream chunk. Do not quote 115 tok/s as the model's speed.
- **Through the real request path** (hub `/api/tutor` on the same Mac, non-streamed, one request per mode and language, all 8 returned 200 with `source: "edge"`): median 0.82 s, range 0.41-5.48 s. The mode replies (Kalma, Pakinig, Hakbang) took 0.41-1.36 s; the no-mode replies took 4.97-5.48 s because they are long.
- **Not measured:** time over the network from a phone (tunnel or same Wi-Fi), anything running inside the phone, memory use, power, model load time from cold, answer quality or correctness. One question, one machine, 3 runs, so treat these as indicative, not a formal benchmark. Other sessions could have been using LM Studio at the same time; none was seen, but it was not prevented.
- **Earlier numbers in `docs/ROADMAP.md`** (45-51 tok/s, mode replies 0.55-1.5 s on the same Mac) agree with these. The Gemma 3 1B / Qwen3 0.6B numbers there were reported by another session and not re-run, so do not quote them.

### Services and tools added during the hackathon (disclose all)


| Item                                                          | Role                                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LM Studio (app) and `google/gemma-4-e2b` (MLX 4-bit, 4.37 GB) | Runs the language model on the team's Mac. Model licence: Apache 2.0 (official model card)                                                                 |
| ElevenLabs API (`eleven_flash_v2_5`, premade voice)           | Cloud text-to-speech for the tutor's spoken replies; **a cloud API, not local AI**; optional, with the phone's built-in voice as the offline fallback |
| ngrok (free static domain)                                    | Lets phones reach the hub on the team's Mac over the internet (the demo path)                                                                            |
| Cloudflare quick tunnel (`cloudflared`)                       | Used for the first iPhone test (README "Proof of local inference"); not the demo path                                                                    |
| Vercel (project `math-companion-edge`, CLI deploys)           | Hosts the PWA's static files; no API keys are stored there                                                                                                |
| Claude Code (Anthropic)                                       | AI development tool used by the team for planning, code and documentation                                                                                 |


### Technologies and frameworks

React 19, Vite 6 (`@vitejs/plugin-react`), Tailwind CSS 3 (with PostCSS and Autoprefixer), vite-plugin-pwa (Workbox), idb-keyval (IndexedDB), Three.js, `@google/genai`, `@google-cloud/text-to-speech`, Node serverless functions and a small Node HTTP gateway (`scripts/edge-hub.mjs`), `node --test`, Playwright and sharp (tooling), `@fontsource` font packages. Local AI runtime: **LM Studio** with Apple **MLX** on the team's Mac, called through its OpenAI-compatible `/v1/chat/completions` API on `127.0.0.1:1234`.

### APIs and cloud services

Used in the demo: ElevenLabs text-to-speech API (optional voice), ngrok (tunnel), Vercel (static hosting). In the code but not configured for the demo: Google Vertex AI / Gemini API, Google Cloud Text-to-Speech, optional Upstash Redis (rate limiting). The model weights were downloaded through LM Studio's model catalogue.

Fonts bundled with the app (added during the hackathon, via the `@fontsource` packages): Atkinson Hyperlegible (Braille Institute), Baloo 2 (Ek Type), and Nunito (Vernon Adams), all under the SIL Open Font License 1.1. They are used for the Pakinig reading mode and the headings and body text, so the app looks the same offline.

### Existing code and assets

- **Code:** All application code, edge AI integration scripts, learning mode post-processing engines, tests, and build configurations were developed and generated during the hackathon (starting October 9, 2026).
- **Media and visual assets:** Several UI illustrations, 3D classroom textures, and button sound effects in `public/` and `textures/` were created prior to the hackathon using OpenAI generative image tools for an earlier prototype and were reused here to focus build time on the local AI implementation.
- **Curriculum and educational data:** Competency texts and question templates are derived from the publicly available Philippine Department of Education (DepEd) MATATAG curriculum framework (referenced via `source_trace` metadata).
- **Bundled fonts:** Atkinson Hyperlegible (Braille Institute), Baloo 2 (Ek Type), and Nunito (Vernon Adams), bundled via `@fontsource` packages under the SIL Open Font License 1.1.

### AI development tools

Confirmed by the team (2026-10-10):

- **Claude Code (Anthropic):** planning, research, code, tests and documentation.
- **OpenAI Codex:** code assistance, including the Three.js 3D classroom (`src/screens/Classroom3D.jsx` refers to it).
- **ChatGPT / OpenAI image generation:** illustrations and textures in `public/` and `textures/` (their original files carried OpenAI content credentials).
- **Cursor:** AI code editor used for coding.

## 4. Repository requirements (judges recreate it from the repo)

- [ ] Repository is **public** before 10:00 AM Oct 10.
- [ ] `README.md` exists with: what it is, why local AI, architecture, how to install and run, how to download or provide the model, how to test offline, hardware and browser requirements (device, OS version, browser), and known limitations.
- [ ] Instructions work from a clean clone (`npm install`, `npm run dev`); verified by someone following them. Partly checked 2026-10-10 ~04:35 PHT at commit `39d348a`: a fresh `git clone` of the local repo, then `npm install` (served from this Mac's npm cache, so not a cold download), `npm test` 187 of 187 pass, `npm run build` OK with the service worker precaching 132 files (18.8 MB), and `vite` dev server answering 200. Not done: a clone from GitHub on another machine, a person following the README, or loading the app in a browser from that clone.
- [x] No secrets committed. Checked 2026-10-10 ~04:45 PHT over all branches' history: no ElevenLabs, Google, GitHub, Vercel or ngrok key patterns, no private keys, and none of the values in the local `.env` appear; the only hit is the `...` placeholder in `.env.example`. Re-run before going public if more commits land.
- [ ] Licenses for code, assets, and the model are stated.
- [ ] Hackathon commits are real, descriptive, and dated after 2:30 PM Oct 9.
- [ ] No commits after 10:00 AM Oct 10.

## 5. Demo video outline (about 1 minute)

1. One line: who it is for and the problem (no reliable internet).
2. Show network off (airplane mode or disabled Wi-Fi) on screen.
3. Open the app, show a lesson.
4. Ask the tutor a question; the reply appears, labelled as coming from the local AI server.
5. Show one more capability (spoken reply, a tutor mode).
6. One line on what is local versus optional cloud.
Record on the device that will be used in the live pitch. Do not show results that were not obtained live.

## 6. Pitch outline (finalists, 5 minutes + 3 Q&A)

Problem and user (30s) -> live offline demo (2.5 min) -> how local AI works and why it matters (1 min) -> architecture and key features (30s) -> what is next (30s). Prepare Q&A: model choice and licence, accuracy and safety for children, Filipino/Taglish quality, device requirements, what happens when the model is missing, privacy.

## 7. Open items before submitting

1. Confirm all members are on the official list, and who attends Demo Day in person.
2. Confirm submission category and event details.
3. Fill every TBD above with verified facts.
4. Record the video, post it, collect the URL.
5. Make the repo public and verify from a logged-out browser.

## 8. Drafts

### Social post (X or LinkedIn; attach the demo video)

> We built [PROJECT NAME] for the #AppBuildersPH Hackathon 2026 (Local AI): a math tutor for Filipino Grade 4-6 learners that keeps working when the internet doesn't. The tutor's AI, Gemma 4 E2B, runs on a laptop in the room through LM Studio, not on a cloud AI API. With the Wi-Fi off, it still answers in English, Tagalog or Taglish. Three learning modes, Kalma, Pakinig and Hakbang, change both the screen and how the AI replies. Built with help from AI coding tools. @cognition @DevinAI [repo link]

Before posting: fill in the name and link, check the handles to tag (Devin / Cognition) on the platform, and only keep claims the video shows.

### Question to the organisers (Telegram; optional, low priority)

> Hi! Quick check on scope: our tutor's model (Gemma 4 E2B) runs locally on a laptop through LM Studio, with no cloud AI API. The laptop works fully offline, and phones reach it as an edge AI server over a tunnel. The briefing lists Edge AI and AI on laptops as in scope, so we believe this counts as Local AI. Can you confirm? Thank you!

Save the answer (screenshot) in `docs/reference/`.