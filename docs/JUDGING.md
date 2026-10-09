# Judging Criteria

Status: criteria supplied by the AppBuildersPH Hackathon 2026 participant briefing (`docs/reference/AppBuildersPH-Hackathon-2026-Participant-Briefing.pdf`, page 14), filled in 2026-10-09. Event rules and logistics are in `docs/HACKATHON.md`. The team lead may add anything the organisers say beyond the PDF (for example judge identities, announced on Demo Day) under "Additions".

## How to use this file (for AI sessions)

1. Treat these criteria as the highest-priority input for prioritisation, demo planning, and documentation emphasis. Where they conflict with `docs/PRD.md`, tell the user; do not silently change the PRD.
2. Half of the score is "usefulness and how real your Local AI is". A flashy demo of something that does not run locally scores poorly on the criterion that carries 25%.
3. Only claim what is verified. "Fake benchmarks" and a "pre-existing project" are named dispute grounds. See `docs/HACKATHON.md` section 8.

## 1. Event and context

| Field | Value |
|---|---|
| Event | AppBuildersPH Hackathon 2026, theme **Local AI** |
| Format | 24-hour build (remote, Oct 9 from 2:30 PM), then in-person Demo Day Oct 10 at Cyberzone, SM Makati |
| Submission deadline | 10:00 AM, Oct 10, 2026. No extensions, no resubmission, code freeze |
| Finalists | 10 to 15 teams, announced 1:00 PM Oct 10 |
| Pitch | 5 minutes pitch and live demo, 3 minutes judge Q&A |
| Judges | 10 judges, announced on Demo Day |
| Team | Hackathon team (up to 4 allowed); at least one member on site to pitch |

## 2. Criteria

| # | Criterion | Weight | Official question | Team's interpretation | Where the project speaks to it |
|---|---|---|---|---|---|
| 1 | Problem and Usefulness | 25% | Does it solve a genuine problem for a clear target user? | Filipino Grade 4-6 learners with unreliable internet need a math tutor that works offline, is grounded in DepEd MATATAG, and does not need an account or send a child's questions to a server | MATATAG-grounded curriculum (155 competencies, 1,571 items), offline-first loop, trilingual UI and tutor, no accounts |
| 2 | Local AI Implementation | 25% | Is local inference fundamental, and does it give a meaningful advantage? | The tutor model runs locally on hardware the class controls (edge AI, in scope per briefing p.6); offline answers on the laptop, children's questions not sent to a cloud AI API, no per-question cost | Built (D-018): Gemma 4 E2B in LM Studio (MLX) on the team's MacBook Air, behind `scripts/edge-hub.mjs`; phones use it over a tunnel. Measured numbers in `docs/SUBMISSION.md`. The in-phone model was tried and failed (D-018) |
| 3 | Technical Execution | 20% | Does it actually work, reliably enough for a live demonstration? | Reliable offline demo with fallbacks; no crash; graceful failure | Existing fallback chains; the demo path must be rehearsed with the network off; physical-device evidence |
| 4 | Innovation | 15% | Is it meaningfully different? Does Local AI enable something new? | Offline AI tutoring in Taglish for children from a local edge server, with three accessibility-oriented modes (Kalma, Pakinig, Hakbang) that change both the interface and how the local AI replies | Local model plus the three confirmed learning modes (Kalma, Pakinig, Hakbang) enforced in code; verified arithmetic checks |
| 5 | Product and Demo Quality | 15% | Is the UX usable, and is the live demonstration convincing? | Child-friendly UI, one clear story, working live | Existing mobile-first UI, mascot, games, 3D classroom; demo script in `docs/SUBMISSION.md` |

Official source: the participant briefing PDF, page 14, "HOW YOU'LL BE SCORED / Judging criteria". The briefing's summary line: "Half the score is usefulness and how real your Local AI is."

## 3. Rules, constraints, and disqualifiers

(Full list in `docs/HACKATHON.md` section 3.)

- Substantially built during the hackathon; existing code and assets must be disclosed.
- A meaningful part of AI inference must run locally; core functionality must not depend entirely on a cloud AI API.
- Working product, demonstrated live.
- Public GitHub repository by the deadline; instructions for judges to recreate it (live deployment not required).
- Models, APIs, frameworks, major tools, and AI development tools disclosed.
- Disqualified: unlisted members; external help from people outside the hackathon.
- Disputable: pre-existing project, external help, fake benchmarks.

## 4. Scoring rubric details

No anchors (for example "5 = exceptional") were published in the briefing. Add any the organisers give. Until then, use the official questions in section 2 as the rubric.

## 5. Mapping: features to criteria

| Feature or evidence | Criterion it supports | Strength | Status | Gap |
|---|---|---|---|---|
| Local open-source tutor (Gemma 4 E2B on the team's laptop) answering with network off | 2 Local AI, 4 Innovation, 1 Usefulness | Strong | Built; replies verified on the Mac (also with Wi-Fi off, 2026-10-10 05:07) and on an iPhone 13 as a client | Installed PWA on the iPhone 13 reported working by the team lead (05:32); capture a phone screenshot or recording. **The most important item** |
| Works offline after first load (shell, lessons, practice, mastery) | 1 Usefulness, 3 Execution | Strong | Built and verified | Re-test offline on the demo device |
| DepEd MATATAG Grades 4-6 content, 155 competencies, 1,571 items | 1 Usefulness | Strong | Built | Bundled math curriculum and practice items |
| English / Tagalog / Taglish UI and tutor reply language | 1 Usefulness, 4 Innovation | Medium | UI built; tutor language by prompt | Small-model Taglish quality unknown |
| Learning modes Kalma / Pakinig / Hakbang (UI plus local AI changes) | 1 Usefulness (clear target learners), 4 Innovation, 5 Demo | Strong if shown working | Built: mode picker, mode-aware prompt, rules enforced in code, per-mode screens and voice, with tests | Show live; no clinical claims; Grade 1-3 unlock not built |
| Fallback chains (cache -> Nano -> edge hub -> cloud -> bundled) | 3 Execution | Strong | Built and tested; LM Studio-stopped and hub-down fallbacks checked (`docs/images/verification/`) | Rehearse live |
| Voice out and voice in | 5 Demo, 1 Usefulness | Medium | Built (online upgrade, offline fallback) | Offline spoken-question path is browser-dependent |
| 3D classroom, four mini-games, mascot | 5 Demo | Medium | Built | Keep focus on the local-AI story |
| No accounts, no client secrets, local learner data | 1 Usefulness, 2 Local AI (privacy) | Medium | Built | |
| Measured edge results (`scripts/bench-edge.mjs`, raw JSON in `docs/benchmarks/`) | 3 Execution, 2 Local AI | Strong if honest | Done on the Mac | Real numbers only; no phone-side numbers exist |

## 6. Evidence checklist

- [x] Screenshots and log with the Mac's Wi-Fi off, the local model answering (`docs/images/verification/wifi-off-*`)
- [ ] Screen recording (the demo video) with the network visibly off
- [x] Measured results table with raw output (`docs/SUBMISSION.md`, `docs/benchmarks/edge-2026-10-10.json`)
- [ ] Taglish evaluation results scored by a Filipino reader (if time allows)
- [x] `npm test` output (all pass; count in `docs/SUBMISSION.md` section 4)
- [ ] README with judge recreation steps, tested from a clean clone (partly: clone, install, test and build checked on this Mac)
- [ ] Code, framework, and asset documentation (see `docs/SUBMISSION.md`)
- [x] License review for the chosen model (Apache 2.0 per the official model card, checked 2026-10-10; see `docs/SUBMISSION.md`)

## 7. Demo script slot

See `docs/SUBMISSION.md` sections 5 and 6 for the video and pitch outlines. The 5-minute live pitch must show the local model working on the team's own laptop with the network visibly off, and must have a rehearsed fallback for each step that depends on the model.

## 8. Additions from the team lead

(Add anything the organisers said that is not in the PDF: judge names announced on Demo Day, clarifications from Telegram, rubric anchors.)

TBD

## 9. Change log

| Date | Change | By |
|---|---|---|
| 2026-10-09 | Created as a placeholder awaiting criteria | AI session |
| 2026-10-09 | Filled from the participant briefing PDF | AI session |
