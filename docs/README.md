# Documentation

Start with the root `CLAUDE.md` (also useful for humans). Everything here is meant to be tracked in git and shared with all collaborators.

Key facts: the project is an **offline-first tutor**; the **model is Gemma 4 E2B running on an edge AI server** (the team's MacBook Air via LM Studio, D-018; it does not run on the phone); the **demo** is the Mac's own browser with Wi-Fi off, plus an iPhone 13 PWA as a client over a tunnel; the project **name is undecided**; it has three confirmed learning modes (Kalma, Pakinig, Hakbang).

| Document | Purpose |
|---|---|
| [HACKATHON.md](HACKATHON.md) | AppBuildersPH Hackathon 2026 (Local AI): schedule, rules, scoring, submission checklist, what it means for this repo |
| [SUBMISSION.md](SUBMISSION.md) | Draft submission: required answers, disclosures, repo checklist, video and pitch outlines |
| [JUDGING.md](JUDGING.md) | Official judging criteria and weights, mapped to the project's features |
| [PRD.md](PRD.md) | Product requirements |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the code works |
| [LOCAL_AI.md](LOCAL_AI.md) | On-device open-source model: research, plan, risks (section 0 is the time-boxed plan) |
| [EDGE_RUNBOOK.md](EDGE_RUNBOOK.md) | Start order, ngrok tunnel, Vercel deploy, verification commands, and demo-day checklist for the edge AI hub |
| [DESIGN.md](DESIGN.md) | Design system as it is today, accessibility audit, and the UI specification for the three modes |
| [TUTOR_MODES.md](TUTOR_MODES.md) | Proposed Kalma / Pakinig / Hakbang modes (unconfirmed) |
| [DEV_SETUP.md](DEV_SETUP.md) | Mac, simulator, and iPhone setup and offline test procedure |
| [DECISIONS.md](DECISIONS.md) | Decision log |

## Source material

- [Participant briefing PDF](reference/AppBuildersPH-Hackathon-2026-Participant-Briefing.pdf): the organisers' 29-page briefing dated October 9, 2026. It is the source for the hackathon rules, judging criteria, prizes, schedule, and submission requirements. The digest in `HACKATHON.md` points back to it; if the two ever disagree, the PDF wins.
- [Idea shortlist PDF](reference/AppBuildersPH-Idea-Shortlist.pdf): the team's shortlist of hackathon ideas from the ideation session on 2026-10-09.
- [SPED math app business model](research/sped-math-business-model.md): report on how an offline math app for Filipino learners with disabilities could be funded (institutional procurement, CSR, grants). Raw research notes are in [research/sped-math-business-model/](research/sped-math-business-model/).
- Hiyang mockup (`../mockups/hiyang/`): static HTML mockup of the Kalma, Pakinig and Hakbang modes on the math practice UI, with sample content and no live AI. Open `mockups/hiyang/index.html` in a browser.

Keep binary reference files small and in `docs/reference/`. Do not put secrets, credentials, or personal data in any file here.
