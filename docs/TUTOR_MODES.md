# Tutor Modes — Kalma, Pakinig, Hakbang

Status: **PROPOSED, UNCONFIRMED, NOT IMPLEMENTED.** On 2026-10-09 these three names and their one-line rules were passed along from a research session. Nothing in `src/` or `api/` implements modes today; the only matches for "hakbang" in the code are the ordinary Tagalog word for "step" in UI strings. The team must confirm or replace these definitions before anyone builds on them.

## 1. Proposed definitions

| Mode | Rule as received | Likely intent (inferred from the Filipino words; confirm) |
|---|---|---|
| **Kalma** | Reply in two short sentences | Calm, minimal replies; low cognitive load |
| **Pakinig** | No symbols or markdown | Written to be heard: text-to-speech friendly, no characters a voice would mispronounce |
| **Hakbang** | One step plus a check question | Guided step-by-step teaching: reveal one step, then ask the learner to verify or continue |

## 2. How modes relate to the rest of the app

- The tutor already has a global rule set (plain text, no markdown, guide step by step, short and warm, Filipino real-life examples, never just give the final answer). Modes are a *tighter layer on top*, not a replacement.
- Modes should apply to every provider (on-device model, cloud `/api/tutor`, bundled explanation) so behaviour is consistent offline and online.
- Hard rules must be enforced **in code after generation**, not only in the prompt, because small on-device models follow prompt rules unreliably.

## 3. Proposed enforcement (per mode)

| Mode | Prompt instruction | Post-processing in code |
|---|---|---|
| Kalma | "Reply in exactly two short sentences." | Split into sentences, keep the first two, trim length, drop trailing fragments |
| Pakinig | "Write for listening. Use words, not symbols." | `stripMarkdown`; replace digits-with-symbols for speech (for example "3/4" -> "three fourths", "x" -> "times", "=" -> "equals", "%" -> "percent"); remove emoji and bullets; localise the spelled-out words to the active language |
| Hakbang | "Give only the next single step, then ask one question to check understanding." | Keep one step plus one sentence ending in a question mark; if no question is present, append a templated check question in the active language |

All modes: remove `<think>...</think>` content, collapse whitespace, reject empty replies, and fall through to the next provider when the result fails validation.

## 4. Proposed module (not built)

`src/lib/tutor-modes.js`:

```
MODES = { kalma, pakinig, hakbang }          // id, label per language, prompt fragment
modePrompt(modeId, lang) -> string           // appended to the shared gabayPrompt
applyMode(modeId, lang, text) -> string      // pure, deterministic post-processing
```

Keep `applyMode` pure and unit-tested in `test/` with fixed inputs (it is the part that gives the guarantees). The server `api/tutor.js` should accept a validated `mode` field (allow-list) and reuse the same prompt fragment.

## 5. UI questions to answer

- Does the learner choose the mode, or does the app choose it (for example Pakinig when audio is on, Hakbang in practice)?
- Where does it appear: Classroom "Ask" panel, Profile settings, or both?
- Are the labels shown in all three languages?
- Should the cache key include the mode? (Yes, otherwise a Kalma answer is served as a Hakbang answer.)

## 6. Evaluation

For the on-device model evaluation (`docs/LOCAL_AI.md` section 8), use about 30 prompts per mode. Score two things separately: raw model output compliance (to learn how much the model needs help), and post-processed output compliance (which must be 100%).

## 7. Open questions for the team

1. Confirm the three modes and their exact rules. Are there more?
2. Who chooses the mode, and where is it set?
3. Exact wording of the templated check question for Hakbang in English, Tagalog, and Taglish (needs a Filipino-reading reviewer).
4. Spoken forms for math symbols and fractions in Tagalog and Taglish (needs review).
