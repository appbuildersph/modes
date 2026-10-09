# Roadmap and Progress Tracker

Goal: reach **100%** before the AppBuildersPH Hackathon submission deadline, **10:00 AM, Saturday October 10, 2026** (no extensions, code freezes, repo must be public). Event rules: `docs/HACKATHON.md`. Judging weights: `docs/JUDGING.md`.

## Progress

<!-- progress:start -->
**Overall: 48% complete** (48 of 100 points done; 2 points in progress, not counted).

`##########..........` 48%

| Workstream | Done | In progress | To do | |
|---|---|---|---|---|
| A. Foundation and baseline | 10 / 10 | 0 | 0 | `####################` |
| B. Local AI core: the on-device tutor | 17 / 30 | 0 | 13 | `###########.........` |
| C. Learning modes: Kalma, Pakinig, Hakbang | 11 / 20 | 0 | 9 | `###########.........` |
| D. Quality and evidence | 4 / 10 | 0 | 6 | `########............` |
| E. Submission | 6 / 30 | 2 | 22 | `####................` |
<!-- progress:end -->

How this number works:
- The work is split into five workstreams with a total of 100 points. Each task has a point value. Weights follow the judging criteria: the on-device AI and the submission carry the most.
- A task counts only when it is fully done (`[x]`). In progress (`[~]`) counts as zero, so partial work cannot inflate the number.
- "Done" needs evidence: a commit, a test, a recording, or a measured result written in the Evidence column of the log below. Do not tick a task on a belief or an estimate.
- Update the progress block with: `node scripts/roadmap-progress.mjs --write` (the script also checks that points add up to 100).

Legend: `[ ]` to do, `[~]` in progress, `[x]` done. Owners are placeholders until the team assigns them.

## A. Foundation and baseline (10 pts)

- [x] **A1** · 3 pts · owner: TadeyRuk session · Hackathon rules, judging criteria, PRD, architecture, decisions, and AI context docs written and on `main` (`CLAUDE.md`, `docs/`)
- [x] **A2** · 3 pts · owner: TadeyRuk session · Baseline verified: `npm install` OK, `npm test` 65 of 65 pass, `vite build` OK (117 precache entries)
- [x] **A3** · 2 pts · owner: TadeyRuk session · WebGPU confirmed in Chrome 154 on this Apple Silicon Mac (Metal adapter, `shader-f16`, 4 GB max buffer). Availability only; no model run yet
- [x] **A4** · 2 pts · owner: TadeyRuk session · Git identity set to TadeyRuk; hard rule against provider co-authorship recorded (`CLAUDE.md`, D-015)

## B. Local AI core: the on-device tutor (30 pts)

- [x] **B1** · 6 pts · owner: team lead decision · Model and runtime chosen: Gemma 4 E2B (D-016); runtime changed from transformers.js to LM Studio on the laptop after the in-phone attempts failed (D-018)
- [x] **B2** · 8 pts · owner: builder-agent, model-research, modes-88 · Edge AI hub provider in the tutor chain: Gemma 4 E2B in LM Studio on the team's Mac. Client `src/lib/edge-llm.js` (`9e333ea`), server backend and gateway (`c6900f9`, `160e011`). Verified: a real phone question went through the public tunnel to Gemma (hub log: `POST /api/tutor 200` in 0.65 to 1.0 s, LM Studio logged matching requests); 133 tests pass
- [~] **B3** · 6 pts · owner: modes-88 + model-research · Phones reach the hub: ngrok tunnel to `tweed-thinner-quickly.ngrok-free.dev` (claimed static domain, signed in on the Mac); PWA deployed to Vercel as `math-companion-edge.vercel.app` built with `VITE_EDGE_BASE` set to that domain; hub restarted with `QUESTION_CORS_ORIGINS` for the Vercel origin. Verified from this Mac with curl: app, manifest and service worker return 200; the ngrok host is in the bundle; the Vercel origin gets an allow-origin header; tutor answers in all three modes via `source: edge`; foreign origin gets 403. Update 05:32: Vercel redeployed (also `hiyang.vercel.app`); the team lead reported the installed PWA working on the iPhone 13. Still unrecorded: a phone screenshot, and whether that test was on mobile data
- [~] **B5** · 7 pts · owner: benchmark session · (a) and (c) done 2026-10-10 05:07 (`docs/images/verification/`); (b) reported working by the team lead at 05:32 (installed PWA from `hiyang.vercel.app`), phone screenshot still to add. Hybrid demo verified and recorded: (a) the Mac with Wi-Fi off answers from Gemma at `http://localhost:8787`; (b) the iPhone 13 through the deployed PWA and the ngrok tunnel gets an answer labelled as coming from the edge AI server; (c) with LM Studio stopped the app falls back to cloud or bundled without breaking

## C. Learning modes: Kalma, Pakinig, Hakbang (20 pts)

- [x] **C1** · 8 pts · owner: builder-agent · `src/lib/tutor-modes.js` with mode prompts and a pure, unit-tested `applyMode` enforcing each mode's reply rules in code. Commit `8bfd7bb`. Filipino spoken forms and Hakbang check questions still marked for a Filipino reviewer (D3)
- [x] **C2** · 3 pts · owner: builder-agent · Mode chosen in onboarding (new step, with description and use case) and changeable in Profile; stored as `pref:mode`, passed to the tutor, part of the cache key. Commits `9e333ea`, `be2ba8d`; 133 tests pass. Not yet checked on a phone screen
- [ ] **C3** · 3 pts · owner: TBD · Kalma UI: plain background, no music, 3D, coins or doodles, one question per screen (visual reference: `mockups/hiyang`) (spec: `docs/DESIGN.md` section 8)
- [ ] **C4** · 3 pts · owner: TBD · Pakinig UI: large font, high contrast, wide spacing, slower speech, auto read-aloud (spec: `docs/DESIGN.md` section 8)
- [ ] **C5** · 2 pts · owner: TBD · Hakbang UI: bigger StepScaffold, concrete visuals first (spec: `docs/DESIGN.md` section 8)
- [ ] **C6** · 1 pts · owner: TBD · Hakbang content: lazy Grade 1 to 3 unlock and `madali` tier question generation (stretch)

## D. Quality and evidence (10 pts)

- [x] **D1** · 4 pts · owner: builder-agent, model-research · New tests for provider selection, the edge client and backend, mode post-processing, mode preference, onboarding flow, thinking indicator, voice routing and the voice endpoint; `npm test` 133 of 133 pass (`9e333ea`, `c6900f9`, `be2ba8d`, `58621d7`)
- [ ] **D2** · 3 pts · owner: TBD · Measured results table on the demo device (model, load time, tokens per second, download size, crashes) with raw logs; real numbers only
- [ ] **D3** · 3 pts · owner: TBD · A Filipino-reading person reviews a sample of Taglish replies and the spoken forms of math symbols

## E. Submission (30 pts)

- [x] **E1** · 6 pts · owner: model-research · Root `README.md`: what runs locally and what does not, modes, architecture, quick start for one machine without accounts, requirements, env var names, measured numbers, limits. Commit `58621d7`.
- [ ] **E2** · 5 pts · owner: TBD · Final documentation in `docs/SUBMISSION.md`: what runs locally, what needs internet, models, frameworks, APIs, AI tools used
- [ ] **E3** · 2 pts · owner: TBD · Project name decided and used consistently in the submission
- [ ] **E4** · 5 pts · owner: TBD · Demo video of about 1 minute recorded on the demo device, network visibly off
- [ ] **E5** · 2 pts · owner: TBD · X or LinkedIn post of the video, tagging Devin / Cognition, with `#AppBuildersPH`
- [ ] **E6** · 3 pts · owner: TBD · Repository made public and verified from a logged-out browser
- [ ] **E7** · 5 pts · owner: TBD · Submitted on the Cerebral Valley event page before 10:00 AM (one submission, no edits)
- [x] **E8** · 2 pts · owner: team lead · Scope reduction and cleanup completed (D-019, commit `d1fc532`).

## Gates (Philippine time)

| Time | Gate | If missed |
|---|---|---|
| 01:30 AM | First load of Gemma 4 E2B attempted on the iPhone 13 (installed PWA over the HTTPS tunnel) | If it cannot load or the page is killed, propose switching to Gemma 3 1B (about 540 MB, measured on the Mac); needs the team lead's OK. Do not keep fighting a 3 GB model past 03:00 AM |
| 04:00 AM | B2 working: an on-device reply with the network off on the laptop | Stop other work; fix this first. If still failing by 06:00, demo the existing Gemini Nano path where available and disclose honestly what runs locally |
| 06:00 AM | C1 done; README draft started | Cut C3 to C6 first (see cut line) |
| 08:00 AM | Feature freeze. Rehearse the offline demo; collect D2 numbers | Do not add features after this point |
| 08:30 AM | Video recorded and posted; disclosures final | Record whatever works; never show something that was not live |
| 09:15 AM | Repo public and verified; submit | Submit even if incomplete; late means no submission |
| 10:00 AM | Deadline. Code frozen | None |

## Cut line (what to drop first if behind)

Drop in this order: C6, C5, D3, C4, C3, C2 (keep a simple switch), D2 extras. Never drop: B1 to B5, C1, D1, E1, E2, E4, E6, E7. The Local AI score (25%) and a working demo (20% plus 15%) depend on the Bs and on being able to submit.

## Decisions needed now

1. **Direction and name.** A teammate's push (`f775f4a`) adds SPED business research, an organiser idea shortlist PDF, and a "Hiyang" mockup ("Different modes for different disabilities") of the three modes. The submission name is undecided; is "Hiyang" a candidate? Is the team building on the offline math app with modes or switching to an idea from the shortlist?
2. ~~Demo device~~ **Decided (D-017):** the team lead's iPhone 13, installed PWA. Still needed: its iOS version, and a plan to show the phone to judges (screen mirroring over HDMI or USB-C).
3. **Who attends Demo Day in person** at Cyberzone, SM Makati to pitch (required for finalists).
4. **Scope boundary.** Core deliverables focused on Edge AI and learning modes.
5. ~~Model decision~~ **Decided (D-016):** Gemma 4 E2B via transformers.js. **Open risk to accept or change:** its files total about 3.1 GB (by `modes-44`'s arithmetic), the phone has 4 GB RAM, and iOS reportedly kills web processes near 2 GB. This is untested; B2 and the 01:30 AM gate decide it.
6. **Who integrates the provider.** `modes-44` proposes taking the provider in `src/lib/tutor.js` and the download UI (same file), with `tutor-modes.js` and the mode UI going to another session. The user decides; no session should start before the user says so.
7. **Model terms.** If Gemma is the chosen model, its terms must be read first (`docs/LOCAL_AI.md` section 4).

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The on-device model does not load or crashes on the demo device | No Local AI story | Gate at 04:00 AM; smallest model first; laptop before phone; honest fallback disclosure |
| Deliverables clarity | Questions during judging | Maintain clear demonstration of edge model execution and modes |
| Repository is private at the deadline | Judges cannot review | E6 is its own task; check from a logged-out browser |
| Too many parallel ideas (modes, SPED business model, shortlist ideas) | Time lost | Decision 1; one direction until 10:00 AM |
| Small-model Filipino quality is weak | Poor replies | Grounded prompts, code-enforced mode rules, bundled-explanation fallback, D3 sample check. Measured by `modes-44`: Qwen3 0.6B Tagalog is largely gibberish; Gemma 3 1B loops on the long system prompt (use a short prompt) |
| Raw model output fails the mode rules (0 to 3 of 6 pass) | Modes cannot rely on prompts | C1 post-processing in code is mandatory and moves up in priority; test on raw outputs |
| Gemma 4 E2B (about 3.1 GB text-only, about 3.4 GB with vision and audio) does not fit on the iPhone 13 (4 GB RAM); no source found that ran it on iOS Safari | Demo device cannot run the chosen model | First test (load only) on the phone by 01:30 AM; fallback Gemma 3 1B (needs the team lead's OK); disclose honestly what runs locally. The iPhone web-process kill threshold is anecdotal, so measure it |
| Merge collisions between sessions and teammates | Lost work | Small commits, pull before pushing, one owner per file; no force-pushing |

## Status log

Newest first. Write times in Philippine time and put the evidence next to the claim.

| Time | Update | Evidence |
|---|---|---|
| Oct 10 03:30 | ngrok (static domain) and Vercel deployment set up; hub restarted with the Vercel origin allowed. Checked by modes-88 with curl from this Mac: app 200, bundle contains the ngrok host, Vercel origin accepted, tutor source `edge` in kalma, pakinig and hakbang, foreign origin 403, TTS endpoint reachable. Not checked: a phone on mobile data and installing the PWA | curl runs in this session; `ngrok` process list |
| Oct 10 02:50 | Decision D-019: Repository scope reduction and cleanup. First commit `d1fc532`: 48 files, about 53,000 lines (Term printables, Grade 1-3 data, unused screens, content tooling); 133 of 133 tests, build OK. | `git show --stat d1fc532` |
| Oct 10 02:30 | Voice routing through the hub and the root README committed and pushed (`58621d7`); README claims about the phone path updated to what was actually run (iPhone 13 through a Cloudflare quick tunnel; ngrok and Vercel not run). 133 of 133 tests pass | `git log`, `npm test` |
| Oct 10 02:15 | Product notes from the user handled. Onboarding mode step with descriptions and use cases and the Ask Teacher thinking indicator built by builder-agent (`be2ba8d`, 133 tests). ElevenLabs voice verified end to end: through the hub `POST /api/tts` returns audio/mpeg in 0.45 s, through the public tunnel in 0.59 s (a tunnel call without an Origin is refused with 403); the first attempt returned 502 because the hub adapter lacked `res.send`, fixed in `160e011`. Voice in use: ElevenLabs premade Jessica (`eleven_flash_v2_5`); Sarah and Alice samples also generated; the voice is a placeholder until the team picks by ear. Real phone test through a Cloudflare quick tunnel worked (questions answered by Gemma on the Mac). Pending: README and hub routing of the app's voice (model-research), ngrok domain and Vercel (need the owner's accounts) | Hub log, curl runs, `git log` |
| Oct 10 02:10 | Edge pipeline verified end to end on the Mac. Server side by `model-research` (edge backend, mode validation, CORS header; 13 new tests), client by `builder-agent` (edge client, provider, mode picker; 91 tests), gateway by modes-88. `npm test` 104 of 104. Through the hub to Gemma 4 via LM Studio: Kalma 0.67 s, Hakbang 0.55 s, Pakinig 1.15 s, long no-mode reply 4.5 s; the builder's real `edgeAvailable`/`edgeTutor` against the live hub: true/false for live/dead, all three modes valid in 0.66 to 0.94 s; foreign origin 403, bad mode 400. Not yet tested: ngrok tunnel, deployed PWA, a phone, the UI in a browser. All work uncommitted | Terminal runs in this session |
| Oct 10 01:20 | **Pivot to edge AI (D-018).** iPhone in-browser tests: Gemma 4 E2B page killed during download; Gemma 3 1B loaded then the page crashed. Decision: Gemma 4 E2B runs in LM Studio on this Mac (127.0.0.1:1234), phones use it over the local network. Measured on the Mac with the app's prompt and mode engine: 45 to 51 tok/s; Kalma and Hakbang replies 0.65 to 1.5 s; `reasoning_effort: "none"` is required. Found: Pakinig replies came back in English and long; one Hakbang reply kept a "Check question:" label | Terminal runs in this session; user screenshots |
| Oct 10 01:00 | Builder pushed `8bfd7bb` (shared prompt plus mode engine) and `6cca992` (injectable provider chain, mode in the cache key, on-device label); re-checked here: `npm test` 82 of 82 pass, no co-author lines. iPhone 13 (Safari 27.0.1, via iPhone Mirroring) opened the lab page: WebGPU present, `shader-f16` true, max GPU buffer **683 MB**, storage quota 38.4 GB; Gemma 4 E2B download running (13%, 297 MB stored at 00:56). Load and reply not yet known | Screenshots from the user; `git log`; `npm test` |
| Oct 10 01:00 | `model-research` added detail to the Gemma 4 E2B risk: files about 3.1 GB text-only (decoder 1520 MB plus embed_tokens 1591 MB, its arithmetic from the repo listing), about 3.4 GB with vision and audio; one forum report of an iOS web process killed at 2048 MB (not Apple); nothing found that ran it on iOS Safari. Recorded in D-016 and the risk table; it also suggests an early load-only phone test, awaiting the user's go-ahead | Message from `model-research` |
| Oct 10 00:55 | `docs/DESIGN.md` written from the current code: tokens, components, accessibility audit (8 findings, including pinch-zoom disabled and low-contrast nav labels), and the UI spec for Kalma, Pakinig, Hakbang from the Hiyang mockup. Not committed | `docs/DESIGN.md` |
| Oct 10 00:40 | **Team lead decisions:** model = Gemma 4 E2B (confirmed); project name still undecided; demo device = iPhone 13 installed PWA. Recorded in D-016 and D-017 and across the docs. Conflict flagged, not resolved: about 3.1 GB model files versus a 4 GB RAM phone. Nothing has been run on the phone yet. B1 marked done (a choice, not a verification) | `docs/DECISIONS.md` D-016, D-017 |
| Oct 10 00:25 | `modes-44` reported spike results, Chrome 154 headless via Playwright on this Apple Silicon Mac only. **Gemma 3 1B** (WebLLM 0.2.85, q4f16_1): first download about 540 MB, cached load 1.2 to 1.5 s, median 53.4 tok/s, median 5.6 s per reply (300-token cap); WebLLM's shipped model record is rejected until `sliding_window_size` is set to -1; with the full tutor prompt it loops and echoes the prompt; automated rule checks passed Kalma 0/6, Pakinig 3/6, Hakbang 0/6; with a generic prompt it is coherent but uses markdown and makes arithmetic errors. **Qwen3 0.6B** (thinking off): 57.5 s first load including download (size not recorded), median 93.6 tok/s, 2.4 s per reply; rule checks 0/6 on all three modes; Tagalog output largely gibberish. Not measured: any phone, Safari, memory, crashes on device, Gemma 4 E2B, Qwen3.5, Llama 3.2, SmolLM2, Filipino quality (no Filipino reader has reviewed). 6 prompts x 3 modes, one run each. **Reported by `modes-44`, not independently re-run; raw JSON is in its scratchpad, not in the repo, so D2 stays open** | Message from `modes-44`; `research/model-lab/index.html` (untracked) |
| Oct 10 00:15 | Roadmap created. Teammate `rieCodes` pushed SPED research, idea shortlist, Hiyang mockup. Other Claude session asked for its status | `f775f4a`; message to `modes-44` |
| Oct 10 00:05 | Baseline verified: `npm install` OK, 65 of 65 tests pass, build OK, WebGPU present in Chrome 154 | Terminal output in this session; no model has been loaded yet |
| Oct 9 23:57 | Docs pushed with git identity fixed to TadeyRuk and no co-author lines | `7600bd4`, `b608318`, `ffeb89a` on `main` |

## How to update this file

1. Change a task's checkbox only with evidence, and add a row to the status log.
2. Run `node scripts/roadmap-progress.mjs --write`. It must report no problems and a total of 100.
3. Commit with a short message under the repo's git identity, with no co-author or provider attribution (hard rule in `CLAUDE.md`).
4. When the percentage hits 100, E7 is done, which means the project has been submitted.
