# Model Setup — how collaborators initialise the on-device AI

Status: 2026-10-10. Read this if you (or your Claude session) need to get the local model running. Machine, simulator, and iPhone steps are in `docs/DEV_SETUP.md` (Mac); this file covers only the model. On Windows, also read `docs/MODEL_SETUP_WINDOWS.md`.

**Superseded for the demo (D-018).** This file describes the in-browser route, which failed on the iPhone 13 (Gemma 4 E2B's page was killed during download; Gemma 3 1B loaded, then crashed). The model now runs on the team's laptop in LM Studio; use `docs/EDGE_RUNBOOK.md` and the README Quick start instead. Kept for reference. Sizes below are reported file-size sums, not measurements.

## 1. Policy: the model is NOT in the repo

- Model weights are never committed. They are about 3.1 GB (text-only q4f16), GitHub rejects files over 100 MB, the repo must be public, and history cannot be rewritten (hackathon honesty rules).
- The app downloads the model at runtime from Hugging Face and caches it in the browser (Cache Storage / IndexedDB). After the first download it works with the network off.
- Do not add `.onnx`, `.gguf`, `.safetensors`, or other weight files to git. If one appears in `git status`, remove it.
- Model files are a disclosed third-party asset: record the model name, source URL, and license in `docs/SUBMISSION.md`. Read Gemma's terms before shipping.

## 2. What the model is

| Item | Value (D-016) |
|---|---|
| Model | Gemma 4 E2B, instruction-tuned |
| Runtime | transformers.js in the browser (WebGPU); no WebLLM build exists |
| Weights | `onnx-community/gemma-4-E2B-it-ONNX`, q4f16 |
| Size | about 3.1 GB text-only (decoder about 1520 MB plus embed_tokens about 1591 MB), about 3.4 GB with vision and audio |
| Fallbacks | cloud tutor and bundled explanations (already in the chain), then Gemma 3 1B (about 540 MB), Qwen3, SmolLM2 |

Keep the model ID in one config constant so it can be swapped without touching call sites. Candidates are not final; do not hardcode a model in submission text beyond what D-016 records.

## 3. First-time setup

```
git clone https://github.com/appbuildersph/modes.git
cd modes
npm install
npm test            # baseline was 65/65 passing on 2026-10-10
npm run dev         # http://localhost:5173
```

No `.env` is needed for the offline loop. Use Chrome or Edge 113+ on a desktop with WebGPU for the first model check: open DevTools and confirm `'gpu' in navigator` is `true`.

Requirements for the first download:
- A stable Wi-Fi connection and about 4 GB free disk for the browser cache.
- Hugging Face access. The ONNX repo is expected to be public; if it asks for a license acceptance or login, accept Gemma's terms on the model page first (`hf auth login` only for CLI use).

## 4. Verifying the model (do this before building on it)

1. Load the model once online. Record download size and time.
2. Reload and confirm it loads from cache with no network request for weights.
3. Turn the network fully off (desktop: DevTools offline; phone: Airplane Mode) and ask a question.
4. Record: device, browser or PWA, free storage, model ID and quantisation, cold and warm load time, time to first token, tokens per second, any crash or reload, and the exact prompt.
5. Repeat on the iPhone 13 as an installed PWA (`docs/DEV_SETUP.md` section 5). This is the result that matters; the Mac and simulator are not evidence for the phone.

If the model does not load on the phone (memory kill, no WebGPU, quota), stop and report it. Do not work around it by claiming it works. Fall back in the order listed in section 2.

## 5. Rules for code that uses the model

- Best-available-first chain stays: on-device model, then cloud, then bundled explanation. The app must still teach with the network off.
- Enforce output rules in code after generation (strip markdown, length limit, mode rules for Kalma / Pakinig / Hakbang). Small models break prompt-only rules.
- Never log or store learner questions off-device. Learner data stays in IndexedDB via `idb-keyval`, not `localStorage`.
- Do not send client-supplied system prompts to the server (`api/tutor.js` builds them).

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `navigator.gpu` undefined | Browser or OS without WebGPU (iOS older than 26 is believed to lack it; unverified); use desktop Chrome for the first check |
| Download stalls or restarts | Network drop; clear site data and retry on stable Wi-Fi |
| Quota exceeded error | Not enough free storage for about 3 GB of cache |
| Page reloads or tab dies during load on iPhone | Likely memory kill; record it, then use a fallback model |
| Replies loop or ignore the persona | Raw small-model output; apply the code-side rules in section 5 and shorten the system prompt |
| Replies are gibberish in Tagalog | Known weakness of tiny models (seen with Qwen3 0.6B); evaluate Filipino quality explicitly |

## 7. Notes for Claude sessions

- Read `CLAUDE.md` first, then `docs/DECISIONS.md` (D-008, D-016, D-017) and `docs/LOCAL_AI.md`.
- Do not commit model files, do not add provider attribution to commits, use the repo-local git identity, and pull before pushing.
- Before editing `src/lib/tutor.js` or `src/lib/tutor-modes.js`, confirm ownership with the team lead and the other sessions.
