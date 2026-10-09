// First-run flow decisions, kept pure so they are testable without the DOM.

// Grade, name, learning mode, greeting, mastery intro.
export const ONBOARDING_STEPS = 5

// A returning learner who already has a name goes straight to home.
export function screenAfterSplash(studentName) {
  return studentName ? 'home' : 'onboarding'
}
