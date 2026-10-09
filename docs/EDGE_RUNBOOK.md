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
| ngrok account, authtoken, free static domain | ngrok.com dashboard; the owner runs `ngrok config add-authtoken <token>` themselves | not yet run |
| Vercel project for the PWA | see section 5; owner: the team lead | not yet run |

## 2. Start order (every session)

Run each in its own terminal, in this order. Keep the Mac plugged in and awake.

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

## 3. Verify (copy and paste)

Local, no tunnel (**verified**):

```
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/api/ping        # 204
curl -s http://127.0.0.1:8787/api/tutor -X POST -H 'Content-Type: application/json' \
  -d '{"question":"Paano ko idadagdag ang 3/4 at 1/2?","ref":"4NA-IIe-1","lang":"taglish","mode":"kalma"}'
# {"text":"...","source":"edge"} in about 0.6 s
```

Through the tunnel (**not yet run**): the same `/api/ping` and `/api/tutor` calls against `https://<your-name>.ngrok-free.app`, adding `-H 'Origin: https://<your-vercel-domain>' -H 'ngrok-skip-browser-warning: 1'`. A request from any other origin must return 403.

Hybrid, no internet (**not yet run**): turn the Mac's Wi-Fi off, open `http://localhost:8787`, Profile, pick a mode, open a lesson, ask the tutor. The reply must be labelled as coming from the edge AI server.

Failure path (**not yet run**): stop LM Studio (`lms server stop`); the app must still answer from the cloud or the bundled explanation without an error screen.

## 3b. Demo Day settings

- **Rate limits.** The server limits requests per client address (`x-forwarded-for`): tutor 10 per minute and voice 30 per minute by default. On shared venue Wi-Fi every phone arrives from the same public address, so judges would share that budget and fall back to bundled text mid-demo. Put `TUTOR_RATE_LIMIT=60` and `TTS_RATE_LIMIT=60` in `.env` and restart the hub (done on this Mac on 2026-10-10; tested: 14 rapid tutor requests from one address all returned 200). `EDGE_TTS_MAX_PER_HOUR` (default 300) still caps tunnelled voice calls.
- **ElevenLabs quota.** The Starter plan allows 39,749 characters per month (379 used on 2026-10-10). A spoken reply is roughly 100 to 200 characters, so the plan covers a few hundred replies in total. When the quota runs out the endpoint returns an error and the app falls back to the phone's built-in voice.
- **ngrok free plan limits** (reported by `builder-agent` from ngrok's documentation, not checked by us): about 20,000 HTTP requests per month, 4,000 per minute, 1 GB transfer per month, 3 endpoints. Enough for a demo. The tunnel is a third-party service and must be disclosed in the submission (`docs/SUBMISSION.md`).

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
