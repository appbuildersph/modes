# Promo video pipeline

Renders the 60 s promo as code, so a changed line or clip is a two-minute re-render. See `docs/PROMO_VIDEO.md` for the plan and shot list.

Files: `script.json` (beats, voiceover lines in English and Tagalog, title lines), `comp.html` (the composition, 1920x1080 or 1080x1920 with `?v=1`), `clips.json` (which recorded clip each scene shows, as a frame sequence), `record-clips.mjs` and `record-clips-2.mjs` (Playwright recorders for the live app), `tts.mjs` (ElevenLabs voice, sound effects, music), `render.mjs` (frame-exact render through Chromium screenshots, then the ffmpeg mix), `POST.md` (social post text).

Steps, from the repo root:

```
node tools/promo/record-clips.mjs            # clips/*.webm (the second recorder adds 09 to 12)
# screencasts hold the page in the top-left 390x844 of a 780x1688 frame, so crop when extracting:
ffmpeg -i clips/09-mode-morph-long.webm -vf "fps=30,crop=390:844:0:0,scale=420:-2" -q:v 4 clips/frames/09/%05d.jpg
node tools/promo/tts.mjs all                 # needs ELEVENLABS_API_KEY in .env; writes audio/
node tools/promo/render.mjs en               # also: tl, "en vert", "tl vert", --no-audio, --seconds N
```

`render.mjs` serves the parent folder over a local HTTP port, so keep `clips/` and `audio/` next to `comp.html` (or symlink them). Set `PROMO_CHROME` to a Chromium executable if `npx playwright install chromium` has not been run. Rendered files land in `tools/promo/out/`, which is gitignored along with `clips/` and `audio/`.

Voice variants: the default cut uses a voice designed with ElevenLabs Voice Design from `voice-design.json` (POST `/v1/text-to-voice/design`, pick a preview, POST `/v1/text-to-voice` to save it, then `tts.mjs vo --voice <id> --audio-dir audio-design`). The earlier premade "Jessica" (labels: playful, bright, warm, young, cute). `--voice EXAVITQu4vr4xnSDxMaL --audio-dir audio-sarah` on `tts.mjs`, then `render.mjs en --audio-only --vo-dir audio-sarah --suffix -voice-sarah`, remixes the same frames with "Sarah"; `--vo-dir audio --suffix -voice-jessica` does the same for Jessica (labels: mature, reassuring, confident, professional), the closer match to an Apple-assistant read. Measured on the "problem" line, both sit near 200 Hz median pitch (Jessica 211 / 200 Hz, Sarah 203 / 193 Hz, English / Tagalog). `--audio-only` reuses `out/<name>.raw.mp4`, so a voice swap takes seconds.
