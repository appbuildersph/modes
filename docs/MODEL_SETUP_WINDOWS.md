# Model Setup on Windows

Status: 2026-10-10. Windows counterpart to `docs/MODEL_SETUP.md` (read that first for the policy, model facts, and verification steps; they are the same on Windows). `docs/DEV_SETUP.md` is Mac-only. Nothing here was run on a Windows machine by the author; commands are standard but unverified, so report any that fail.

**Same rule as everywhere:** model weights are never committed to git. The app downloads them at runtime and caches them in the browser.

## 1. What works on Windows, and what does not

| Task | On Windows |
|---|---|
| Run the app, tests, build | Yes |
| Load and test the model in desktop Chrome or Edge (WebGPU) | Yes; best place for a first load check |
| Test on a real iPhone over an HTTPS tunnel | Yes |
| iOS Simulator | No (needs Xcode on a Mac) |
| Safari Web Inspector for the iPhone | No (needs Safari on a Mac); see section 5 |

If the team lead's Mac is the only machine with Safari Web Inspector, phone debugging needs that Mac. Windows collaborators can still do the desktop model checks and the tunnel.

## 2. Install tools

Open PowerShell. `winget` ships with current Windows 10 and 11.

```
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Cloudflare.cloudflared
```

Close and reopen the terminal afterwards so `PATH` updates. Check:

```
git --version
node --version
npm --version
```

The Mac used Node 24 (`docs/DEV_SETUP.md`); any current LTS should work, but report problems. Do not paste commands with a trailing `# comment` into PowerShell; keep each command on its own line.

## 3. Get the repo running

```
git clone https://github.com/appbuildersph/modes.git
cd modes
git config user.name
git config user.email
npm install
npm test
npm run dev
```

- Set your own repo-local git identity if the two `git config` lines print nothing (`git config user.name "Your Name"`, without `--global` unless you want it everywhere). Never add `Co-Authored-By` or provider attribution to commits (`CLAUDE.md`).
- The baseline on the Mac was 65/65 tests passing. Record yours.
- The dev server is at `http://localhost:5173`. No `.env` is needed for the offline loop.
- Line endings: if git warns about CRLF, leave the default (`core.autocrlf=true`); do not mass-convert files.
- Keep the repo path short and outside OneDrive-synced folders; sync and long paths cause flaky `npm install` on Windows.

## 4. Check WebGPU and load the model (desktop)

1. Use Chrome or Edge 113 or newer. Update your GPU driver first if WebGPU is missing.
2. Open `http://localhost:5173`, open DevTools (F12), and run `'gpu' in navigator`. It must be `true`. Also visit `chrome://gpu` and check that WebGPU is not listed as disabled.
3. Follow `docs/MODEL_SETUP.md` section 4: load the model, reload from cache, test offline with DevTools -> Network -> Offline, and record the numbers.
4. Need about 4 GB free on the drive holding the browser profile for the roughly 3.1 GB download (reported size, not measured). Integrated GPUs with little shared memory may fail to load it; record the GPU and the error.

The Windows result is evidence about that PC only. The iPhone 13 result is the one that matters (D-017).

## 5. Test on the iPhone from Windows

1. In one terminal: `npm run dev`.
2. In a second terminal: `cloudflared tunnel --url http://localhost:5173`. It prints a public `https://...trycloudflare.com` URL.
3. If Vite shows "Blocked request", add the tunnel hostname to `server.allowedHosts` in `vite.config.js` on a branch. Do not commit a hardcoded tunnel host.
4. Open the URL in iPhone Safari, then Share -> Add to Home Screen to test the installed PWA.
5. Check WebGPU on the phone. Without Safari Web Inspector (Mac only), you have no console. Options, none verified by the author: put a console overlay such as Eruda in a temporary local-only change (do not commit it), or have the Mac owner attach Web Inspector.
6. The tunnel URL is public. Close it when done and keep real credentials out of `.env` while it is open (`docs/DEV_SETUP.md` section 5).

Offline test procedure and what to record: `docs/DEV_SETUP.md` sections 6 and 7.

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `'node' is not recognized` | Terminal not reopened after install, or PATH not updated |
| `running scripts is disabled on this system` | PowerShell execution policy; run npm from Command Prompt, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (your call; it changes machine config) |
| `npm install` fails on `sharp` or native modules | Node version mismatch or antivirus lock; retry with Node LTS, exclude the repo folder from scanning if it persists |
| `EPERM` or locked files during install | Repo inside OneDrive or an open editor holding files; move the repo |
| `navigator.gpu` undefined in Chrome | Old browser, disabled flag, or old GPU driver |
| Model load fails with out-of-memory | Not enough GPU or shared memory; record GPU and RAM, try the fallback model from `docs/MODEL_SETUP.md` section 2 |
| Tunnel page blank or "Blocked request" | Vite `allowedHosts` (section 5, step 3) |
| `cloudflared` not found | Reopen the terminal, or run `winget install Cloudflare.cloudflared` again |

## 7. Notes for Claude sessions on Windows

- Use forward-slash paths in code and docs; do not write Windows-only paths into the repo.
- Do not run elevated (administrator) commands or change machine config without the user's say-so.
- Everything else is in `docs/MODEL_SETUP.md` section 7.
