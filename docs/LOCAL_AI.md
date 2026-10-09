# Local AI — on-device open-source model for the offline tutor

**Superseded for the demo by D-018:** Gemma 4 E2B now runs on the team's laptop in LM Studio (MLX), not in the phone's browser; the in-browser attempts on the iPhone 13 failed. This file is the research snapshot that led there (`docs/DECISIONS.md` D-016 to D-018). The other models below are earlier candidates and fallbacks. The product is an offline-first tutor, and the model must serve that goal.

Status: research snapshot, 2026-10-09. Nothing here has been verified on a real iPhone. Model facts below were gathered by a separate research session and have not been independently re-checked. **Re-verify any fact that decides a purchase, license, or ship decision.**

## 0. Hackathon time-boxed plan (supersedes the long plan below where they conflict)

> **Update 2026-10-10 (later superseded by D-018, edge AI on the laptop):** the model is now Gemma 4 E2B and the demo device is an iPhone 13 installed PWA, so the plan's laptop-first steps below are superseded: test the model on the phone first (HTTPS tunnel, Safari Web Inspector), and use the Mac only for development. See `docs/ROADMAP.md` gates.

Context: the AppBuildersPH Hackathon 2026 (Local AI) submission deadline is **10:00 AM on 2026-10-10**; this was written at about 11:30 PM on 2026-10-09 (`docs/HACKATHON.md`). The sections after this one are the full research and design; the full evaluation (section 8) and iPhone acceptance checklist (section 9) do not fit. The proposal below is the minimum that makes Local AI real in the demo. The team lead decides; adjust as needed.

| Window (approx.) | Goal | Done when |
|---|---|---|
| 11:30 PM - 12:30 AM | Baseline and runtime proof. `npm install`, `npm test`. Confirm WebGPU on the **demo laptop** (`'gpu' in navigator`). Load one small model (Gemma 3 1B IT via WebLLM, or Qwen3-0.6B if Gemma access is a problem) in a throwaway page and get one reply | A reply is generated in the browser with the network off after the weights are cached |
| 12:30 AM - 2:30 AM | Integrate as a provider in `src/lib/tutor.js` (between Nano and `/api/tutor`), lazy load, download button with progress, `navigator.storage.persist()`, missing-model detection, Workbox exclusion | Asking the tutor in the Classroom returns an on-device reply labelled as such, with the network off |
| 2:30 AM - 4:00 AM | Output control: `stripMarkdown`, sentence cap, remove `<think>`, shared grounded prompt, empty/off-topic reply falls through; unit tests for the pure functions | `npm test` passes with new tests |
| 4:00 AM - 6:00 AM | Optional: real iPhone attempt (HTTPS tunnel, installed PWA). Optional: Kalma/Pakinig/Hakbang if the team has confirmed definitions. Sleep window | A verified iPhone result, or a clear "not verified" statement |
| 6:00 AM - 8:30 AM | README with judge recreation steps, disclosures (`docs/SUBMISSION.md`), AI Lab results if built, rehearsal of the offline demo on the demo laptop, demo video, social post | Everything in the `docs/SUBMISSION.md` checklist is ticked |
| 8:30 AM - 9:30 AM | Final checks from a clean clone; repo public; stop making changes | Repo public, last commit well before 10:00 AM |

Rules for this window: pick **one** model and **one** runtime and make them work before comparing anything; the demo device is the iPhone 13 installed PWA (D-017), so load the model there early; treat the iPhone as stretch; do not start Capacitor, fine-tuning, or a native plugin; do not claim any measurement that was not taken on the device shown in the demo; commit often with descriptive messages (git history after 2:30 PM Oct 9 is the evidence of what was built during the hackathon).

## 1. Why this exists

The offline AI path previously used Chrome's Prompt API (Gemini Nano, `self.LanguageModel`) in `src/lib/tutor.js`. That API:

- needs Chrome's own downloaded model and runtime;
- is not available in any iOS browser (every iOS browser is a WebKit shell, and Safari has no equivalent API);
- only works on capable desktop and Android Chrome builds.

The team tests on iPhone, so the offline tutor needs a model and runtime that the app itself brings along. The team decided to use an **open-source model**, not Gemini Nano, and to **keep the PWA** (no Capacitor wrapper yet).

## 2. Decisions so far

| Decision | Status |
|---|---|
| Keep the PWA as the base | Decided (2026-10-09) |
| Capacitor/native wrapper | Deferred; revisit if the web route is unreliable on real iPhones |
| Use an open-source model instead of Gemini Nano on iOS | Decided |
| Which model | **Open.** Leading shortlist: Gemma 3 1B first, Qwen3-0.6B / 1.7B for comparison |
| Runtime | Leading option: WebLLM (MLC) on WebGPU. transformers.js not evaluated |
| Minimum iPhone | Open |

## 3. Runtime options

| Option | Works in a pure PWA | Notes |
|---|---|---|
| **Web runtime on WebGPU** (WebLLM, transformers.js) | Yes | Believed to need iOS 26 or later (Safari WebGPU). Model weights are cached in the browser. Memory per page is capped by iOS; models around 0.5-1.5B parameters quantized are the realistic range. Slower than native. |
| **Apple Foundation Models** (Apple's on-device model, iOS 26) | No (native only) | Would need a Swift plugin. Only on Apple Intelligence devices (believed iPhone 15 Pro and later). Tagalog support unverified. |
| **Native runtime** (llama.cpp, MLX, MediaPipe LLM) | No (native only) | Faster, can hold larger models, not bound by browser page memory or cache eviction. Needs a native wrapper and plugins. |

Chosen path for now: web runtime in the PWA. Native runtimes are the fallback plan.

## 4. Candidate models (WebLLM builds)

WebLLM model IDs and memory requirements come from `mlc-ai/web-llm` `src/config.ts` (quantization `q4f16_1`). The "VRAM" column is the runtime's GPU memory requirement in MB, **not the download size**. Download sizes were not retrieved. Instruction-following scores (IFEval) are vendor-reported with differing protocols, so they are not strictly comparable.

| Model | WebLLM VRAM (MB) | IFEval (vendor-reported) | License | Notes |
|---|---|---|---|---|
| Gemma 3 1B IT | 711 | 80.2 | Gemma terms (login and Google terms; text not yet read) | First choice. Smallest memory among the strong instruction-followers. |
| Qwen3-0.6B | 1403 | 54.5 | Apache-2.0 | Needs `enable_thinking=False`, otherwise `<think>` blocks break short-reply rules. |
| Qwen3-1.7B | 2037 | 68.2 (non-thinking, strict) | Apache-2.0 | At the roughly 2 GB web-process kill level reported on iOS 26; too risky for iPhone. |
| Llama 3.2 1B Instruct | 879 | 59.5 | Llama community license ("Built with Llama" display, notice file, model-name rule for derived training) | |
| Qwen2.5 0.5B | 945 | not retrieved | Apache-2.0 (verify) | |
| Qwen2.5 1.5B | 1630 | not retrieved | Apache-2.0 (verify) | |
| SmolLM2 360M | 376 | not retrieved | not checked | Very small; quality likely low. |
| SmolLM2 1.7B | 1774 | not retrieved | not checked | |
| Qwen3.5 0.8B / 2B / 4B | not retrieved | not retrieved | Apache-2.0 | Listed in WebLLM; not assessed. |

transformers.js builds were not checked for any model.

## 5. Filipino and Taglish quality: the main unknown

- No published Filipino benchmark score exists for any model under 1.5B parameters that the research session could find.
- FilBench (arXiv 2508.03523) evaluated 27 models. The only one under 5B was SeaLLMs-v3-1.5B, scoring 43.2 (GPT-4o scored 72.7). Gemma, Qwen, and Llama were only tested at 7B and above.
- FilBench found Filipino text **generation** is the weakest skill (about 17% on average), and generation is what Filipino math explanations need.
- Gemma 3, Llama 3.2, and Qwen3 model cards do not list Filipino/Tagalog as supported languages. Qwen3's technical report lists Tagalog only in two evaluation sets.

**Consequence:** the team must build its own Taglish evaluation set and have it scored by a person who reads Filipino. Nobody can rank these models for this task from published numbers.

Do not mine the curriculum JSON for Taglish few-shot examples: bundled `q.fil` and `q.taglish` equal the English text in every item. Real Taglish text lives in `src/lib/lesson-teaching.js` and `src/lib/i18n.js`.

## 6. iOS memory and storage (the main risk)

- No official Apple figure for per-page memory was found.
- Anecdotal: one Three.js forum report describes an iPhone web process killed at 2048 MB on iOS 26 (reporter's diagnosis, not Apple's). By that evidence a 2 GB model is too risky; models at or under about 1 GB fit.
- WebKit bug 275958: WebLLM originally needed a 1 GB GPU buffer that iOS refused; it was later lowered to 256 MB. Check the WebLLM version in use.
- iOS can kill the tab with no catchable error. The iOS **simulator does not reproduce this**; only a physical device counts as evidence.
- Not found: the memory limit of the smallest iPhone we should support; anything specific to home-screen PWAs versus Safari tabs; whether Gemma 3 1B actually loads on an iPhone.
- Cached model files can be evicted by the OS under storage pressure. `navigator.storage.persist()` helps but is not a guarantee. The app must detect a missing model and recover.

## 7. Proposed integration design (not built)

### 7.1 Provider chain in `src/lib/tutor.js`

```
cache -> Gemini Nano -> LOCAL MODEL (new) -> /api/tutor -> bundled explanation
```

Each provider returns text or throws; failures fall through silently. Keep the IndexedDB cache key shape `tutor:{ref}:{lang}:{hash}` (consider adding the mode and model id to the key so answers from different modes or models do not collide).

### 7.2 Proposed module surface (`src/lib/local-llm.js`)

```
availability()  -> 'unsupported' | 'needs-download' | 'downloading' | 'ready'
download({ onProgress, signal })     // explicit user action, resumable
generate({ system, user, maxTokens, signal }) -> string
unload()                              // free memory after a reply or when backgrounded
remove()                              // delete cached weights
```

Rules: one model instance at a time; load lazily on first question, not at app start; unload on `visibilitychange` hidden; cap `maxTokens` low (replies are 2-4 sentences); never block the UI thread (prefer a worker if the runtime supports it).

### 7.3 Prompt and output control

- Build the prompt from one shared function used by both client and server (the tutor prompt function previously had slight drift).
- Include the competency text, the bundled `explanation[lang]` and `worked_example[lang]` as grounding so the small model restates and applies rather than invents.
- Treat the student question and competency text as data, not instructions.
- Enforce the mode rules in code after generation: strip markdown (`stripMarkdown`), truncate to the mode's sentence limit, spell out fractions and symbols for speech, drop any `<think>` content, and fall through to the next provider if the result is empty or off-topic.
- Verify arithmetic in code when a question has a numeric answer the app already knows; never present a small model's arithmetic as authoritative.

### 7.4 Download and storage UX

- Explicit consent screen with model size, Wi-Fi advice, and a Skip option (the app works without it).
- Foreground download with progress; iOS suspends background pages, so resume must work.
- Call `navigator.storage.persist()` and `navigator.storage.estimate()`; show a "model missing, download again" prompt if weights disappear.
- Ensure Workbox does not precache or intercept model files (`vite.config.js`, 4 MB per-file limit, glob list).
- Provide a "remove model" control.

### 7.5 AI Lab page (proposed `src/screens/AiLab.jsx`)

Hidden behind a URL flag. Loads a selected model with a progress bar, runs a fixed prompt set for each tutor mode, and shows load time, time to first token, tokens per second, reply text, and whether the page survived. Results are exported as JSON so they can be compared across devices.

## 8. Evaluation plan

1. **Prompt set:** about 30 prompts per mode (Kalma, Pakinig, Hakbang), mix of English, Tagalog, and Taglish, covering Grades 4, 5, and 6 and all three domains. Draft from `src/curriculum/grade4-6.json` competencies and worked examples; have a Filipino-reading reviewer approve the prompts and score the replies.
2. **Scoring rubric (draft):** math correctness, language quality, stays on the competency, teaches rather than gives the answer, follows the mode's hard rules (before and after post-processing), safe and age-appropriate.
3. **Device matrix:** record device model, iOS version, Safari tab vs installed PWA, free storage. Minimum: one older and one newer iPhone.
4. **Measurements:** download size on disk, load time cold and warm, time to first token, tokens per second, peak memory if observable, crash or tab-kill events, battery or heat notes.
5. **Gate for integration:** a model must complete the prompt set on the minimum device without a tab kill and with acceptable quality scores. Thresholds to be set by the team before testing, not after.

## 9. Acceptance checklist for "offline AI works on iPhone"

- [ ] Installed to Home Screen as a PWA on a physical iPhone.
- [ ] Model downloaded over Wi-Fi with progress; app restarted; model still present.
- [ ] Airplane mode on; learner asks a question by typing; a relevant on-device reply appears, labelled on-device.
- [ ] Same with a spoken question (typing fallback if offline transcription is unavailable) and spoken reply via `speechSynthesis`.
- [ ] Reply obeys the active mode's rules.
- [ ] Killing storage (clearing site data) is detected, the bundled explanation still shows, and the download prompt reappears.
- [ ] No regression in the existing offline loop (lessons, practice, mastery) with the model installed.

## 10. Open questions

1. Which model, after the Taglish eval? Is a 0.5-1B model good enough at all, or is fine-tuning or a native runtime required?
2. Minimum supported iPhone and iOS version.
3. Does Apple Foundation Models handle Tagalog well enough to justify a native plugin later?
4. Gemma terms: read and approve before shipping (login and Google terms are required to download).
5. What does transformers.js offer (model availability, size, speed) compared with WebLLM?
6. Hosting for model files: Hugging Face CDN for testing; production host and CORS headers TBD.
7. Should the download be tied to a guardian/teacher consent step for children?

## 11. Sources (as cited by the research session; re-check)

- FilBench: arXiv 2508.03523
- WebLLM model list: `mlc-ai/web-llm`, `src/config.ts`
- WebKit bug 275958 (WebLLM buffer size on iOS)
- Model cards and licenses: Gemma 3, Qwen3, Llama 3.2, SmolLM2/SmolLM3
- Three.js forum report on the 2048 MB iOS web-process kill (anecdotal)
