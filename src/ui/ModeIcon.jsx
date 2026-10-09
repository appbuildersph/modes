import { Mascot } from './Mascot.jsx'

// Mode icon tiles, drawn after the Hiyang mockup (mockups/hiyang/app.js ICON):
// calm sun over waves, an ear with sound waves, a staircase, and Nova for Standard.
const TILE = { none: 'bg-white', kalma: 'bg-mint', pakinig: 'bg-sky', hakbang: 'bg-peach' }

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }

const ICONS = {
  kalma: (
    <>
      <circle cx="12" cy="7.5" r="3" {...stroke} strokeWidth="2.2" />
      <path d="M3 14.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2" {...stroke} strokeWidth="2.2" />
      <path d="M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2" {...stroke} strokeWidth="2.2" opacity="0.45" />
    </>
  ),
  pakinig: (
    <>
      <path d="M8.5 9.2a3.4 3.4 0 0 1 6.8 0c0 2.1-2 2.9-2.6 4.3-.4 1-.2 2.2-1.5 2.6a1.7 1.7 0 0 1-2.2-1.6" {...stroke} strokeWidth="2" />
      <circle cx="11.8" cy="9.2" r="0.7" fill="currentColor" />
      <path d="M16.6 7.1a4 4 0 0 1 0 5.6M18.4 5.4a6.6 6.6 0 0 1 0 9M20.1 3.8a9 9 0 0 1 0 12.2" {...stroke} strokeWidth="1.8" />
    </>
  ),
  hakbang: <path d="M3 20h5v-5h5v-5h5V5h3" {...stroke} strokeWidth="2.4" />,
}

export default function ModeIcon({ mode, size = 48 }) {
  const id = Object.hasOwn(TILE, mode) ? mode : 'none'
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-outline text-ink shadow-hard-sm ${TILE[id]}`}
      style={{ width: size, height: size }}
    >
      {id === 'none' ? (
        <Mascot size={Math.round(size * 0.78)} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.58)} height={Math.round(size * 0.58)}>{ICONS[id]}</svg>
      )}
    </span>
  )
}
