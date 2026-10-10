# Promo video plan: SIBOL (about 60 s)

Status: plan, written 2026-10-10 08:30 PHT. Submission closes 10:00 AM today, so this is a 90-minute production sprint, not a storyboard for next week. Everything below uses only screens that exist in the live app (`https://math-companion-edge.vercel.app`, same code as this repo) and claims already verified in `README.md` and `docs/SUBMISSION.md`.

## 1. What the hackathon asks for

From `docs/reference/AppBuildersPH-Hackathon-2026-Participant-Briefing.pdf` (page 16, FAQ page 24). There is no format, resolution, aspect or style rule. Only:

- Demo video, "ideally around 1 minute". It is part of "the proof" with the X / LinkedIn post URL, "what runs locally" and "what requires internet".
- The X or LinkedIn post of the video is required. Tag Devin / Cognition and include `#AppBuildersPH`.
- Judges weigh Problem and Usefulness 25 %, Local AI 25 %, Technical Execution 20 %, Innovation 15 %, Product and Demo Quality 15 %. "Half the score is usefulness and how real your Local AI is." The video must make the local AI visibly real.
- Project rules on top (`docs/SUBMISSION.md` section 5): record on the device used in the live pitch, show the network off on screen, never show a result that was not obtained live.

## 2. Concept: "Isang tanong, tatlong mukha" (one question, three faces)

The deck (Canva, 19 slides) already carries problem, market, evidence, business model and architecture. The video must not repeat those. The video does the one thing slides cannot: show the same question changing shape for three different children, with the AI answering while the Wi-Fi icon is crossed out.

The reference the team pointed at (Apple, "Every product carbon neutral by 2030", the Mother Nature film) works because every claim is answered by proof in the room, with a skeptic watching. The 60 s version of that idea: each mode is a claim, and the proof is the live screen, not a caption. The Spotify Wrapped lesson is colour blocking plus kinetic type: one flat colour field per beat, three words per line, hard cuts on the downbeat.

Spine of the film: the question "What is 12 + 15?" appears once in Standard mode, then morphs three times. The app already does this morph on the mode picker (`feat(onboarding): morphing preview`), so the hero shot is a real screen recording, not an After Effects mock.

Tone: warm, quiet confidence. No feature list, no bullet points, no benchmark table. One number only (reply time), and only because it proves "local".

Aspect: shoot the phone vertical, deliver 16:9 1920x1080 for the submission and the deck screen, with the phone centred and 15 % margins on flat colour. A 9:16 export for X comes free from the same timeline by cropping to the phone.

## 3. Shot list and script (60 s)

Timings sum to 60 s. VO is English with Tagalog lines where marked; captions always on (Baloo 2 for titles, Nunito for captions, Atkinson Hyperlegible in the Pakinig beat).

| Time | Shot | On screen | VO (EN; TL where marked) | Motion and sound |
|---|---|---|---|---|
| 0:00-0:04 | Cold open: Mac screen recording, Wi-Fi menu, toggle Wi-Fi off. Cut to phone-size app frame at `localhost:8787`. | Caption: "Wi-Fi: off" | (silence, then one soft hit) | Hard cut on hit. 400 ms silence before VO. |
| 0:04-0:10 | Flat cream field (#fbf1da). Kinetic type, three words per line. | "In many Filipino classrooms" / "the internet is the first thing to fail." | "Sa maraming paaralan, unang nawawala ang internet." (TL) then "So we built a math tutor that does not need it." | Words rise 24 px, 80 ms stagger, ease-out-expo. Ink #3a2e2a text. |
| 0:10-0:16 | Phone centred on yellow field (#f7d26a). Splash: cat mascot, SIBOL wordmark, START. Tap. | Title: "SIBOL" (live wordmark from the app, not a logo file) | "SIBOL. An offline-first math companion for Grade 4 to 6, in English, Tagalog, and Taglish." | Hold 2.5 s minimum on the splash. Button press squash 150 ms. Use `public/sfx/button1.wav` on the tap. |
| 0:16-0:22 | Standard mode practice screen. Learner types a question to Teacher Gabo. Reply appears with the "AI server" label. Picture-in-picture bottom left: LM Studio log line scrolling (from `docs/images/edge-inference-proof.png` style capture, recorded live). | Caption: "Gemma 4 E2B, running on our laptop. No cloud AI." | "The tutor is Gemma 4 E2B, an open model running on a laptop in the room, not in the cloud." | Hold the reply 2.5 s so it can be read. One downbeat on reply arrival. |
| 0:22-0:26 | Match cut: the question card "What is 12 + 15?" fills the frame. | Title: "One question." / "Three learners." | "Same question. Different children." | Match-cut on the card shape, 600 ms. |
| 0:26-0:36 | KALMA beat. Field goes deep green (#245d54). Mode picker morph: card turns calm, doodles vanish, "Question 1 of 5" chip. Then the Kalma practice screen with a two-sentence reply. | Mode chip: "Kalma. Calm / Focus" and a one-line "designed to support learners who find busy screens overwhelming" | "Kalma. A calm screen, one idea at a time. The tutor answers in two short sentences." | Slowest beat. Dissolves only, 900-1200 ms, no overshoot. Music drops to a single held note. Silence after the line. |
| 0:36-0:46 | PAKINIG beat. Field goes near-black (#111) with cream text (#fff7cc). Morph to the big Atkinson card, "twelve plus fifteen" with yellow word-by-word highlight, speed chips 0.8x / 0.65x. Audio: the app's own read-aloud. | Mode chip: "Pakinig. Listen" | (App voice reads the question; VO stays out.) Then VO: "Pakinig. Big text, read aloud word by word. Numbers said as words." | Audio leads. Highlight lands 150 ms before each spoken word. Cuts on phrase breaks, not on the beat. Captions large, always on. |
| 0:46-0:54 | HAKBANG beat. Field goes peach (#f4a87c) or yellow. Morph to the step card "STEP 1 OF 3: ADD THE ONES", block tiles, then a quick check question. | Mode chip: "Hakbang. Step by Step" | "Hakbang. One step per reply, then a quick check." | Most rhythmic beat. Hard cut every 1200 ms on the step counter. Linear progress bar, no spring. |
| 0:54-0:58 | Three phones side by side (Kalma, Pakinig, Hakbang) on cream, same question on all three. Wi-Fi-off icon top corner. | Line: "Replies in about a second, on our own hardware." | "Every reply came from the laptop beside the learner, in about a second." | Three cards slide in with 80 ms stagger, settle with no overshoot. |
| 0:58-1:00 | End card: SIBOL wordmark, cat mascot, "Student-centered Inclusive Bilingual Offline Learning", `#AppBuildersPH`, repo URL. | End card | "SIBOL. Learning that stays, even when the signal does not." | Hold 2 s. Music resolves. |

Reply-time wording: say "about a second" or "0.6 to 1.2 seconds, measured on the team's MacBook Air". Never a phone number, never "instant".

Tagalog VO alternative for the whole film is fine (the team is bilingual); keep captions in English so judges can read.

### Claims guardrail

Say only these: offline learning loop; Gemma 4 E2B on the team's laptop through LM Studio; Wi-Fi off on the laptop and the tutor still answers; three modes change the screen and the reply; reply rules enforced in code; three languages; Grades 4-6 MATATAG; no accounts, data on device.

Never say: runs on the phone; any phone speed; "helps with ADHD / dyslexia / autism", "proven", "improves"; Gabay or Hiyang as the name; Grade 1-3 unlock; a Tagalog voice that exists; a quality score. Mode descriptions on screen must be the exact in-app wording ("designed to support learners who ...").

## 4. Assets

### Already in hand

| Need | Have | Path |
|---|---|---|
| Wordmark | Live Baloo 2 900 text on the splash; also baked into `public/og.png` (blue background) | `src/screens/Splash.jsx`, `public/og.png` |
| Mascot | Cat with blue headphones (splash, og.png, deck); Gabo loop 384x384, 5.2 s | `public/og.png`, `public/mascot/gabo-calm.mp4` |
| Mode screens | Kalma, Pakinig, standard, mode picker, mode-switch cover, 780x1688 | `docs/images/modes/*.png` |
| Proof of local inference | Terminal plus phone frame, 51.8 tok/s | `docs/images/edge-inference-proof.png` |
| Wi-Fi off proof | Screens and log | `docs/images/verification/wifi-off-*.png`, `wifi-off-log.txt` |
| SFX | Five button clicks 0.24-0.32 s, 1.6 s sting | `public/sfx/` |
| Palette and type | Tokens in `src/index.css`; Baloo 2, Nunito, Atkinson via fontsource | `src/index.css`, `src/styles/modes.css` |
| Deck look | Royal blue field, yellow pill labels, white Baloo-style display type, cat mascot | Canva deck |

### Missing, and how to get each in under 15 minutes

1. **Transparent SIBOL wordmark.** None exists as a file. Fastest: open `http://localhost:5173`, set the browser to 3x device pixel ratio, screenshot the splash wordmark on the yellow field and key it, or render `.splash-title` on a transparent page. If a generated logo is wanted, use the image generator the team has (the goal names "gpt 2.5 sunburst") with this prompt, then vectorise the result:
   "Flat vector wordmark 'SIBOL' in a rounded, chunky, friendly display face like Baloo 2 Extra Bold, warm yellow #f7d26a fill, 2.5 px dark outline #1c1410, hard offset shadow 4 px down-right, no gradient, no texture, transparent background, 4000 px wide." Also ask for a monochrome dark-ink version for the black Pakinig field.
2. **Mascot on transparent background.** The cat exists only inside `public/og.png` on blue. Remove the background (Canva background remover works) or export it from the Canva deck slide 1 as PNG with transparency. Keep one mascot in the film: the cat. The star (`nova.png`) is the old Gabay mascot; do not mix them.
3. **Mode icons at title size.** `src/ui/ModeIcon.jsx` draws them as line art; screenshot each at 4x or re-export from the browser.
4. **Music.** Nothing usable in the repo (`miraclei.mp3` is 1.6 s). Use a royalty-free track with a clear downbeat around 90-100 BPM; it must duck fully under VO and drop to one held note during Kalma.
5. **Voice.** Record the VO yourself on the demo laptop (quiet room, phone-width distance, same calm voice as `C:\dev\appbuildersph\localai\elevenlabs-voice-clone-script.md` describes). Do not use a cloned voice in the video unless the clone already exists and is disclosed.

## 5. Captures to record (in this order, about 25 minutes)

All on the demo MacBook with LM Studio serving Gemma 4 E2B and the app at `http://localhost:8787` (edge hub) so the "AI server" label shows. Record with QuickTime screen recording at the phone frame size, 60 fps if possible. Record each twice.

1. Menu bar Wi-Fi toggled off, then the app loading and answering (this is the proof clip; keep the clock visible).
2. Splash, START, onboarding to the mode picker.
3. Mode picker: click Standard, Kalma, Pakinig, Hakbang slowly, 2 s on each, so the morph of "What is 12 + 15?" is captured cleanly.
4. Kalma practice: one tutor question, two-sentence reply.
5. Pakinig practice: tap Read again, let it read the whole question with the highlight; capture system audio.
6. Hakbang: the step card through all three steps and the check.
7. Terminal with the LM Studio log scrolling during one reply (for the picture-in-picture).

If any clip needs a second take because the model gave a weak answer, take it again; never fake a reply.

## 6. Edit and export (about 40 minutes)

- Tool: whatever the editor already knows. CapCut desktop or DaVinci Resolve both do kinetic type and colour fields in minutes. Canva's video editor can also do it and already has the deck's fonts and colours.
- Timeline: 60 s, 1920x1080, 30 fps. Phone clips scaled to about 70 % height, centred, hard 2.5 px outline and 6 px hard shadow to match the app's card style.
- Pacing budget: about 22 cuts total; the Hakbang beat is the only place with sub-1.2 s cuts.
- Type: titles Baloo 2 Extra Bold, three words per line maximum; captions Nunito 700; Pakinig beat captions in Atkinson Hyperlegible 700.
- Easing: entrances ease-out (0.22, 1, 0.36, 1) about 600 ms; exits ease-in about 300 ms; no overshoot on text. Kalma: dissolves only.
- Export: H.264, 1080p, 12-16 Mbps, AAC 48 kHz. Second export 1080x1920 for X by cropping to the phone and moving titles above it.
- Burn captions in. The post is watched muted.

## 7. Post (X or LinkedIn)

Use the draft in `docs/SUBMISSION.md` section 8 unchanged except the link. Attach the 9:16 export. Tag Devin / Cognition, include `#AppBuildersPH`. Post, copy the URL into the submission form.

## 8. Deck overlap check (Canva deck read 2026-10-10 08:30, 19 slides)

Deck arc: hook with "Ana had 8 slices. She ate 2." (slides 2-6), problem stats (7-8), "One lesson. Three ways to learn it." (10), "The AI runs in the room, not the cloud" (12), funding and path (14, 16), "Let's turn the Wi-Fi off" live demo (15), "Every child deserves a tutor that fits." (17), honest-limits appendix (18).

So the video deliberately:

- uses a different question ("What is 12 + 15?", the one the app morphs) and never the pizza-slice story;
- never shows a statistic, a funding column, or the architecture diagram;
- shows the modes moving, which slide 10 can only describe;
- opens on the Wi-Fi toggle, which doubles as the backup if the live demo on slide 15 fails;
- shares only the wordmark, the cat, the blue and yellow fields, and the word "fits" on the end card.

Deck gaps the video can fill: slides 9 ("app intro"), 11 ("mode changes"), 13 ("tts and stt model") and 19 ("cta") are still placeholders. Drop the 0:10-0:22 clip into slide 9, the 0:26-0:54 morph into slide 11, and the end card into slide 19. Slide 13 needs a sentence, not a video: device `speechSynthesis` by default, ElevenLabs optional and disclosed. Also: slide 15 says "Ask Teacher Gabay" and slide 14 says "Gabo School Hub" while the app says "Teacher Gabo". Pick one name before Demo Day; the video uses "Teacher Gabo" because that is what the screen shows.

## 9. Production log (2026-10-10, 08:45 to 09:40)

The video was built as code, not in an editor, so it can be re-rendered in two minutes when a clip or a line changes. Everything lives in the session scratchpad (`...\scratchpad\video\`, not in the repo; copy it into `tools/promo/` if the team wants to keep it):

- `script.json`: ten beats with start and end seconds, English and Tagalog voiceover lines, and kinetic title lines per language.
- `comp.html`: the composition (1920x1080, or 1080x1920 with `?v=1`), driven by a fake clock so every frame is deterministic. Scenes use the app's own tokens, fonts (Baloo 2, Nunito, Atkinson Hyperlegible from `node_modules/@fontsource`) and the exact in-app mode wording from `src/lib/tutor-modes.js` (English and Filipino strings).
- `clips.json`: which recorded app clip each scene shows and at what offset. Clips were recorded headless with Playwright from the live Vercel app at 390x844 and turned into 30 fps frame sequences (headless Chromium does not paint seeked `<video>` frames in screenshots).
- `render.mjs`: renders 30 frames per second through Chromium screenshots, pipes them to ffmpeg, then mixes voiceover, sound effects and music. `node render.mjs en|tl [vert] [--no-audio]`, run from the repo root so `playwright` resolves.
- `tts.mjs`: ElevenLabs text to speech (`eleven_multilingual_v2`, a bright young female premade voice, assistant-style delivery), sound effects (`/v1/sound-generation`: hit, tap, whoosh, chime, held note) and a 62 s music bed (`/v1/music`, with a looped pad fallback). Reads `ELEVENLABS_API_KEY` from `.env`.
- `POST.md`: the X or LinkedIn post text in English and Tagalog.

Outputs (`...\scratchpad\video\out\`): `sibol-promo-en-16x9.mp4`, `sibol-promo-tl-16x9.mp4`, `sibol-promo-en-9x16.mp4`, `sibol-promo-tl-9x16.mp4`, each 61 s, H.264, AAC.

Voice: the default is a voice designed to the brief with ElevenLabs Voice Design (`tools/promo/voice-design.json` holds the prompt: a young woman, bright and a little girly yet composed, the warm, clear, evenly paced delivery of a smartphone voice assistant, American English, no fry, no breathiness). Three previews were generated and measured on a 43-word line; the pick (saved in the account as "SIBOL assistant") had the narrowest pitch spread (104 Hz between the 10th and 90th percentile) and the most assistant-like pace (162 words per minute, against 185 to 190 for the other two), with a 222 Hz median pitch, above both premade candidates. Two premade alternates are mixed onto the same picture for comparison: Jessica (`-voice-jessica`, labels: playful, bright, warm, young, cute) and Sarah (`-voice-sarah`, labels: mature, reassuring, confident, professional). On the splash line: designed voice 262 Hz median (English and Tagalog), Jessica 204 / 193 Hz, Sarah 208 / 190 Hz. These are measurements of pitch and pace, not a listening test, and no Apple recording was used as a reference: Apple's assistant voice is not available for cloning, and matching it by ear is the team's call before posting.

What is real on screen: the Wi-Fi-off capture (`docs/images/verification/`), the LM Studio log (`docs/images/edge-inference-proof.png`), a live tutor reply in the classroom labelled "Teacher Gabo AI server" ("We can use a number line to show addition. Start at 12 on the line.", answered by the edge hub through the Vercel app during recording), the mode-picker morph of "What is 12 + 15?" (6 s per mode), and the practice question in each mode (Kalma green panel with feedback, Pakinig read-aloud highlight after "Read again", Hakbang question and check). All of it was recorded headless from the live Vercel app with the recorders in `tools/promo/`.

## 10. `localai` folder audit (done 2026-10-10 08:15)

`C:\dev\appbuildersph\localai` is not a git repo. Everything in it is already in this repo in a newer form, so nothing needs merging and nothing conflicts:

| localai | modes | Verdict |
|---|---|---|
| `hiyang-mockup/` (23:40-00:15 on 2026-10-09/10) | `mockups/hiyang/` (07:55 on 2026-10-10, files renamed `base.css`, `classroom.css`) | modes is newer; keep modes |
| `reports/Hiyang modes subjects and evidence.md` | `docs/research/learning-modes-evidence.md` | modes is the renamed, cross-linked copy; only Hiyang to Gabay wording differs |
| `reports/Philippine SPED math app business model.md` | `docs/research/sped-math-business-model.md` | identical |
| `research_notes/**` | `docs/research/**` | identical except line endings; modes adds a README |
| both PDFs | `docs/reference/` | identical bytes |
| `elevenlabs-voice-clone-script.md` | not in repo | only item not merged; a Tagalog recording script, still says "Hiyang". Copy to `docs/` only if the team records the voice and discloses it |
| `hiyang-mockup/.vercel/project.json` | not in repo | Vercel project link for the mockup; machine-local, do not commit |
