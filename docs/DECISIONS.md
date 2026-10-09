# Decision Log

Format: lightweight ADRs. Newest at the bottom. Status is one of Accepted, Proposed, Deferred, Superseded. To change a decision, add a new entry that supersedes it; do not rewrite history.

---

## D-001: Offline-first PWA, no accounts, no client-side secrets

- **Status:** Accepted (inherited from the original Gabay project)
- **Context:** Learners have inconsistent internet; the audience is children; cloud-only AI fails offline.
- **Decision:** The core loop runs from the service-worker cache and IndexedDB. No accounts. All credentials live in serverless functions. Every online upgrade has an offline floor.
- **Consequences:** Every AI feature needs a fallback chain; mastery and history are device-local and are lost if site data is cleared; server endpoints need strong guards (origin, size, rate limit).

## D-002: Scope is DepEd MATATAG Grades 4-6 Mathematics

- **Status:** Accepted
- **Decision:** Only Grades 4-6 are bundled and selectable (`src/lib/grades.js`). Grades 1-3 JSON stays in the repo, intentionally not imported.
- **Consequences:** Do not import the Grade 1-3 files; a stale stored grade outside 4-6 resets to the default.
- **Amended by D-014:** Hakbang mode unlocks Grade 1-3 content, loaded lazily and only in that mode.

## D-003: Connectivity is detected by a real request, not `navigator.onLine`

- **Status:** Accepted
- **Context:** `navigator.onLine` and online/offline events do not reflect throttled or blocked-at-network-layer connections.
- **Decision:** Poll `/api/ping` every 8 s; re-check with a 3 s probe before the 90 s AI question window.
- **Consequences:** Hosting must serve `/api/ping` (or `VITE_QUESTION_API_BASE` must point to a host that does). Known inconsistency: `tutor.js` still gates the cloud call on `navigator.onLine`.

## D-004: Server builds the tutor system prompt; client sends only question, ref, lang

- **Status:** Accepted
- **Context:** A client-supplied system instruction would turn `/api/tutor` into an open, billable Gemini proxy.
- **Decision:** `api/tutor.js` builds the prompt from the bundled curriculum entry for `ref` and the validated `lang`.
- **Consequences:** Any new request field (for example `mode`) must be allow-listed and validated server-side.

## D-005: `modes` repo is a cleaned fork of `CrossCampus`

- **Status:** Accepted (observed 2026-10-09)
- **Context:** `modes` differs from `CrossCampus` by removing host-specific build config, hardcoded origins, the README, `docs/`, `design-qa.md`, `.vercelignore`, `.openai`, and the `build:sites` scripts. CORS now allows same-origin automatically and anything else only via `QUESTION_CORS_ORIGINS`.
- **Consequences:** A static-only deployment must set `VITE_QUESTION_API_BASE` and `QUESTION_CORS_ORIGINS`. Changes made here may need to be ported to or from `CrossCampus`; decide the direction deliberately.

## D-006: Keep the PWA as the base; defer the Capacitor wrapper

- **Status:** Accepted (2026-10-09), revisit after the on-device model spike
- **Context:** The team wants to test on iPhone and later Android. A Capacitor wrapper was proposed (one codebase, two native projects, a small platform layer). The user chose to keep the PWA base while researching models.
- **Decision:** Stay a PWA. Do not add Capacitor yet.
- **Consequences:** On iOS the app runs in WebKit with browser memory and storage limits. If the web-model route proves unreliable on real iPhones, reconsider a native wrapper with a native runtime (llama.cpp, MediaPipe) or Apple Foundation Models, adding `capacitor://localhost` and `https://localhost` to `QUESTION_CORS_ORIGINS`.

## D-007: Use an open-source on-device model instead of Gemini Nano for offline AI on iPhone

- **Status:** Accepted in principle; the model itself is not chosen
- **Context:** Gemini Nano (Chrome Prompt API) does not exist on iOS.
- **Decision:** Add an on-device provider backed by an open-source model, run through a web runtime on WebGPU (WebLLM first). Gemini Nano remains a provider where available.
- **Consequences:** The app must manage a large model download, storage persistence, memory limits, and output post-processing. See `docs/LOCAL_AI.md`.

## D-008: Prefer sub-1 GB models; shortlist Gemma 3 1B and Qwen3-0.6B

- **Status:** Superseded by D-016 (2026-10-10). Kept for the reasoning on memory limits, which still applies
- **Context:** Anecdotal evidence of a roughly 2 GB web-process kill on iOS 26; WebLLM memory figures: Gemma 3 1B 711 MB, Qwen3-0.6B 1.4 GB, Qwen3-1.7B 2.0 GB. No published Filipino scores below 1.5B.
- **Decision:** Test Gemma 3 1B first and Qwen3-0.6B as comparison; treat Qwen3-1.7B as too risky for iPhone.
- **Consequences:** Gemma's license terms must be read before shipping; Qwen3 needs thinking mode disabled.

## D-009: Enforce tutor mode rules in code, not only in prompts

- **Status:** Accepted (modes confirmed in D-014)
- **Context:** Small models follow format instructions unreliably; the app speaks replies aloud and serves children.
- **Decision:** After generation, apply deterministic post-processing (strip markdown, sentence limits, spoken forms of symbols and fractions, remove `<think>`), and fall through to the next provider if the result is invalid.
- **Consequences:** Needs a pure, unit-tested `applyMode` function; modes become testable independent of any model.

## D-010: Physical-device evidence only for model viability

- **Status:** Accepted
- **Context:** The iOS simulator does not reproduce jetsam memory kills and its performance is not representative.
- **Decision:** No claim that a model "works on iPhone" without a physical-device run (installed PWA, airplane mode for offline claims).
- **Consequences:** The team needs a real iPhone, an HTTPS tunnel, and Safari Web Inspector (see `docs/DEV_SETUP.md`).

## D-011: Docs for AI sessions live in the repo

- **Status:** Accepted (2026-10-09)
- **Decision:** `CLAUDE.md` at the root plus `docs/` (PRD, architecture, local AI, tutor modes, dev setup, decisions, judging) are the shared context for AI sessions. They are updated whenever a decision, contract, or storage key changes.
- **Consequences:** Out-of-date docs are bugs; flag or fix them in the same change.

## D-012: This work is the team's entry in the AppBuildersPH Hackathon 2026 (Local AI)

- **Status:** Accepted (2026-10-09, from the participant briefing)
- **Context:** Judging weights: Problem and Usefulness 25%, Local AI Implementation 25%, Technical Execution 20%, Innovation 15%, Product and Demo Quality 15%. Core functionality must not depend entirely on a cloud API. Submission deadline 10:00 AM 2026-10-10, no extensions; repository must be public; judges recreate the project from the repo.
- **Decision:** The on-device open-source model path is the hackathon deliverable and is prioritised over everything else. Scope is time-boxed (`docs/LOCAL_AI.md` section 0). The demo runs on the team's laptop; the iPhone is a stretch goal.
- **Consequences:** A README, disclosures, a demo video, and a social post are required deliverables. Long evaluations and the Capacitor wrapper are out of scope for the deadline.

## D-013: Disclose the pre-existing base; do not disguise it

- **Status:** Accepted (2026-10-09); needs team lead confirmation and an organiser answer
- **Context:** The application base predates the hackathon (sibling repo `CrossCampus`, 139 commits, 2026-06-23 to 2026-08-22). This repo's 10 commits (2026-10-09 22:45-22:56 +0800) import it. The rules require the project to be substantially built during the hackathon, require disclosure of existing code and assets, and name a pre-existing project and fake benchmarks as dispute grounds.
- **Decision:** State the base as pre-existing in the README and submission, list precisely what was built during the hackathon, keep real commits for hackathon work, and never rewrite history to hide the import. Ask the organisers whether the project qualifies.
- **Consequences:** The pitch must lead with the new Local AI work. If organisers rule the base ineligible, the team needs a plan (for example, a smaller project built entirely during the window).

## D-014: Three confirmed learning modes (Kalma, Pakinig, Hakbang)

- **Status:** Accepted (2026-10-09, confirmed by the team lead); not implemented
- **Context:** The team wants the same lessons to fit learners with different needs. The lead supplied a definition table: Kalma (calm/focus: ADHD, autism, sensory sensitivity), Pakinig (listen: dyslexia, low vision, weak readers), Hakbang (step: dyscalculia, intellectual disability), each with UI/UX changes and local AI changes (`docs/TUTOR_MODES.md`).
- **Decision:** Build the three modes as a cross-cutting preference that changes both the UI and the tutor. Local AI behaviour is enforced in code (D-009). Hakbang unlocks Grade 1-3 content, loaded lazily and only in that mode, amending D-002. The app makes no diagnosis and no clinical or efficacy claims; modes are described as designed to support learners and any learner may use any mode.
- **Consequences:** New `pref:mode` setting and a `tutor-modes` module; tutor cache key and `/api/tutor` request gain a validated `mode`; Grade 1-3 data and validators need a lazy path; several UI items (word highlighting, voice answers, visuals) are larger than the time available before the deadline and are prioritised after the Local AI work.

## D-015: No co-authorship from any provider in git history

- **Status:** Accepted (2026-10-09, team lead)
- **Context:** Tools can add `Co-Authored-By` trailers or "generated with" lines to commits and pull requests. The team wants authorship in git to be the human team members only.
- **Decision:** Hard rule: no co-author trailers or provider attribution of any kind in commits, PR descriptions, or code. This applies to every AI tool and provider. Git identity is set per repo to the committing team member.
- **Consequences:** AI sessions must omit attribution even if their defaults say otherwise. The hackathon's AI-tool disclosure requirement is met separately, in the submission and README, not through git. Because the rule is recorded in `CLAUDE.md`, every session in this repo should see it.

## D-016: On-device model is Gemma 4 E2B

- **Status:** Accepted (2026-10-10, confirmed by the team lead); **unverified on the demo device**
- **Context:** `modes-44` measured Gemma 3 1B and Qwen3 0.6B in the browser on a Mac (`docs/ROADMAP.md` status log). The team lead had tested Gemma 4 E2B in LM Studio and confirmed it as the model. Reported by `modes-44`: Gemma 4 E2B has no WebLLM build, so it runs through transformers.js (`onnx-community/gemma-4-E2B-it-ONNX`, q4f16); its files add up to about 3.1 GB; the text-only code path is untested; it was not run in a browser.
- **Decision:** Build the on-device provider around Gemma 4 E2B via transformers.js.
- **Consequences / risks:** The demo device is an iPhone 13 with 4 GB RAM (D-017). A roughly 3 GB download and its runtime memory may not fit in an iOS web process (anecdotal kill reports near 2 GB; not an Apple figure). This must be tested on the phone first thing, not last. Fallback if it cannot load there: Gemma 3 1B (about 540 MB, measured to run on the Mac), which needs the team lead's OK. Gemma's terms must be read before shipping. The earlier candidates are fallbacks, not the plan.

## D-017: Demo device is the team lead's iPhone 13, installed PWA

- **Status:** Accepted (2026-10-10, team lead)
- **Decision:** The live demo and the recorded video run the app as an installed Home Screen PWA on an iPhone 13. Offline claims are only valid if shown there with the network off.
- **Consequences:** Physical-device testing is the priority (the simulator is not evidence). Needs the phone's iOS version (Safari WebGPU is believed to need iOS 26 or later; unverified), an HTTPS tunnel (`cloudflared` is installed on the Mac), and Safari Web Inspector. At Demo Day the phone must be shown to judges; HDMI or USB-C screen mirroring should be rehearsed. Supersedes the earlier laptop-first suggestion in `docs/HACKATHON.md` section 8.3 and `docs/LOCAL_AI.md` section 0.

---

## Pending decisions

| # | Question | Owner | Needed by |
|---|---|---|---|
| P-1 | ~~Final model and runtime~~ Decided: Gemma 4 E2B via transformers.js (D-016); still to be verified on the iPhone 13 | Team | Verify by 01:30 AM |
| P-2 | Minimum supported iPhone and iOS version | Team | M2 |
| P-3 | UX details of the modes (where chosen, mid-lesson switching, games in Kalma, Grade 1-3 unlock in hackathon scope). Definitions are confirmed | Team | M6 |
| P-4 | Translate bundled Filipino/Taglish content, or keep English fallback | Team | TBD |
| P-5 | Production hosting for app and model files | Team | TBD |
| P-6 | Port direction between `modes` and `CrossCampus` | Team | TBD |
| P-7 | Does a pre-existing project qualify; what disclosure do organisers expect | Team lead, via Telegram | Before investing further |
| P-8 | ~~Primary demo device~~ Decided: iPhone 13, installed PWA (D-017) | Team | Done |
