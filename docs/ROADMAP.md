# Roadmap and Progress Tracker

Goal: reach **100%** before the AppBuildersPH Hackathon submission deadline, **10:00 AM, Saturday October 10, 2026** (no extensions, code freezes, repo must be public). Event rules: `docs/HACKATHON.md`. Judging weights: `docs/JUDGING.md`.

## Progress

<!-- progress:start -->
**Overall: 16% complete** (16 of 100 points done; 0 points in progress, not counted).

`###.................` 16%

| Workstream | Done | In progress | To do | |
|---|---|---|---|---|
| A. Foundation and baseline | 10 / 10 | 0 | 0 | `####################` |
| B. Local AI core: the on-device tutor | 6 / 30 | 0 | 24 | `####................` |
| C. Learning modes: Kalma, Pakinig, Hakbang | 0 / 20 | 0 | 20 | `....................` |
| D. Quality and evidence | 0 / 10 | 0 | 10 | `....................` |
| E. Submission | 0 / 30 | 0 | 30 | `....................` |
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

- [x] **B1** · 6 pts · owner: team lead decision · Model and runtime chosen: Gemma 4 E2B through transformers.js (D-016). Choice recorded. **Not yet loaded in a browser or on the iPhone 13; that is B2/B5 and the 01:30 AM gate**
- [ ] **B2** · 8 pts · owner: modes-44 (proposed) · Add the on-device model as a provider in `src/lib/tutor.js` (between Gemini Nano and `/api/tutor`), lazy loaded, falls through on failure
- [ ] **B3** · 6 pts · owner: modes-44 (proposed) · Download with consent and progress, persistent storage request, detect missing model and recover; Workbox must not precache or intercept model files
- [ ] **B4** · 3 pts · owner: TBD · One shared grounded prompt for client and server (fix the `gabayPrompt()` drift); student text treated as data
- [ ] **B5** · 7 pts · owner: TBD · Offline end to end on the iPhone 13 installed PWA: network off (airplane mode), learner asks a question, an on-device reply appears and is labelled on-device (screen recorded)

## C. Learning modes: Kalma, Pakinig, Hakbang (20 pts)

- [ ] **C1** · 8 pts · owner: modes-88 / TadeyRuk session (proposed) · `src/lib/tutor-modes.js` with mode prompts and a pure, unit-tested `applyMode` enforcing each mode's reply rules in code (`docs/TUTOR_MODES.md` section 4)
- [ ] **C2** · 3 pts · owner: modes-88 / TadeyRuk session (proposed) · Mode selection stored on the device and passed to the tutor; tutor cache key includes the mode; visible mode switch
- [ ] **C3** · 3 pts · owner: TBD · Kalma UI: plain background, no music, 3D, coins or doodles, one question per screen (visual reference: `mockups/hiyang`) (spec: `docs/DESIGN.md` section 8)
- [ ] **C4** · 3 pts · owner: TBD · Pakinig UI: large font, high contrast, wide spacing, slower speech, auto read-aloud (spec: `docs/DESIGN.md` section 8)
- [ ] **C5** · 2 pts · owner: TBD · Hakbang UI: bigger StepScaffold, concrete visuals first (spec: `docs/DESIGN.md` section 8)
- [ ] **C6** · 1 pts · owner: TBD · Hakbang content: lazy Grade 1 to 3 unlock and `madali` tier question generation (stretch)

## D. Quality and evidence (10 pts)

- [ ] **D1** · 4 pts · owner: TBD · New tests added for provider selection and mode post-processing; `npm test` green
- [ ] **D2** · 3 pts · owner: TBD · Measured results table on the demo device (model, load time, tokens per second, download size, crashes) with raw logs; real numbers only
- [ ] **D3** · 3 pts · owner: TBD · A Filipino-reading person reviews a sample of Taglish replies and the spoken forms of math symbols

## E. Submission (30 pts)

- [ ] **E1** · 6 pts · owner: TBD · `README.md` so judges can recreate the project from a clean clone: what it is, why local AI, install, model setup, offline test, requirements, limitations
- [ ] **E2** · 5 pts · owner: TBD · Disclosures final in `docs/SUBMISSION.md`: what runs locally, what needs internet, models, frameworks, APIs, existing code and assets (pre-existing base stated plainly), AI tools used
- [ ] **E3** · 2 pts · owner: TBD · Project name decided and used consistently in the submission
- [ ] **E4** · 5 pts · owner: TBD · Demo video of about 1 minute recorded on the demo device, network visibly off
- [ ] **E5** · 2 pts · owner: TBD · X or LinkedIn post of the video, tagging Devin / Cognition, with `#AppBuildersPH`
- [ ] **E6** · 3 pts · owner: TBD · Repository made public and verified from a logged-out browser
- [ ] **E7** · 5 pts · owner: TBD · Submitted on the Cerebral Valley event page before 10:00 AM (one submission, no edits)
- [ ] **E8** · 2 pts · owner: TBD · Organisers asked (Telegram) whether a pre-existing project qualifies, and the answer recorded

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

1. **Direction and name.** A teammate's push (`f775f4a`) adds SPED business research, an organiser idea shortlist PDF, and a "Hiyang" mockup ("Different modes for different disabilities") of the three modes. The submission name is undecided; is "Hiyang" a candidate? Is the team building on the existing app (Gabay plus modes) or switching to an idea from the shortlist? (A switch to a new project would also change the pre-existing-project problem in `docs/HACKATHON.md` section 8.1.)
2. ~~Demo device~~ **Decided (D-017):** the team lead's iPhone 13, installed PWA. Still needed: its iOS version, and a plan to show the phone to judges (screen mirroring over HDMI or USB-C).
3. **Who attends Demo Day in person** at Cyberzone, SM Makati to pitch (required for finalists).
4. **Pre-existing project.** Ask the organisers (E8); the team lead decides what to disclose.
5. ~~Model decision~~ **Decided (D-016):** Gemma 4 E2B via transformers.js. **Open risk to accept or change:** its files total about 3.1 GB (by `modes-44`'s arithmetic), the phone has 4 GB RAM, and iOS reportedly kills web processes near 2 GB. This is untested; B2 and the 01:30 AM gate decide it.
6. **Who integrates the provider.** `modes-44` proposes taking the provider in `src/lib/tutor.js` and the download UI (same file), with `tutor-modes.js` and the mode UI going to another session. The user decides; no session should start before the user says so.
7. **Model terms.** If Gemma is the chosen model, its terms must be read first (`docs/LOCAL_AI.md` section 4).

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The on-device model does not load or crashes on the demo device | No Local AI story | Gate at 04:00 AM; smallest model first; laptop before phone; honest fallback disclosure |
| Pre-existing project ruled ineligible | Disqualification or dispute | Disclose plainly, keep real hackathon commits, ask organisers (E8) |
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
| Oct 10 01:00 | `model-research` added detail to the Gemma 4 E2B risk: files about 3.1 GB text-only (decoder 1520 MB plus embed_tokens 1591 MB, its arithmetic from the repo listing), about 3.4 GB with vision and audio; one forum report of an iOS web process killed at 2048 MB (not Apple); nothing found that ran it on iOS Safari. Recorded in D-016 and the risk table; it also suggests an early load-only phone test, awaiting the user's go-ahead | Message from `model-research` |
| Oct 10 00:55 | `docs/DESIGN.md` written from the current code: tokens, components, accessibility audit (8 findings, including pinch-zoom disabled and low-contrast nav labels), and the UI spec for Kalma, Pakinig, Hakbang from the Hiyang mockup. Not committed | `docs/DESIGN.md` |
| Oct 10 00:40 | **Team lead decisions:** model = Gemma 4 E2B (confirmed); project name still undecided; demo device = iPhone 13 installed PWA. Recorded in D-016 and D-017 and across the docs. Conflict flagged, not resolved: about 3.1 GB model files versus a 4 GB RAM phone. Nothing has been run on the phone yet. B1 marked done (a choice, not a verification) | `docs/DECISIONS.md` D-016, D-017 |
| Oct 10 00:25 | `modes-44` reported spike results, Chrome 154 headless via Playwright on this Apple Silicon Mac only. **Gemma 3 1B** (WebLLM 0.2.85, q4f16_1): first download about 540 MB, cached load 1.2 to 1.5 s, median 53.4 tok/s, median 5.6 s per reply (300-token cap); WebLLM's shipped model record is rejected until `sliding_window_size` is set to -1; with the full Teacher Gabay prompt it loops and echoes the prompt; automated rule checks passed Kalma 0/6, Pakinig 3/6, Hakbang 0/6; with a generic prompt it is coherent but uses markdown and makes arithmetic errors. **Qwen3 0.6B** (thinking off): 57.5 s first load including download (size not recorded), median 93.6 tok/s, 2.4 s per reply; rule checks 0/6 on all three modes; Tagalog output largely gibberish. Not measured: any phone, Safari, memory, crashes on device, Gemma 4 E2B, Qwen3.5, Llama 3.2, SmolLM2, Filipino quality (no Filipino reader has reviewed). 6 prompts x 3 modes, one run each. **Reported by `modes-44`, not independently re-run; raw JSON is in its scratchpad, not in the repo, so D2 stays open** | Message from `modes-44`; `research/model-lab/index.html` (untracked) |
| Oct 10 00:15 | Roadmap created. Teammate `rieCodes` pushed SPED research, idea shortlist, Hiyang mockup. Other Claude session asked for its status | `f775f4a`; message to `modes-44` |
| Oct 10 00:05 | Baseline verified: `npm install` OK, 65 of 65 tests pass, build OK, WebGPU present in Chrome 154 | Terminal output in this session; no model has been loaded yet |
| Oct 9 23:57 | Docs pushed with git identity fixed to TadeyRuk and no co-author lines | `7600bd4`, `b608318`, `ffeb89a` on `main` |

## How to update this file

1. Change a task's checkbox only with evidence, and add a row to the status log.
2. Run `node scripts/roadmap-progress.mjs --write`. It must report no problems and a total of 100.
3. Commit with a short message under the repo's git identity, with no co-author or provider attribution (hard rule in `CLAUDE.md`).
4. When the percentage hits 100, E7 is done, which means the project has been submitted.
