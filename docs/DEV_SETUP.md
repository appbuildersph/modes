# Dev Setup — Mac, iPhone Simulator, Real iPhone

Status: 2026-10-09. Written for the team's Mac (Apple Silicon, macOS 26, Xcode 27). Steps marked "you run" need the user's password or a physical action; an AI agent should not run `sudo` commands itself.

## 0. Machine state when this was written

| Item | State |
|---|---|
| Xcode | 27.0, with iOS 26.5 simulators (iPhone 17, 17 Pro, Air, and others) |
| Node / npm | 24.19 / 11.17 |
| CocoaPods | 1.17 |
| Python | system 3.9.6 (old); Homebrew `python@3.12` not installed yet |
| RAM / disk | 16 GB / about 225 GB free |
| Homebrew | installed but `/opt/homebrew` is not owned by the user, so `brew install` fails |
| Not installed | ollama, mkcert, cloudflared, Hugging Face CLI, Java, Android Studio |

## 1. Fix Homebrew permissions (you run)

```
sudo chown -R reiayanami /opt/homebrew
brew doctor
```

Common mistake: pasting a command with a trailing `# comment` into zsh. Interactive zsh does not treat `#` as a comment, so brew saw `#` as a package name and listed hundreds of similar names. Paste commands without trailing comments.

## 2. Install tools

```
brew install cloudflared python@3.12
```

Optional, only for comparing models outside the browser: `brew install ollama mkcert`, and `brew install --cask lm-studio`. For gated Hugging Face models (Gemma, Llama): create a free account, accept each model's license on its page, then `pip3 install -U "huggingface_hub[cli]"` and `hf auth login`.

The browser-based AI Lab page does not need Ollama, mkcert, or the Hugging Face CLI.

## 3. Get the repo running

```
cd /Users/reiayanami/orca/modes
npm install
npm test            # record the baseline result
npm run dev         # http://localhost:5173
```

No `.env` is needed for the offline loop. Copy `.env.example` to `.env` only to exercise cloud features.

## 4. iPhone Simulator

```
xcrun simctl list devices available | grep -i iphone
xcrun simctl boot "iPhone 17 Pro"
open -a Simulator
xcrun simctl openurl booted http://localhost:5173
```

The simulator is good for layout and basic WebGPU checks. It does **not** reproduce iOS memory kills (jetsam) and its speed numbers are not representative. Do not use simulator results as evidence for model viability.

## 5. Real iPhone over HTTPS

WebGPU and PWA install require a secure context, so `http://<mac-ip>:5173` will not do.

1. Phone on iOS 26 or later. Enable Settings -> Safari -> Advanced -> Web Inspector. Connect to the Mac by cable and trust the computer.
2. In one terminal: `npm run dev`.
3. In another: `cloudflared tunnel --url http://localhost:5173`. It prints a public `https://...trycloudflare.com` URL.
4. If Vite blocks the host, add the tunnel hostname to `server.allowedHosts` in `vite.config.js` (do this on a branch; do not commit a hardcoded tunnel host).
5. Open the URL in iPhone Safari. On the Mac: Safari -> Develop -> (your iPhone) -> the page, to see the console.
6. Check WebGPU in the console: `'gpu' in navigator` should be `true`. If it is not, the web-model route will not work on that device or OS version; stop and report.
7. Share -> Add to Home Screen to test the installed PWA (behaviour can differ from a Safari tab: storage, memory, service worker).

The tunnel URL is public and anyone with it can reach your dev server and any `/api` functions it serves. Do not put real credentials in `.env` while a tunnel is open unless you accept that. Close the tunnel when done.

## 6. Offline test procedure (manual)

1. Load the app once online so the service worker precaches the shell. Reload to confirm it is installed.
2. (Local AI only) Download the model over Wi-Fi; confirm it persists after closing and reopening the app.
3. Turn on Airplane Mode (not just Wi-Fi off, so cellular is also off).
4. Reload the app: it must show the app, not a browser error.
5. Complete a lesson and practice; ask the tutor a question; check the reply source label.
6. Turn the network back on and confirm the app recovers (the `/api/ping` probe runs every 8 seconds).

## 7. Recording results

For each device test, record: device model, iOS version, Safari tab or installed PWA, free storage, model id and quantization, download size, cold and warm load time, time to first token, tokens per second, any crash or reload, and the exact prompt used. Save as JSON or a table in the PR or an issue; keep raw logs out of the repo.

## 8. Android (later)

Needs a JDK (for example `brew install --cask zulu@21`) and Android Studio with an SDK and emulator. Only relevant if the native wrapper is revived or for Chrome-on-Android PWA testing (Chrome on Android may offer Gemini Nano via the Prompt API).

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Error: /opt/homebrew/Cellar is not writable` | Step 1 not done |
| `Warning: Cask '#' is unavailable` | A `# comment` was pasted into zsh |
| Page loads over tunnel but is blank or "Blocked request" | Vite `allowedHosts` |
| `navigator.gpu` undefined | iOS older than 26, WebGPU disabled, or in-app browser; use Safari |
| `/api/*` returns 403 `origin_not_allowed` | Origin not same-origin; add it to `QUESTION_CORS_ORIGINS` |
| Offline reload shows browser error | Service worker not installed yet; load once online, then retry |
| Model loads in simulator but not on phone | Expected possibility: real memory limits; record the failure |
