# AppBuildersPH Hackathon 2026 — Local AI

Source: `docs/reference/AppBuildersPH-Hackathon-2026-Participant-Briefing.pdf` (29 pages, dated October 9, 2026). This file is a digest. If anything here disagrees with the PDF or the official site, the official material wins; tell the user and fix this file. Facts in sections 1 to 7 are taken from the PDF (the judging, prize, and Demo Day schedule pages were also checked against rendered page images). Section 8 and the "Team's interpretation" columns in `docs/JUDGING.md` are the team's own analysis, not organiser statements. The PDF does not state a time zone; times are read as Philippine time.

Official links: `appbuildersph.com/hackathon` (official participant list), `cerebralvalley.ai/e/appbuildersph-hackathon-2026` (event page and the only place to submit), Telegram group chat (questions during the build; the invite link is in the PDF).

## 1. Format and clock


| When                     | What                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Fri Oct 9, 1:30 PM       | Online room opens; briefing 1:45; challenge reveal 2:00; rules and judging 2:10; sponsor resources and credits 2:20 |
| **Fri Oct 9, 2:30 PM**   | **Building begins** (remote, from anywhere, overnight). Optional community check-ins 6:00 PM and 10:00 PM           |
| **Sat Oct 10, 10:00 AM** | **Submission deadline. No extensions. Code freeze.** Judges review the repository as of the deadline                |
| Sat Oct 10, 12:00 PM     | Demo Day registration at Cyberzone, SM Makati; AV and demo checks 12:15; opening 1:00 PM                            |
| Sat Oct 10, 1:00 PM      | Finalists (10 to 15 teams) announced                                                                                |
| Sat Oct 10, 1:00 PM      | Official opening; PCExpress welcome 1:15; AMD segment 1:20; Cognition / Devin segment 1:30                          |
| Sat Oct 10, 1:40 PM      | Finalist pitching begins; break 3:20; pitching continues 3:40                                                       |
| Sat Oct 10, 5:00 PM      | Judging deliberation, PC Express auction and raffle; awards ceremony 5:45; networking 6:30; event ends 7:00 PM      |


When this was written it was about 11:30 PM Oct 9 (Philippine time), roughly 10.5 hours before the deadline.

## 2. The challenge

Theme: **Local AI.** Useful AI experiences where meaningful AI computation happens on the user's device rather than depending entirely on cloud inference. This is different from building an AI product for a local (Filipino) audience.

Ask: build a working product that uses AI running locally on the user's device to solve a real problem, and show why running locally creates an experience that would be difficult, expensive, slow, private, or impossible with cloud only. Any product category is allowed (education is listed).

In scope: local LLMs, vision, speech recognition, embeddings and RAG, agents, image generation, edge AI, offline AI, privacy-preserving AI, hybrid local plus cloud, AI on PCs, laptops, phones, or edge hardware. "Cloud services may be used, but meaningful AI functionality must run locally."

Example tools named: Ollama, LM Studio, llama.cpp, MLX, ONNX, PyTorch, TensorFlow, WebGPU, Core ML, AMD ROCm, DirectML, Hugging Face. No specific model, framework, OS, or hardware is required. A mobile app or hardware project is allowed.

## 3. Rules

Required:

- Substantially built during the hackathon.
- A meaningful part of AI inference executes locally.
- A working product, demonstrated.
- Models, APIs, frameworks, and major tools disclosed.
- Core Local AI functionality works without depending entirely on a cloud AI API.

Allowed: existing open-source models and libraries; AI-assisted development (Devin named); cloud APIs as secondary components.

Eligibility and conduct:

- Only participants listed on the official website may compete; teams of 1 to 4; one project per team; one team per person. Team name and members must match the official list.
- Disqualified: members not on the official list; participants proven to have received external help from people outside the hackathon.
- **Results can be disputed** if a team is proven to have broken the rules, including a **pre-existing project**, **external help**, or **fake benchmarks**.
- The GitHub repository must be **public** by the deadline. Teams keep ownership of what they build. An app need not be deployed live, but the repository must contain instructions for judges to recreate it.

## 4. Judging

Ten judges (announced on Demo Day). Weights total 100%.


| Criterion                | Weight | Question the briefing asks                                               |
| ------------------------ | ------ | ------------------------------------------------------------------------ |
| Problem and Usefulness   | 25%    | Does it solve a genuine problem for a clear target user?                 |
| Local AI Implementation  | 25%    | Is local inference fundamental, and does it give a meaningful advantage? |
| Technical Execution      | 20%    | Does it actually work, reliably enough for a live demonstration?         |
| Innovation               | 15%    | Is it meaningfully different? Does Local AI enable something new?        |
| Product and Demo Quality | 15%    | Is the UX usable, and is the live demonstration convincing?              |


The briefing's own summary: "Half the score is usefulness and how real your Local AI is." See `docs/JUDGING.md` for the mapping to this project.

## 5. Pitch format (finalists)

5 minutes to pitch and demo live, plus 3 minutes of judge Q&amp;A (8 per team). Prioritise a working product over slides. At least one team member must be on site at Cyberzone, SM Makati to pitch; remote pitching is not allowed. Bring your own laptop to demo on. Wi-Fi, power, HDMI and USB-C are available. People's Choice is an audience vote by QR code at Demo Day.

## 6. Submission checklist

Submit once, on the Cerebral Valley event page. No edits or resubmission. Only the member names in the submission are counted.

The project: name, short description, team members, public GitHub repository.
The proof: demo video (ideally about 1 minute) and an X or LinkedIn post of the video (tag Devin / Cognition and include `#AppBuildersPH`).
The disclosures: what runs locally; what requires internet; models used; technologies and frameworks; APIs and cloud services; existing code and assets; AI development tools.

**Every submission must answer: "Why does this product benefit from running AI locally?"**

A draft of these answers is in `docs/SUBMISSION.md`.

## 7. Prizes (checked against the rendered PDF page 17)


| Award                                                        | Prize                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| Grand Champion (best overall project)                        | 50,000 PHP cash, AMD / ASUS peripherals, Devin AI credits |
| WhiteCloak Award                                             | 15,000 PHP cash, WhiteCloak merch                         |
| People's Choice Award (audience vote at Demo Day by QR code) | 10,000 PHP cash                                           |
| Cognition / Devin Award                                      | 10,000 PHP cash                                           |
| Tutorials Dojo Award                                         | 10,000 PHP cash                                           |
| AMD Award                                                    | 10,000 PHP cash, AMD / ASUS peripherals                   |


Special awards may be won independently of the main award, and one project can win more than one.

## 8. What this means for this project

### 8.1 Hackathon scope and focus

1. **Focus on the hackathon deliverables:** the local model provider, edge setup, mode post-processing, tests, and documentation.
2. **Make the hackathon work visible and substantial:** real commits for the edge hub, local AI provider, tutor modes, and test coverage.
3. **Disclose existing code and assets accurately.** The briefing requires it (FAQ: "Disclose any existing code or assets") and names a "pre-existing project" as a dispute ground. The disclosure belongs in the submission form and the README (`docs/SUBMISSION.md`).

### 8.2 Local AI is the product now

Judges weigh Local AI Implementation at 25%, and the rules require core functionality not to depend entirely on a cloud API. The open-source model and local inference are therefore the centre of the submission, not a side feature. The local model must actually run in the demo. Since D-018 the model (Gemma 4 E2B) runs on the team's laptop as an edge AI server through LM Studio; the briefing's in-scope list (page 6) names "Edge AI", "Offline AI", "Hybrid local + cloud systems" and "AI on PCs, laptops, phones, or edge hardware", and page 10 names LM Studio and MLX. Describe it as running on a local edge server, never as running on the phone.

### 8.3 Demo hardware

Finalists demo on their own device and laptop (the briefing says to bring your own laptop; HDMI and USB-C are available). **Current plan (D-018, superseding D-017's on-phone model):** the model runs on the team's MacBook Air (LM Studio, Gemma 4 E2B). The strongest demo is the Mac's own browser at `http://localhost:8787` with Wi-Fi visibly off, the reply labelled as coming from the edge AI server. The iPhone 13 is shown second as a client of the same hub through the ngrok tunnel (needs venue internet). Rehearse both, rehearse screen mirroring to HDMI or USB-C, and decide in advance what is shown if the tunnel or venue Wi-Fi fails (answer: stay on the Mac). Runbook: `docs/EDGE_RUNBOOK.md`.

### 8.4 Honesty about benchmarks

"Fake benchmarks" is named as a dispute ground. Only report numbers measured on the device shown. Label simulator results as simulator results. Keep raw logs. The measured edge numbers and their raw output are in `docs/SUBMISSION.md` ("Measured performance") and `docs/benchmarks/`.

### 8.5 Time box

As of about 5:00 AM Oct 10, about 5 hours remain. Only submission items, the demo path and bug fixes fit now (checklist: `docs/SUBMISSION.md` sections 4 and 7). Do not start the Capacitor wrapper, fine-tuning or new features.

## 9. FAQ digest

- Cloud APIs: yes, as secondary components; core Local AI must not depend entirely on them. Disclose every model, framework, and API.
- Reusing earlier code: the project must be substantially built during the hackathon; disclose any existing code or assets.
- External help from people outside the hackathon: not allowed (disqualification). AI coding tools are allowed and must be disclosed.
- Can one team submit two projects: no. Change team name or members: yes, if the official list matches.
- Ask questions during the build: Telegram group chat. Concerns on Demo Day: Bryl Lim or any organising member.
- Deploy live: not required; the repository must let judges recreate the project.
- Certificates of participation: yes, on the AppBuildersPH website.