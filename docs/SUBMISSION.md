# Submission Draft — AppBuildersPH Hackathon 2026

Status: DRAFT, 2026-10-09. Submission deadline: **10:00 AM, October 10, 2026, no extensions, one submission, no edits.** Submit on the Cerebral Valley event page (see `docs/HACKATHON.md`). Everything marked TBD must be filled with verified facts prior to submission.

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

Draft, to be tightened after the demo works:

> This project is built for learners with unreliable or no internet, and for children whose questions should not need to leave the device. A cloud-only tutor fails exactly when a learner in a low-connectivity home or classroom needs it, costs per question, and sends a child's typed or spoken questions to a server. Running the tutor model locally lets the tutor answer a math question with the network off, with no per-question cost, lower waiting once the model is loaded, and no learner text leaving the phone or laptop. Cloud AI stays as an optional upgrade, not a requirement.

Facts that back this and are true today: the learning loop already works offline from the service-worker cache and IndexedDB; there are no accounts; credentials are server-side only; speed of the edge model on the team's Mac is measured (section 3, "Measured performance"). Facts that are NOT yet true and must not be claimed until verified: that an open-source model runs inside the phone's browser in the demo (it was tried and crashed, D-018); any speed number measured on a phone; any quality score; iPhone support beyond the phone acting as a client of the Mac.

### Learning modes (confirmed; describe only what works in the demo)

The project has three modes, Kalma (calm/focus), Pakinig (listen), and Hakbang (step), that change both the interface and how the on-device AI replies (`docs/TUTOR_MODES.md`). In the submission and pitch, describe them as designed to support learners with different needs. Do not make clinical, therapeutic, or efficacy claims, and do not list a mode feature as shipped unless it works live.

## 3. Disclosures (required)

### What runs locally


| Item                                                                                | Status                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Learning loop (lessons, practice, answer checking, mastery, history, streak)        | Runs locally today (not AI)                                 |
| On-device open-source LLM tutor replies                                             | TBD: model, runtime, device. Fill in only after it runs     |
| Fallback: Chrome built-in Gemini Nano via Prompt API                                | Runs locally on supported Chrome setups only                |
| Fallback: on-device speech synthesis (`speechSynthesis`) and Web Speech recognition | Browser-provided; local depending on browser and OS         |
| Bundled curriculum and explanations                                                 | Local                                                       |


### What requires internet


| Item                                                                | Needed for                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cloud Gemini tutor (`/api/tutor`)                                   | Tutor replies when no on-device model is available (optional)                    |
| Adaptive AI question generation and verification (`/api/questions`) | AI-generated practice sessions (optional; bundled rotation is the offline floor) |
| Google Cloud Text-to-Speech (`/api/tts`)                            | Natural Filipino voice (optional; `speechSynthesis` floor)                       |
| Gemini transcription (`/api/transcribe`)                            | Spoken questions (optional; Web Speech or typing floor)                          |
| First model download                                                | One-time download of the model weights, if the model is not bundled              |
| First app load                                                      | Install the PWA and precache the shell                                           |


### Models used

**Chosen: Gemma 4 E2B** (confirmed by the team lead 2026-10-10), run on-device through transformers.js (`onnx-community/gemma-4-E2B-it-ONNX`, q4f16). **Do not list it as running until it has been verified on the demo device (iPhone 13).** Record exact name, size, quantization, source, and the license terms (read them first). Earlier candidates evaluated but not chosen: Gemma 3 1B, Qwen3 0.6B. Cloud fallback models: Gemini (`gemini-2.5-pro` for the tutor, `gemini-2.5-flash` for questions and transcription by default).

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
| LM Studio (app) and `google/gemma-4-e2b` (MLX 4-bit, 4.37 GB) | Runs the language model on the team's Mac. Verify and record the exact model license before submitting                                                    |
| ElevenLabs API (`eleven_flash_v2_5`, premade voice)           | Cloud text-to-speech for the tutor's spoken replies; **a cloud API, not local AI**; optional, with the phone's built-in voice as the offline fallback |
| Cloudflare quick tunnel (`cloudflared`), ngrok if used        | Lets phones reach the hub on the team's Mac over the internet                                                                                             |
| Vercel (if the PWA is deployed there)                         | Hosts the PWA's static files                                                                                                                              |
| Claude Code (Anthropic)                                       | AI development tool used by the team for planning, code and documentation                                                                                 |


### Technologies and frameworks

React 19, Vite 6, Tailwind CSS 3, vite-plugin-pwa (Workbox), idb-keyval (IndexedDB), Three.js, `@google/genai`, `@google-cloud/text-to-speech`, Node serverless functions, `node --test`, Playwright and sharp (tooling). Local AI runtime: TBD (WebLLM / WebGPU is the leading option).

### APIs and cloud services

Google Vertex AI / Gemini API, Google Cloud Text-to-Speech, optional Upstash Redis (rate limiting), a serverless host for `api/` (TBD which). Hugging Face (model weights hosting) if used.

Fonts bundled with the app (added during the hackathon, via the `@fontsource` packages): Atkinson Hyperlegible (Braille Institute), Baloo 2 (Ek Type), and Nunito (Vernon Adams), all under the SIL Open Font License 1.1. They are used for the Pakinig reading mode and the headings and body text, so the app looks the same offline.

Also disclose: curriculum content derived from the DepEd MATATAG package (see `source_trace` fields), textures, illustrations, sound effects, and fonts in `public/` and `textures/` and their origins and licenses (TBD: confirm origin of each asset set; some may have been AI-generated).

### AI development tools

Claude Code (Anthropic) was used for planning, documentation, and code assistance in this session. TBD: list every other AI tool used by the team (for example Devin, others) and for what.

## 4. Repository requirements (judges recreate it from the repo)

- [ ] Repository is **public** before 10:00 AM Oct 10.
- [ ] `README.md` exists with: what it is, why local AI, architecture, how to install and run, how to download or provide the model, how to test offline, hardware and browser requirements (device, OS version, browser), and known limitations.
- [ ] Instructions work from a clean clone (`npm install`, `npm run dev`); verified by someone following them. Partly checked 2026-10-10 ~04:35 PHT at commit `39d348a`: a fresh `git clone` of the local repo, then `npm install` (served from this Mac's npm cache, so not a cold download), `npm test` 187 of 187 pass, `npm run build` OK with the service worker precaching 132 files (18.8 MB), and `vite` dev server answering 200. Not done: a clone from GitHub on another machine, a person following the README, or loading the app in a browser from that clone.
- [ ] No secrets committed (`.env` is gitignored; check history with a search before the repo goes public).
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