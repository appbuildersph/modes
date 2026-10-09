// One motion layer for the whole app: a springy press on every pressable thing,
// a bouncy entrance for every screen and its sections, and a pop for anything
// that appears later (cards, panels, dialogs). It runs on the Web Animations API
// and the individual `scale` / `translate` properties, so it composes with each
// screen's own `transform` rules and keyframes instead of overwriting them.
// Kalma gets soft fades only (docs/DESIGN.md: no decorative motion in Kalma);
// prefers-reduced-motion gets nothing.

export const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const SOFT = 'cubic-bezier(0.25, 0.1, 0.25, 1)'

export function motionProfile(mode, reducedMotion = false) {
  if (reducedMotion) return { enabled: false }
  if (mode === 'kalma') {
    return {
      enabled: true,
      bounce: false,
      press: { down: 0.97, downMs: 120, releaseMs: 220, release: [0.97, 1], easing: SOFT },
      screen: { ms: 260, rise: '0 0', easing: SOFT },
      section: { ms: 0, stagger: 0, max: 0 },
      pop: { ms: 200, from: 1, easing: SOFT },
    }
  }
  return {
    enabled: true,
    bounce: true,
    press: { down: 0.92, downMs: 110, releaseMs: 460, release: [0.92, 1.07, 0.97, 1.015, 1], easing: 'ease-out' },
    screen: { ms: 520, rise: '0 14px', easing: SPRING },
    section: { ms: 560, stagger: 55, max: 12, rise: '0 18px', from: 0.95, easing: SPRING },
    pop: { ms: 420, from: 0.88, easing: SPRING },
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
  const profile = () => motionProfile(document.documentElement.dataset.mode, reduceQuery?.matches)
  const seen = new WeakSet()
  let firstScreen = true

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

  function release(el, p) {
    const down = pressed.get(el)
    pressed.delete(el)
    const anim = el.animate(p.press.release.map((scale) => ({ scale })), {
      duration: p.press.releaseMs,
      easing: p.press.easing,
    })
    // Drop the held squash only once the release frames have taken over.
    anim.ready?.then(() => down?.cancel()).catch(() => down?.cancel())
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    const p = profile()
    if (!p.enabled) return
    const el = pressTarget(e.target)
    if (!el) return
    pressed.get(el)?.cancel()
    pressed.set(el, el.animate([{ scale: 1 }, { scale: p.press.down }], {
      duration: p.press.downMs,
      easing: 'cubic-bezier(0.3, 0, 0.5, 1)',
      fill: 'forwards',
    }))
  }, { passive: true, capture: true })

  const letGo = () => {
    if (!pressed.size) return
    const p = profile()
    for (const el of [...pressed.keys()]) {
      if (p.enabled) release(el, p)
      else { pressed.get(el)?.cancel(); pressed.delete(el) }
    }
  }
  window.addEventListener('pointerup', letGo, { passive: true, capture: true })
  window.addEventListener('pointercancel', letGo, { passive: true, capture: true })
  window.addEventListener('blur', letGo)

  // Keyboard and switch-access clicks (detail 0) get the whole bounce at once.
  document.addEventListener('click', (e) => {
    if (e.detail !== 0) return
    const p = profile()
    if (!p.enabled) return
    const el = pressTarget(e.target)
    if (el) el.animate([{ scale: 1 }, ...p.press.release.map((scale) => ({ scale }))], {
      duration: p.press.releaseMs + p.press.downMs,
      easing: p.press.easing,
    })
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

  function enterSections(els, p, base) {
    els.forEach((el, i) => {
      seen.add(el)
      el.animate([
        { opacity: 0, translate: p.section.rise, scale: p.section.from },
        { opacity: 1, translate: '0 0', scale: 1 },
      ], { duration: p.section.ms, delay: sectionDelay(i, p, base), easing: p.section.easing, fill: 'backwards' })
    })
  }

  function enterScreen(screen) {
    const p = profile()
    if (!p.enabled || seen.has(screen)) return
    seen.add(screen)
    const first = firstScreen
    firstScreen = false
    const fixed = getComputedStyle(screen).position === 'fixed'

    if (screen.tagName === 'NAV' || fixed) {
      // The bottom bar springs up from below the first time it appears.
      screen.animate([
        { translate: '0 110%', opacity: p.bounce ? 1 : 0 },
        { translate: '0 0', opacity: 1 },
      ], { duration: p.bounce ? 620 : p.screen.ms, delay: p.bounce ? (first ? 380 : 120) : 0, easing: p.screen.easing, fill: 'backwards' })
      return
    }

    screen.animate([
      { opacity: 0, translate: p.screen.rise, scale: p.bounce && first ? 0.94 : 1 },
      { opacity: 1, translate: '0 0', scale: 1 },
    ], { duration: first ? p.screen.ms + 180 : p.screen.ms, easing: p.screen.easing, fill: 'backwards' })

    if (!p.bounce) return
    const container = sectionsOf(screen)
    enterSections(container, p, first ? 160 : 70)
    watchLateSections(container[0]?.parentElement, p)
  }

  // Screens that fill in after an async load (lesson lists, progress) still get
  // the staggered entrance for the blocks that arrive in the first moments.
  function watchLateSections(parent, p) {
    if (!parent) return
    let n = 0
    const mo = new MutationObserver((records) => {
      const fresh = records.flatMap((r) => [...r.addedNodes]).filter((el) => isShown(el) && !seen.has(el))
      enterSections(fresh, p, 0 + n * p.section.stagger)
      n += fresh.length
    })
    mo.observe(parent, { childList: true })
    window.setTimeout(() => mo.disconnect(), 1500)
  }

  function pop(el) {
    const p = profile()
    if (!p.enabled || seen.has(el)) return
    seen.add(el)
    el.animate([
      { opacity: 0, scale: p.pop.from, translate: p.bounce ? '0 8px' : '0 0' },
      { opacity: 1, scale: 1, translate: '0 0' },
    ], { duration: p.pop.ms, easing: p.pop.easing, fill: 'backwards' })
  }

  function className(el) {
    return typeof el.className === 'string' ? el.className : el.getAttribute('class') ?? ''
  }

  // In-screen steps (onboarding pages, the next question, lesson slides) swap
  // one block for another; the incoming block bounces in with its parts staggered.
  function swapIn(el) {
    const p = profile()
    if (!p.enabled || seen.has(el) || el.getBoundingClientRect().height < 48) return
    pop(el)
    if (p.bounce) enterSections([...el.children].filter(isShown), p, 60)
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
