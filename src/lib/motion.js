// One motion layer for the whole app: a springy press on every pressable thing,
// a bouncy entrance for every screen and its sections, and a pop for anything
// that appears later (cards, panels, dialogs). It runs on the Web Animations API
// and the individual `scale` / `translate` properties, so it composes with each
// screen's own `transform` rules and keyframes instead of overwriting them.
// Kalma gets soft fades only (docs/DESIGN.md: no decorative motion in Kalma);
// prefers-reduced-motion gets nothing.

// Fallback for engines without CSS linear() (Safari < 17.2).
export const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const SOFT = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const PRESS_IN = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

// A damped spring sampled into a CSS linear() easing. Multi-keyframe bounces
// interpolate linearly between stops and read as jagged; one two-keyframe
// animation on a real spring curve overshoots and settles smoothly.
// omega: stiffness in rad/s; zeta: damping ratio (< 1 overshoots).
export function springEasing(omega, zeta, points = 72) {
  const settle = Math.log(500) / (zeta * omega)
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  const stops = []
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * settle
    const x = i === points ? 1 : 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
    stops.push(Number(x.toFixed(4)))
  }
  return { easing: `linear(${stops.join(', ')})`, ms: Math.round(settle * 1000), peak: Math.max(...stops) }
}

const SPRINGS = {
  release: springEasing(38, 0.3),
  enter: springEasing(22, 0.55),
  pop: springEasing(26, 0.48),
  nav: springEasing(20, 0.62),
}

export function motionProfile(mode, reducedMotion = false, linearSupported = true) {
  if (reducedMotion) return { enabled: false }
  if (mode === 'kalma') {
    return {
      enabled: true,
      bounce: false,
      press: { down: 0.97, downMs: 120, release: { ms: 220, easing: SOFT } },
      screen: { rise: '0 0', from: 1, ms: 260, easing: SOFT },
      section: { stagger: 0, max: 0 },
      pop: { from: 1, rise: '0 0', ms: 200, easing: SOFT },
      nav: { ms: 260, easing: SOFT },
    }
  }
  const spring = (s, fallbackMs) => (linearSupported ? { ms: s.ms, easing: s.easing } : { ms: fallbackMs, easing: SPRING })
  return {
    enabled: true,
    bounce: true,
    press: { down: 0.9, downMs: 90, release: spring(SPRINGS.release, 420) },
    screen: { rise: '0 16px', from: 0.97, ...spring(SPRINGS.enter, 520) },
    section: { stagger: 50, max: 10, rise: '0 20px', from: 0.95, ...spring(SPRINGS.enter, 560) },
    pop: { from: 0.88, rise: '0 10px', ...spring(SPRINGS.pop, 440) },
    nav: spring(SPRINGS.nav, 600),
  }
}

// Delay for the nth section; capped so long screens do not take seconds to settle.
export function sectionDelay(index, profile, base = 70) {
  const s = profile.section
  return base + Math.min(index, s.max) * s.stagger
}

const PRESSABLE = [
  'button',
  'a[href]',
  'summary',
  'select',
  'label',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="button"]',
  'input[type="submit"]',
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="radio"]',
  '[role="checkbox"]',
].join(',')

const POPUP = '[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[role="alert"],[role="tooltip"],[aria-modal="true"]'
// Blocks that render after the screen is up (feedback, hints, cards loaded from
// IndexedDB). Matched on whole class-name segments, so `home-card-cta` counts.
const LATE_BLOCK = /(^|[-_\s])(card|panel|sheet|modal|popup|popover|toast|dropdown|menu|banner|feedback|result|hint|bubble|tooltip|explanation|example|step|tile|chip|badge|reward)([-_\s]|$)/
const SKIP = '.mode-transition, canvas, [data-no-motion]'

let installed = false

export function installMotion(root = document.getElementById('root')) {
  if (installed || typeof window === 'undefined' || !root) return
  if (!('animate' in Element.prototype) || !('scale' in document.documentElement.style)) return
  installed = true

  const reduceQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const linearSupported = window.CSS?.supports?.('animation-timing-function', 'linear(0, 1)') ?? false
  const profile = () => motionProfile(document.documentElement.dataset.mode, reduceQuery?.matches, linearSupported)
  const seen = new WeakSet()
  let firstScreen = true

  // Where a running animation has the element right now, so the next one starts
  // from there instead of snapping (a quick tap releases mid-squash).
  function currentScale(el) {
    const v = Number.parseFloat(getComputedStyle(el).scale)
    return Number.isFinite(v) ? v : 1
  }

  // Elements that already play their own CSS entrance (gb-pop, classroom and
  // brief slides) only get our fade; a second scale pop on top reads as a judder.
  function hasOwnEntrance(el) {
    return el.getAnimations().some((a) => typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation && a.effect?.getComputedTiming().iterations !== Infinity)
  }

  // Press: squash on pointerdown, spring back on release.
  const pressed = new Map()

  function pressTarget(target) {
    const el = target instanceof Element ? target.closest(PRESSABLE) : null
    if (!el || el.closest(SKIP)) return null
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return null
    // A <label> only bounces when it wraps a control (choice cards, toggles).
    if (el.tagName === 'LABEL' && !el.querySelector('input, select, textarea')) return null
    return el
  }

  function springBack(el, p, from) {
    el.animate([{ scale: from }, { scale: 1 }], { duration: p.press.release.ms, easing: p.press.release.easing })
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    const p = profile()
    if (!p.enabled) return
    const el = pressTarget(e.target)
    if (!el) return
    const from = currentScale(el)
    for (const a of el.getAnimations()) if (!(a instanceof CSSAnimation) && !(a instanceof CSSTransition)) a.cancel()
    pressed.set(el, el.animate([{ scale: from }, { scale: p.press.down }], {
      duration: p.press.downMs,
      easing: PRESS_IN,
      fill: 'forwards',
    }))
  }, { passive: true, capture: true })

  const letGo = () => {
    if (!pressed.size) return
    const p = profile()
    for (const [el, down] of pressed) {
      const from = currentScale(el)
      down.cancel()
      if (p.enabled) springBack(el, p, from)
    }
    pressed.clear()
  }
  window.addEventListener('pointerup', letGo, { passive: true, capture: true })
  window.addEventListener('pointercancel', letGo, { passive: true, capture: true })
  window.addEventListener('blur', letGo)

  // Keyboard and switch-access clicks (detail 0) get a squash and spring back.
  document.addEventListener('click', (e) => {
    if (e.detail !== 0) return
    const p = profile()
    if (!p.enabled) return
    const el = pressTarget(e.target)
    if (el) springBack(el, p, p.press.down)
  }, { capture: true })

  // Entrances.
  function isShown(el) {
    if (!(el instanceof HTMLElement) || el.closest(SKIP)) return false
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return false
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.display !== 'contents' && cs.visibility !== 'hidden'
  }

  // The screen's sections are the children of its first element that actually
  // branches; most screens wrap their content in one or two layout divs.
  function sectionsOf(screen) {
    let node = screen
    for (let depth = 0; depth < 4; depth++) {
      const kids = [...node.children].filter(isShown)
      if (kids.length !== 1) return kids.filter((el) => getComputedStyle(el).position !== 'fixed')
      node = kids[0]
    }
    return []
  }

  function enter(el, motion, delay = 0) {
    seen.add(el)
    const own = hasOwnEntrance(el)
    el.animate([
      own ? { opacity: 0 } : { opacity: 0, translate: motion.rise, scale: motion.from },
      own ? { opacity: 1 } : { opacity: 1, translate: '0 0', scale: 1 },
    ], { duration: motion.ms, delay, easing: motion.easing, fill: 'backwards' })
  }

  function enterSections(els, p, base) {
    els.forEach((el, i) => enter(el, p.section, sectionDelay(i, p, base)))
  }

  function enterScreen(screen) {
    const p = profile()
    if (!p.enabled || seen.has(screen)) return
    seen.add(screen)
    const first = firstScreen
    firstScreen = false

    if (screen.tagName === 'NAV' || getComputedStyle(screen).position === 'fixed') {
      // The bottom bar springs up from below the first time it appears.
      screen.animate([
        { translate: '0 110%', opacity: p.bounce ? 1 : 0 },
        { translate: '0 0', opacity: 1 },
      ], { duration: p.nav.ms, delay: p.bounce ? (first ? 380 : 120) : 0, easing: p.nav.easing, fill: 'backwards' })
      return
    }

    // The screen itself only fades and rises; the sections carry the bounce,
    // so the two do not stack into a double overshoot.
    screen.animate([
      { opacity: 0, translate: p.bounce ? '0 8px' : '0 0', scale: p.bounce && first ? p.screen.from : 1 },
      { opacity: 1, translate: '0 0', scale: 1 },
    ], { duration: p.bounce ? 360 : p.screen.ms, easing: p.bounce ? PRESS_IN : p.screen.easing, fill: 'backwards' })

    if (!p.bounce) return
    const container = sectionsOf(screen)
    enterSections(container, p, first ? 140 : 50)
    watchLateSections(container[0]?.parentElement, p, container.length)
  }

  // Screens that fill in after an async load (lesson lists, progress) still get
  // the staggered entrance for the blocks that arrive in the first moments.
  function watchLateSections(parent, p, already) {
    if (!parent) return
    let n = already
    const mo = new MutationObserver((records) => {
      const fresh = records.flatMap((r) => [...r.addedNodes]).filter((el) => isShown(el) && !seen.has(el))
      // Continue the same capped stagger rather than queueing ever-longer delays.
      fresh.forEach((el) => enter(el, p.section, Math.min(n++, p.section.max) * p.section.stagger * 0.5))
    })
    mo.observe(parent, { childList: true })
    window.setTimeout(() => mo.disconnect(), 1500)
  }

  function pop(el) {
    const p = profile()
    if (!p.enabled || seen.has(el)) return
    enter(el, p.pop)
  }

  // In-screen steps (onboarding pages, the next question, lesson slides) swap
  // one block for another; the incoming block bounces in with its parts staggered.
  function swapIn(el) {
    const p = profile()
    if (!p.enabled || seen.has(el) || el.getBoundingClientRect().height < 48) return
    if (!p.bounce) return enter(el, p.pop)
    seen.add(el)
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'backwards' })
    enterSections([...el.children].filter(isShown), p, 0)
  }

  function className(el) {
    return typeof el.className === 'string' ? el.className : el.getAttribute('class') ?? ''
  }

  const observer = new MutationObserver((records) => {
    // React removes the old block and inserts the new one as separate records
    // on the same parent, so a swap is "added under a parent that also lost one".
    const lost = new Set(records.filter((r) => r.removedNodes.length && r.target !== root).map((r) => r.target))
    const swapped = new Set(records.filter((r) => lost.has(r.target)).flatMap((r) => [...r.addedNodes]))
    const added = records.flatMap((r) => [...r.addedNodes]).filter((n) => n instanceof HTMLElement)
    const screens = added.filter((el) => el.parentElement === root)
    for (const el of screens) if (isShown(el)) enterScreen(el)
    for (const el of added) {
      if (screens.includes(el) || screens.some((s) => s.contains(el)) || !isShown(el)) continue
      if (swapped.has(el)) swapIn(el)
      else if (el.matches(POPUP) || LATE_BLOCK.test(className(el))) pop(el)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  // Whatever is already on screen at install time is the startup entrance.
  for (const el of root.children) if (isShown(el)) enterScreen(el)
}
