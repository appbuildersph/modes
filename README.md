# An offline-first AI math companion for Filipino learners

This project is a Progressive Web App (PWA) that helps Filipino **Grade 4 to 6** learners practise Mathematics (DepEd MATATAG curriculum). A friendly AI tutor answers a learner's question step by step in English, Tagalog or Taglish, and can read the answer aloud. The answers come from an open-source model, **Gemma 4 E2B, running on the team's own laptop** (an "edge" setup), not from a cloud AI API.

This repository was built for the AppBuildersPH Hackathon 2026 (theme: Local AI).

## Why edge / local AI

- **No cloud AI API in the tutor path.** With the edge backend on, a question is answered by Gemma 4 E2B served by LM Studio on a machine the team controls.
- **No per-question cost.** Inference uses the laptop's own hardware.
- **Works with the laptop offline.** On the laptop itself, open the app at `http://localhost:8787`: the model and the app both run with the network off.
- **Child data stays on the team's machine for tutor questions.** There are no accounts, and the learner's progress is stored on their own device (IndexedDB).

What is *not* local, stated plainly:

- **Phones need a connection to reach the laptop.** The demo uses an ngrok tunnel, so a phone needs internet to talk to the laptop. Without it the app falls back to bundled explanations.
- **Optional ElevenLabs voice sends text to ElevenLabs.** If you enable `TTS_PROVIDER=elevenlabs`, the tutor's *reply text* is sent to ElevenLabs to generate speech. Without it, the app uses the device's own speech synthesis.
- **Optional cloud fallbacks.** If the edge hub is unreachable and a host has cloud credentials configured, the app can fall back to its older Gemini endpoints (`/api/tutor`, `/api/questions`, `/api/transcribe`, Google text-to-speech). They are off unless credentials are set.
- **One laptop serves many phones**, so replies slow down under load.

## Learning modes

Three modes change both the interface and how the tutor replies. They are designed to support learners with different needs. The app does not diagnose anyone, makes no clinical or efficacy claims, and any learner can choose any mode. Definitions: [`docs/TUTOR_MODES.md`](docs/TUTOR_MODES.md).

| Mode | Designed to support | Tutor behaviour |
|---|---|---|
| **Kalma** (Calm / Focus) | learners who benefit from a calm, predictable screen | two short sentences, one idea, calm tone |
| **Pakinig** (Listen) | learners who benefit from listening | written for speech: no symbols or markdown, "3/4" spoken as "three fourths" |
| **Hakbang** (Step) | learners who benefit from small steps | one step per reply, simple words, then a check question |

Small models follow format instructions unreliably, so the mode rules are also enforced **in code after the model replies** (`src/lib/tutor-modes.js`); a reply that fails validation falls through to the next provider.

**Status:** the mode preference (onboarding step and Profile screen), the mode-aware tutor prompt, the post-processing rules and their tests are implemented. The mode-specific screen changes in `docs/TUTOR_MODES.md` (plain Kalma layout, Pakinig large type with word highlighting, Hakbang scaffold, Grade 1 to 3 unlock) are **not claimed as shipped** unless shown working in the demo.

## Architecture

```
Phone (installed PWA)
   |  HTTPS
   v
ngrok static domain  ---->  Edge hub  (scripts/edge-hub.mjs, 127.0.0.1:8787)
                                |  imports api/tutor.js (TUTOR_BACKEND=edge)
                                v
                         LM Studio (127.0.0.1:1234)  ->  Gemma 4 E2B

Laptop browser at http://localhost:8787  ->  the same hub, no internet needed
```

- **The hub only exposes** `/api/tutor`, `/api/ping` and `/api/tts` through the tunnel. LM Studio is never exposed, because a public tunnel to its raw API would be an open model proxy. The app files are served only to `localhost`, unless the hub is started with `EDGE_SERVE_APP=1` (then a tunnel URL can serve the app and the API from one address, which is how the phone test below was run).
- **The server builds the prompt** from the request's `ref`, `lang` and `mode` against the bundled curriculum. It never accepts a client-supplied system prompt. Origin allow-listing, size caps and per-IP rate limits come from `api/_shared.js`.
- **Tutor provider order** (`src/lib/tutor.js`): Chrome's built-in Gemini Nano if present, then the edge hub, then the cloud endpoint if configured, then a bundled explanation. Replies are cached in IndexedDB for offline re-reading.
- **Voice-out** (`src/lib/speech.js`): `/api/tts` on the edge hub when the app has one (ElevenLabs if configured), else the host's own endpoint, else the device's `speechSynthesis`.

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), decisions in [`docs/DECISIONS.md`](docs/DECISIONS.md) (D-016 to D-018).

## Quick start

### A. Run it on one machine (no accounts needed)

This is the path for judges. It needs Node, LM Studio and the model.

```bash
npm install
npm test                 # Node test runner, no network or model needed
npm run build            # the hub serves the built app from dist/
```

1. Install [LM Studio](https://lmstudio.ai) and download **`google/gemma-4-e2b`** (MLX 4-bit, about 4.4 GB).
2. Start its server on the default port and make sure the model is loaded:
   ```bash
   ~/.lmstudio/bin/lms server start --port 1234
   ~/.lmstudio/bin/lms load google/gemma-4-e2b
   ~/.lmstudio/bin/lms ps          # google/gemma-4-e2b must be listed
   ```
3. Start the hub (no `.env` file is required for this path):
   ```bash
   node scripts/edge-hub.mjs
   ```
4. Open **http://localhost:8787**, choose a lesson and ask the tutor a question. The reply is labelled as coming from the AI server. Turn the network off to confirm it still answers.

Check the hub from a terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/api/ping     # 204
curl -s http://127.0.0.1:8787/api/tutor -X POST -H 'Content-Type: application/json' \
  -d '{"question":"Paano ko idadagdag ang 3/4 at 1/2?","ref":"4NA-IIe-1","lang":"taglish","mode":"kalma"}'
# {"text":"...","source":"edge"}
```

For UI development only: `npm run dev` serves the app on http://localhost:5173 without the hub.

### B. Use it from phones (tunnel and deploy)

Requires an ngrok account with a static domain, and a deployed copy of the PWA (for example on Vercel) built with `VITE_EDGE_BASE` set to the tunnel URL. Step-by-step, start order, the demo-day checklist and troubleshooting: [`docs/EDGE_RUNBOOK.md`](docs/EDGE_RUNBOOK.md). Note that runbook marks which steps have and have not been run.

## Requirements

| Item | Used by the team | Notes |
|---|---|---|
| Computer | Apple Silicon Mac, 16 GB RAM | Other hardware is untested |
| Node.js | 24 | Other versions untested |
| LM Studio | with `google/gemma-4-e2b` (MLX 4-bit, 4.37 GB, context 8192) | An MLX build needs Apple Silicon |
| Phone (optional) | iPhone 13, Safari, installed PWA | Used as a client only; the model does not run on the phone |
| Tunnel (phones only) | ngrok free static domain | Account required |

## Environment variables

Names only; real values go in a local `.env` (gitignored, never committed). The template is [`.env.example`](.env.example).

| Variable | Purpose |
|---|---|
| `TUTOR_BACKEND` | `edge` answers from LM Studio; unset uses the cloud path. The hub sets `edge` by default |
| `EDGE_LLM_URL`, `EDGE_MODEL`, `EDGE_TIMEOUT_MS` | LM Studio URL (default `http://127.0.0.1:1234`), model name (default `google/gemma-4-e2b`), timeout |
| `EDGE_HUB_PORT`, `EDGE_TTS_MAX_PER_HOUR` | Hub port (default 8787) and hourly cap on tunnelled voice calls |
| `QUESTION_CORS_ORIGINS` | Comma-separated origins of the deployed PWA allowed to call the hub |
| `VITE_EDGE_BASE` | Build-time URL of the hub for a deployed PWA |
| `TTS_PROVIDER`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` | Optional ElevenLabs voice (default model `eleven_flash_v2_5`). Unset keeps the on-device voice |
| `GCP_PROJECT`, `GCP_SA_KEY`, `GEMINI_API_KEY` | Optional older cloud endpoints. Not needed for the edge path |

## Tests

```bash
npm test
```

Uses `node --test` over `test/*.test.js`. It covers the curriculum data, the tutor prompt and mode rules, the provider chain, the edge backend, the voice endpoint and the speech routing, all with fake networks and no model. At the time of writing, 187 tests passed on the team's Mac (the count changes as tests are added). The tests do not prove the model's reply quality.

## Proof of local inference

![Terminal showing LM Studio's model log for google/gemma-4-e2b next to the phone app showing the same reply from the edge AI server](docs/images/edge-inference-proof.png)

*Screenshot taken 2026-10-10 at 2:15 AM, cropped to the two relevant windows. Left: Terminal running `lms log stream --source model --stats` on the edge server. Right: the app on an iPhone 13, mirrored to the Mac with iPhone Mirroring.*

**The edge server:** a MacBook Air (Apple M5, 16 GB) running LM Studio with the MLX build of **Gemma 4 E2B** (`google/gemma-4-e2b`, 4-bit, 4.37 GB). It is the E2B model, not another size; the identifier in the log is the one LM Studio reports.

**What the screenshot shows**

- The phone app asked the tutor for a hint in Hakbang mode. Its reply is labelled as coming from the edge AI server, which the app only shows when the answer came from the edge hub.
- LM Studio's model log, on the Mac, shows the prompt it received (the server-built system prompt with the Hakbang rules, then the student's message) and the output `Simulan natin sa isang parisukat. ...`, word for word the same text the phone displays.
- Generation statistics from the same entry: `modelIdentifier: google/gemma-4-e2b`, 51.8 tokens per second, 0.523 s to the first token, 0.869 s in total, 45 tokens generated from a 155-token prompt, `numGpuLayers: -1` (all layers on the GPU), `stopReason: eosFound`.

**What it does not show.** The phone reached the Mac through an internet tunnel (a Cloudflare quick tunnel), so this particular capture is *not* an offline run, and it does not show the network being switched off. It also does not show the model running on the phone, because it does not: the phone is only the client. The offline claim applies to the Mac itself (open `http://localhost:8787` with the Mac's Wi-Fi off). The reply was produced by a 2B-parameter model and its Tagalog has not been reviewed by a Filipino reader.

**Reproduce it.** Start LM Studio's server, run the hub (Quick start A), then in a second Terminal run `~/.lmstudio/bin/lms log stream --source model --stats` and ask the tutor a question from the app. Each question appears in that log with its prompt, the model's output and the timing figures. To check that nothing leaves the machine, run `lsof -nP -i -a -c "LM Studio" | grep -E "LISTEN|ESTABLISHED"`; the model server listens on `127.0.0.1` only.

## Measured so far

All on the edge server (MacBook Air, Apple M5, 16 GB). The phone test above is the only phone result; no on-phone model numbers exist, because the model does not run on the phone.

**Benchmark, 2026-10-10 04:26 PHT** (`node scripts/bench-edge.mjs --runs 3`; every run is in [`docs/benchmarks/edge-2026-10-10.json`](docs/benchmarks/edge-2026-10-10.json)). Gemma 4 E2B in LM Studio with the exact prompt and settings the app sends; one Grade 4 fractions question in English and Tagalog, 3 runs per mode, after one untimed warm-up. Token counts come from LM Studio's `usage` field.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/benchmarks/reply-time-dark.svg">
  <img src="docs/benchmarks/reply-time-light.svg" alt="Bar chart: median full tutor reply time per mode. Hakbang 0.56 s, Kalma 0.77 s, Pakinig 1.14 s, no mode 5.13 s, with fastest-to-slowest ranges." width="720">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/benchmarks/decode-speed-dark.svg">
  <img src="docs/benchmarks/decode-speed-light.svg" alt="Scatter chart: decode speed against reply length for 24 replies. Replies of 100 or more tokens sit at 48 to 53 tokens per second; short replies scatter from 40 to 115." width="720">
</picture>

*Charts are drawn from the raw JSON by `node scripts/bench-charts.mjs`; the table below has the same numbers.*

| Mode | Reply length (median) | First token (median) | Full reply, median (range) | Decode speed (median) |
|---|---|---|---|---|
| No mode | 246 tokens | 0.20 s | 5.13 s (2.32-5.88 s) | 51.0 tok/s |
| Kalma | 30 tokens | 0.17 s | 0.77 s (0.59-1.01 s) | 56.4 tok/s |
| Pakinig | 53 tokens | 0.19 s | 1.14 s (0.85-1.23 s) | 56.0 tok/s |
| Hakbang | 23 tokens | 0.22 s | 0.56 s (0.35-1.22 s) | 73.6 tok/s |

- Steady decode speed is about **48 to 53 tokens per second** (the 6 replies of 100+ tokens). Short replies give higher, noisier figures (up to 115 tok/s) because they are timed over a few tenths of a second; that is not the model's real speed.
- Through the hub's `/api/tutor` (the app's real path, on the Mac): 8 of 8 requests answered by the edge model, median 0.82 s; mode replies 0.41 to 1.36 s, no-mode replies about 5 s.
- Not measured: network time from a phone, memory, cold model load, answer quality. One question, one machine, 3 runs: indicative, not a formal benchmark.

Earlier single runs, recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md) (D-018) and [`docs/ROADMAP.md`](docs/ROADMAP.md):

- Short Kalma and Hakbang replies through the hub took roughly 0.6 to 1.3 s; longer no-mode replies about 4.5 s. Model speed was about 45 to 51 tokens per second.
- One captured phone question (Hakbang mode, [screenshot above](#proof-of-local-inference)): 51.8 tokens per second, 0.523 s to the first token, 0.869 s total, on the MacBook Air M5.
- A request from a foreign origin is rejected (403); an unknown mode is rejected (400).
- ElevenLabs voice through the hub returned audio in 0.45 s locally and 0.59 s through the public tunnel (one short Taglish line; Filipino naturalness not judged).

## Limitations and honest notes

- **The model does not run on the phone.** In-browser attempts on an iPhone 13 failed (Safari 27.0.1): Gemma 4 E2B's page was killed during the roughly 3 GB download, and Gemma 3 1B loaded and then crashed; the browser reported a 683 MB maximum GPU buffer. That is why the model runs on a laptop instead. See D-018.
- **Filipino quality is unverified.** Gemma 4 E2B's model card does not list Filipino among its languages. No Filipino benchmark exists for models this small, and no Filipino reader has reviewed the replies. Treat Tagalog and Taglish quality as unproven.
- **Small-model output needs guard rails.** In earlier tests, small models broke the mode rules (markdown, long replies, loops), which is why the rules are enforced in code.
- **The phone-to-laptop path** was run once on an iPhone 13 (Safari, installed from a Cloudflare quick tunnel, app and hub on one address): questions reached the hub and Gemma answered them (hub log `POST /api/tutor 200`, 0.65 to 1.0 s). The ngrok static domain and a Vercel deployment are documented in the runbook but have **not** been run. Offline operation is only valid on the laptop itself.
- **A tunnel URL is public.** Origin allow-listing and rate limits protect it, but non-browser clients can forge an origin. Stop the tunnel when not demoing.
- **The ElevenLabs voice** has not been judged for Filipino naturalness, and the voice is chosen by ear.
- **Grades 1 to 3:** curriculum data exists but is not bundled; the Hakbang unlock is not claimed.

## Development and key components

**Application architecture.** The project integrates a responsive React PWA structure with DepEd MATATAG curriculum data, device-local mastery tracking, and interactive learning screens.

**Key hackathon deliverables:**

- A shared tutor prompt and three inclusive learning modes (prompt rules plus deterministic post-processing), with complete tests.
- A provider chain for the tutor with a mode-aware cache and a label indicating where each answer was generated.
- The local edge AI setup: the `TUTOR_BACKEND=edge` backend in `api/tutor.js`, the edge hub gateway in `scripts/edge-hub.mjs`, the client edge provider in `src/lib/edge-llm.js`, and the learning-mode selector in Profile.
- Optional ElevenLabs voice-out and routing of audio synthesis through the edge hub.
- Complete documentation: architecture, decision logs, edge runbooks, research on inclusive education, and interactive mode mockups (`mockups/hiyang`).

## Models, services and tools used

- **Model:** Gemma 4 E2B (`google/gemma-4-e2b`), run through LM Studio (MLX 4-bit). Google's model card lists the licence as Apache 2.0; the licence of the converted MLX build has not been checked. It was chosen after testing candidates (Gemma 3 1B and Qwen3 0.6B) in the browser.
- **Runtime and tooling:** LM Studio, ngrok (tunnel), Vercel (hosting the PWA, if used), React 19, Vite 6, Tailwind CSS 3, vite-plugin-pwa, idb-keyval, Three.js, Node's built-in test runner.
- **Optional cloud services:** ElevenLabs (voice), Google Vertex AI / Gemini and Google Cloud Text-to-Speech (older fallback endpoints), Upstash Redis (optional rate limiting).
- **AI development tools:** AI coding assistants were used for planning, research, code and documentation during the hackathon (including Claude Code by Anthropic). The team must complete this list with every other tool used.

## Licence

No licence file has been added yet; the team has not chosen one. Do not assume a licence until one is published in this repository.

## More documentation

[`docs/PRD.md`](docs/PRD.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/TUTOR_MODES.md`](docs/TUTOR_MODES.md), [`docs/EDGE_RUNBOOK.md`](docs/EDGE_RUNBOOK.md), [`docs/DECISIONS.md`](docs/DECISIONS.md), [`docs/SUBMISSION.md`](docs/SUBMISSION.md).
