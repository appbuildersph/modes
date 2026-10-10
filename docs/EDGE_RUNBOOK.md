# Edge AI Hub Runbook (D-018)

Status: 2026-10-10. How to run the edge AI hub on the team's Mac, expose it to the deployed PWA, and rehearse the demo. Architecture: `docs/ARCHITECTURE.md` ("Edge AI hub"). Decision: `docs/DECISIONS.md` D-018. Steps marked **verified** were run on this Mac on 2026-10-10; steps marked **not yet run** have not been.

```
Phone (deployed PWA) -> ngrok static domain -> hub 127.0.0.1:8787 -> LM Studio 127.0.0.1:1234 (Gemma 4 E2B)
Mac browser at http://localhost:8787 -> the same hub, no internet needed
```

## 1. Prerequisites (one time)

| Item | How | State |
|---|---|---|
| LM Studio with `google/gemma-4-e2b` downloaded | already installed (4.37 GB, MLX 4-bit) | verified |
| Node 24 and `npm install` | repo root | verified |
| `.env` in the repo root (gitignored) | holds secrets such as `ELEVENLABS_API_KEY`; never commit it | verified |
| ngrok account, authtoken, free static domain | ngrok.com dashboard; the owner runs `ngrok config add-authtoken <token>` themselves | done: signed in on the Mac, static domain `tweed-thinner-quickly.ngrok-free.dev` (2026-10-10) |
| Vercel project for the PWA | see section 5 | done: project `math-companion-edge` (team xanders-projects-da0d6d9f), production at `https://math-companion-edge.vercel.app`, deployed from the CLI (no Git connection, because the repo is private) with `VITE_EDGE_BASE=https://tweed-thinner-quickly.ngrok-free.dev` (public value only; no API keys on Vercel) |

## 2. Start order (every session)

**One button (2026-10-10):** run `scripts/make-launcher-app.sh` once (needs `swiftc` from the Xcode command line tools). It builds the native macOS app `Edge AI Launcher.app` on the Desktop (source: `native/edge-launcher/EdgeLauncher.swift`). The app shows two big buttons, START and STOP. START runs every step below in order, skips what is already running, and then asks Gemma a test question. The button turns green (READY) only after Gemma has really answered. Animations: START ripples while idle, a ring spins around whichever button is working, READY pops in with a soft green glow (all off under Reduce Motion). The web page at 127.0.0.1:8700 has the same buttons. A "Tunnel for phones" card shows whether ngrok is running, whether the public URL really reaches the hub (the launcher pings `/api/ping` through the tunnel every 10 s and expects `X-Edge-Hub: 1`), and the request count; its badge reads ACTIVE, CHECKING, NGROK OFF, NO TUNNEL or NOT REACHABLE. STOP (after a confirmation) stops the hub, ngrok, keep-awake and the LM Studio server. The window is native; behind it the app runs `scripts/launcher.mjs` (the same steps, on 127.0.0.1:8700) and stops it on quit, while Gemma, the hub and the tunnel keep running. Logs: `~/Library/Logs/edge-launcher/`. Verified with the stack already running (every step reported "already running" and Gemma answered in about 1 s). A cold start from nothing has not been run yet.

**Health sections (2026-10-10):** below the status list, "Every part of SIBOL" shows one card per feature, each row green (fine), yellow (to watch), red (broken), blue (information) or hollow (not checked yet), with a count at the top. Code: `scripts/launcher-checks.mjs`; the native app renders the same `sections` from `/status`. Watched all the time: Gemma in memory (`lms ps`); **Memory (RAM)**, sampled every 3 s even with the window closed: Mac RAM used (app + wired + compressed, as Activity Monitor counts it), LM Studio with Gemma (the `footprint` of every LM Studio process, because Gemma's MLX memory is not in `ps`), peaks for the last 10 minutes and since the launcher started, swap, memory pressure, and a 10-minute chart; tutor traffic since the hub started, read from `hub.log` (answered, answer time, 502s, 429s, phones versus this Mac, voice lines and the hourly tunnel voice budget; only when the launcher started the hub); voice settings and the ElevenLabs quota; the built app (stale build, service worker, manifest, served at localhost); the bundled curriculum (counts, quality filter, explanations, lesson pages, the untranslated Tagalog question text); the Vercel PWAs and their CORS through the tunnel; the Mac (power, CPU, heat, disk); git. **CHECK EVERYTHING** (POST `/check`) runs the live check: one Gemma question per mode (rules from `scripts/mode-rules.mjs`, shared with `scripts/edge-mode-check.mjs`) and in Tagalog and Taglish (6 tutor requests), one "Kumusta!" voice line per mode (about 32 ElevenLabs characters), and `npm test`. First run 2026-10-10 08:46: all 4 modes, 3 languages and 4 voices passed, 199 of 199 tests.

Manual steps: run each in its own terminal, in this order. Keep the Mac plugged in and awake.

```
# 1. Model server (listens on 127.0.0.1 only; never expose it)
~/.lmstudio/bin/lms server start --port 1234
~/.lmstudio/bin/lms ps                       # google/gemma-4-e2b must be listed; if not: lms load google/gemma-4-e2b

# 2. Build the app so the Mac's own browser has the latest UI
cd /Users/reiayanami/orca/modes && npm run build

# 3. The hub (loads .env; allow the deployed PWA's origin)
QUESTION_CORS_ORIGINS=https://<your-vercel-domain> node --env-file=.env scripts/edge-hub.mjs

# 4. Keep the Mac awake
caffeinate -dis

# 5. The tunnel (phones only; the Mac itself does not need it)
ngrok http --url=<your-name>.ngrok-free.app 8787
```

Hub options (environment variables): `QUESTION_CORS_ORIGINS` (comma-separated PWA origins), `EDGE_LLM_URL` (default `http://127.0.0.1:1234`), `EDGE_MODEL` (default `google/gemma-4-e2b`), `EDGE_HUB_PORT` (default 8787), `EDGE_TTS_MAX_PER_HOUR` (default 300), `TTS_PROVIDER=elevenlabs`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`.

Gotcha: Gemma 4 returns empty replies unless the request sets `reasoning_effort: "none"`. The server backend already does; do not remove it.

### Quick path without any account (verified 2026-10-10)

For testing, or if ngrok or Vercel are not ready: serve the app from the hub itself and use a Cloudflare quick tunnel (no account). One URL carries the app and the AI API, so no Vercel deploy is needed.

```
EDGE_SERVE_APP=1 node --env-file=.env scripts/edge-hub.mjs
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8787      # prints https://<random>.trycloudflare.com
```

Open that URL on the phone. The hub marks its API replies with `X-Edge-Hub: 1`, so the app recognises it and uses the edge AI server provider by itself. The URL changes every time the tunnel restarts.

### Voice (ElevenLabs)

Put these in `.env` (never commit it): `ELEVENLABS_API_KEY`, `TTS_PROVIDER=elevenlabs`, `ELEVENLABS_VOICE_ID`, optionally `ELEVENLABS_MODEL` (default `eleven_flash_v2_5`, lists Filipino). Restart the hub after changing `.env`. Check: `curl -X POST http://127.0.0.1:8787/api/tts -H 'Content-Type: application/json' -d '{"text":"Kumusta!","lang":"taglish"}' -o hello.mp3` returns audio. If the voice is unset the endpoint answers 501 and the app uses the phone's built-in voice. The Starter plan allows about 39,749 characters per month.

Guards against the built-in voice taking over by accident (2026-10-10):
- **Provider.** ElevenLabs is used whenever `ELEVENLABS_API_KEY` is set. A blank, missing or differently cased `TTS_PROVIDER` no longer switches to Google; only `TTS_PROVIDER=google` does. Successful responses carry `X-TTS-Provider: elevenlabs` (or `google`).
- **Startup check.** The hub prints `Voice: ElevenLabs, N of M characters left this period`. If the key or voice is missing, or the quota is nearly used up, it prints a `!!!` warning instead. Read this line after every restart.
- **Retries.** The server retries ElevenLabs once on 429, 5xx or a dropped connection. The app retries the hub once on 429, 5xx or a network error. Neither retries a timeout or a 401/403/501, because another try can't fix those.
- **iOS playback.** The first tap unlocks one audio element, which every later line reuses. iOS refused audio started after a network wait, and that sent the phone to the built-in voice.
- **Diagnosis.** Whenever the built-in voice is used, the app logs `[voice] built-in voice used: <reason>`. Reasons include `voice server answered 502`, `device is offline` and `the browser refused to play the audio`. On the iPhone, see it in Safari Web Inspector (Mac Safari, Develop menu, the phone).

### Current live setup (2026-10-10)

- **Hub:** `EDGE_SERVE_APP=1 QUESTION_CORS_ORIGINS=https://sibol-tutor.vercel.app,https://hiyang.vercel.app,https://math-companion-edge.vercel.app node --env-file=.env scripts/edge-hub.mjs`. Keep `QUESTION_CORS_ORIGINS` when restarting, or the Vercel app's requests are refused.
- **Tunnel:** `ngrok http --url=tweed-thinner-quickly.ngrok-free.dev 8787`. Stop it with `pkill ngrok`.
- **Verified from this Mac only:** the app and its manifest and service worker, the tunnel host baked into the bundle, the origin check, tutor replies in all three modes, and the voice endpoint. **Not yet verified:** a phone on mobile data, installing the PWA, and the ngrok browser warning page for direct HTML visits.

## 3. Verify (copy and paste)

Local, no tunnel (**verified**):

```
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/api/ping        # 204
curl -s http://127.0.0.1:8787/api/tutor -X POST -H 'Content-Type: application/json' \
  -d '{"question":"Paano ko idadagdag ang 3/4 at 1/2?","ref":"4NA-IIe-1","lang":"taglish","mode":"kalma"}'
# {"text":"...","source":"edge"} in about 0.6 s
```

Through the tunnel (**not yet run**): the same `/api/ping` and `/api/tutor` calls against `https://<your-name>.ngrok-free.app`, adding `-H 'Origin: https://<your-vercel-domain>' -H 'ngrok-skip-browser-warning: 1'`. A request from any other origin must return 403.

Every mode, live (**verified 2026-10-10, 8 of 8 pass**): `node scripts/edge-mode-check.mjs` sends one question per mode in English and Tagalog. It runs each reply through `applyMode()` the same way the app does, and checks the mode rules: Kalma at most two sentences with no `!`, Pakinig with no math symbols, Hakbang ending in a check question. It exits non-zero on any failure.

Zero connectivity (**verified 2026-10-10 05:07 PHT, Mac only**): turn the Mac's Wi-Fi off, then run `node scripts/edge-mode-check.mjs` (8 of 8 passed). Next, open `http://localhost:8787`, ask the tutor, and check that the reply is labelled "Teacher Gabay AI server" (it was; `POST /api/tutor 200`). Every request stays on 127.0.0.1 (hub to LM Studio). Evidence: `docs/images/verification/wifi-off-*` and the README "Offline proof" section. The first attempt (04:50) showed only the cached explanation because the localhost build sent its AI calls to the ngrok URL; fixed in `0251388`.

Phone over local Wi-Fi or hotspot, no internet (**verified from the Mac's LAN address only, not yet from a phone**):

```
EDGE_HUB_HOST=0.0.0.0 EDGE_SERVE_APP=1 node --env-file=.env scripts/edge-hub.mjs
ipconfig getifaddr en0            # e.g. 192.168.254.150 -> open http://<that>:8787 on the phone
```

The phone and the Mac must be on the same network; a hotspot from the phone itself, with mobile data off, also works. If macOS asks whether node may accept incoming connections, allow it. Plain `http://` on a LAN address is not a secure context, so no service worker or PWA install happens there. The app still loads from the hub and the tutor still answers. `EDGE_HUB_HOST=0.0.0.0` exposes the hub to everyone on that network, so use it only on a network you trust.

Failure paths (**verified 2026-10-10 in Chrome, no page errors**):
- Model down (hub up, LM Studio unreachable): `/api/tutor` returns 502 `edge_failed`, and the app shows the lesson's explanation labelled "Cached explanation".
- Hub down (every `/api/*` request fails): the app shows its offline note and the same cached explanation.

The cached explanation is the one the lesson screen teaches (`lessonTeaching()`), passed through the mode rules. It is not the curriculum `explanation` field, which equals the competency title in 152 of 155 lessons.

Screenshots (390 px wide, Chrome, 2026-10-10), in `docs/images/verification/`:

| File | What it shows |
|---|---|
| `lan-kalma.png` | Kalma, app and tutor loaded from the hub's LAN address, reply from Gemma |
| `edge-pakinig.png` | Pakinig, a Tagalog question, reply with "ninety degrees" written as words |
| `edge-hakbang.png` | Hakbang, one step plus a check question |
| `fallback-model-down.png` | LM Studio unreachable: cached explanation, no error screen |
| `fallback-hub-down.png` | Hub unreachable: offline note and cached explanation |

## 3b. Demo Day settings

- **Rate limits.** The server limits requests per client address (`x-forwarded-for`): tutor 10 per minute and voice 30 per minute by default. On shared venue Wi-Fi every phone arrives from the same public address, so judges would share that budget and fall back to bundled text mid-demo. Put `TUTOR_RATE_LIMIT=60` and `TTS_RATE_LIMIT=60` in `.env` and restart the hub (done on this Mac on 2026-10-10; tested: 14 rapid tutor requests from one address all returned 200). `EDGE_TTS_MAX_PER_HOUR` (default 300) still caps tunnelled voice calls.
- **ElevenLabs quota.** The Starter plan allows 39,749 characters per month (379 used on 2026-10-10). A spoken reply is roughly 100 to 200 characters, so the plan covers a few hundred replies in total. When the quota runs out the endpoint returns an error and the app falls back to the phone's built-in voice.
- **ngrok free plan limits** (reported by `builder-agent` from ngrok's documentation, not checked by us): about 20,000 HTTP requests per month, 4,000 per minute, 1 GB transfer per month, 3 endpoints. Enough for a demo. The tunnel is a third-party service and must be disclosed in the submission (`docs/SUBMISSION.md`).


Per-mode voices (optional): `ELEVENLABS_VOICE_ID_KALMA`, `ELEVENLABS_VOICE_ID_PAKINIG` and `ELEVENLABS_VOICE_ID_HAKBANG` each fall back to `ELEVENLABS_VOICE_ID`. The endpoint also takes an optional `mode` (`none`, `kalma`, `pakinig`, `hakbang`); unknown values answer 400. On ElevenLabs the modes send different voice settings (Kalma steadier, Pakinig clearer, Hakbang more expressive). These settings are a starting point and were not tuned by ear; a person must listen before anyone claims the modes sound different. Google voices ignore the mode.
## 4. What the tunnel exposes

Only `/api/tutor`, `/api/ping` and `/api/tts` on the hub; everything else returns 404, and the app files are served only to `localhost`. LM Studio is never exposed. `/api/tts` costs money per character, so tunnelled calls must send an allowed `Origin` and share an hourly cap. The URL is public: anyone who knows it can send tutor questions (rate limited per IP, origin allow-listed for browsers, forgeable by non-browser clients). Stop ngrok when you are not demoing.

## 5. Deploy the PWA on Vercel (team lead)

Two ways; the CLI route also works with uncommitted code.

1. **From this folder (CLI):** `npx vercel` to log in and link, then `npx vercel --prod`. Vercel detects Vite (build `npm run build`, output `dist`).
2. **From GitHub:** import `appbuildersph/modes` into Vercel (needs Vercel access to the organisation) and deploy `main`. Only committed code is deployed.

Set the environment variable `VITE_EDGE_BASE=https://<your-name>.ngrok-free.app` **before the build** (Project Settings, Environment Variables; it is baked in at build time, so redeploy after changing it). Then restart the hub with `QUESTION_CORS_ORIGINS=https://<your-vercel-domain>`. The repository's `api/*.js` files also deploy as Vercel functions; without cloud credentials they return placeholders, and the app falls through to the next provider.

A phone can also be pointed at the hub without a rebuild: open the deployed PWA once with `?edge=https://<your-name>.ngrok-free.app` (stored on the phone as `pref:edgeBase`).

## 6. Demo-day checklist

- [ ] LM Studio running, model loaded (`lms ps`), hub running, `caffeinate` running, ngrok running
- [ ] `curl` checks in section 3 pass from the venue network (tunnel included)
- [ ] The iPhone 13 has the deployed PWA open and answers in all three modes
- [ ] A backup: the Mac's own browser at `http://localhost:8787` with the network off
- [ ] Know what to say when asked "is it on the phone?": the AI runs on the team's own machine in the classroom, with no cloud AI API; one laptop serves many phones, slower under load
- [ ] Disclosures filled in `docs/SUBMISSION.md` (ngrok, Vercel, LM Studio, Gemma 4 E2B and its license, ElevenLabs if used)

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Reply is empty or the call returns 502 `edge_failed` | LM Studio not running or the model unloaded (`lms ps`); or `reasoning_effort` was removed |
| Phone shows an HTML page or "Visit Site" instead of the app's data | ngrok warning page; edge requests must send `ngrok-skip-browser-warning: 1` |
| Browser says CORS error | `QUESTION_CORS_ORIGINS` does not list the PWA's exact origin (scheme and host, no trailing slash); restart the hub after changing it |
| 403 `origin_required` on `/api/tts` | Tunnelled TTS calls must carry an `Origin` header |
| Phone never uses the hub | `VITE_EDGE_BASE` was not set at build time, or the app was not redeployed; use the `?edge=` link as a quick fix |
| Hub says nothing at `localhost:8787` | `dist/` missing; run `npm run build` |
