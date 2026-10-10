// Scroll a panel that just opened into view, after React has rendered it.
// Smooth unless the learner asked for reduced motion (Kalma also sets that look).
export function revealSoon(ref, block = 'center') {
  window.setTimeout(() => {
    ref.current?.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block,
    })
  }, 60)
}
