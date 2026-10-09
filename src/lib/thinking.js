// Class for the "Teacher Gabo is thinking" indicator. Kalma gets a soft fade
// only (no bounce); reduced-motion users get static dots from the stylesheet.
export function thinkingClass(mode) {
  return mode === 'kalma' ? 'gb-thinking is-calm' : 'gb-thinking'
}
