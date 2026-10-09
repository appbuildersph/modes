import { useState, useSyncExternalStore } from 'react'
import calmPng from '../assets/gabo/gabo-calm.png'
import listenPng from '../assets/gabo/gabo-listen.png'
import hakbangPng from '../assets/gabo/gabo-hakbang.png'
import starPng from '../assets/gabo/gabo-star-pose.png'
import winkImg from '../assets/gabo/gabo-wink.webp'
import playImg from '../assets/gabo/gabo-play.webp'
import studyImg from '../assets/gabo/gabo-study.webp'
import headImg from '../assets/gabo/gabo-head.webp'

// One pose per learning mode; 'none' gets the cheerful default.
const POSES = {
  none: starPng,
  kalma: calmPng,
  pakinig: listenPng,
  hakbang: hakbangPng,
  // Scene poses: shown only in Standard mode, so a chosen mode keeps its own pose.
  wink: winkImg,
  play: playImg,
  study: studyImg,
  // The head alone reads better at brand-mark sizes; used as a fixed `pose`.
  head: headImg,
}

// App.jsx mirrors the mode onto <html data-mode>. Reading it here keeps every
// mascot in sync without threading `mode` through ~20 call sites.
function subscribeMode(onChange) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })
  return () => observer.disconnect()
}

function currentMode() {
  return document.documentElement.dataset.mode || 'none'
}

function useActiveMode() {
  return useSyncExternalStore(subscribeMode, currentMode, () => 'none')
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// `pose` overrides the mode-driven pose ('none' | 'kalma' | 'pakinig' | 'hakbang' | 'head').
// `scene` ('wink' | 'play' | 'study') replaces the default pose in Standard mode only.
// `animated` plays the calm clip in Kalma mode. The clip has a black background
// baked in (no alpha), so it renders inside a round badge, never loose on the page.
export function Mascot({ size = 96, className = '', float = false, alt = 'Gabo', pose, scene, animated = false }) {
  const mode = useActiveMode()
  const key = pose ?? (mode === 'none' && scene ? scene : mode)
  const src = POSES[key] ?? POSES.none
  const [videoFailed, setVideoFailed] = useState(false)

  if (animated && key === 'kalma' && !videoFailed && !prefersReducedMotion()) {
    return (
      <video
        className={`gb-mascot-video ${className} shrink-0`}
        style={{ width: size, height: size }}
        width={size}
        height={size}
        poster={calmPng}
        autoPlay
        loop
        muted
        playsInline
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        onError={() => setVideoFailed(true)}
      >
        <source src="/mascot/gabo-calm.webm" type="video/webm" />
        <source src="/mascot/gabo-calm.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
      </video>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`${float ? 'gb-float' : ''} ${className} shrink-0 object-contain`}
      style={{ width: size, height: size }}
    />
  )
}

export function SpeechBubble({ children, speaking = false }) {
  return (
    <div className={`relative gb-card bg-white p-4 text-ink ${speaking ? 'ring-4 ring-mint/50' : ''}`}>
      <div className="text-base leading-snug">{children}</div>
      <div className="absolute -bottom-3 left-8 h-5 w-5 rotate-45 border-b-[2.5px] border-r-[2.5px] border-outline bg-white" />
    </div>
  )
}
