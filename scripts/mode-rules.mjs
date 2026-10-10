// Per-mode reply rules from docs/TUTOR_MODES.md, checked after applyMode().
// Shared by scripts/edge-mode-check.mjs and the launcher's live check, so both
// judge Gemma's replies the same way. Each rule returns true or a problem string.

export const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean)

export const RULES = {
  none: () => [],
  kalma: (text) => [
    sentences(text).length <= 2 || 'more than two sentences',
    !text.includes('!') || 'has an exclamation mark',
  ],
  pakinig: (text) => [
    !/\d\s*\/\s*\d/.test(text) || 'fraction written as a symbol',
    !/[=+×÷%]/.test(text) || 'math symbol left in',
    sentences(text).length <= 4 || 'more than four sentences',
  ],
  hakbang: (text) => [
    text.trim().endsWith('?') || 'does not end with a check question',
    !/\bstep\s*\d|check question\s*:/i.test(text) || 'echoes a label',
  ],
}
