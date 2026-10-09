const ICON_RULES = [
  ['tessellation', /tessellat|tile|tiling/i],
  ['transformation', /transformation|translation|reflection|rotation|rotate|reflect|slide/i],
  ['volume', /volume|cube|cubic|solid figure|3-dimensional|3d shape/i],
  ['fraction', /fraction|numerator|denominator|halves|quarters/i],
  ['multiplication', /multipli|product|factor|equal groups/i],
  ['division', /division|divide|quotient|sharing groups/i],
  ['ratio', /ratio|proportion|percent/i],
  ['statistics', /statistics|probability|data|graph|chart/i],
  ['measurement', /measurement|measure|length|distance|mass|capacity|perimeter|area|time|calendar|clock|duration|money|currency/i],
  ['geometry', /geometry|shape|angle|triangle|quadrilateral|circle|line/i],
]

export function lessonIconKind({ refId = '', title = '', competency = '', domain = '' } = {}) {
  const lessonSource = [title, competency].join(' ')
  const specificKind = ICON_RULES.find(([, pattern]) => pattern.test(lessonSource))?.[0]
  if (specificKind) return specificKind
  if (/statistics|probability|data/i.test(domain) || /SP|DP/.test(refId)) return 'statistics'
  if (/measurement|geometry/i.test(domain) || /MG/.test(refId)) return 'geometry'
  return 'number'
}

export default function LessonIcon({ refId, title, competency, domain, size = 32, decorative = true, label }) {
  const kind = lessonIconKind({ refId, title, competency, domain })
  const accessibility = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': label }

  return (
    <svg viewBox="0 0 48 48" width={size} height={size} data-icon-kind={kind} focusable="false" {...accessibility}>
      <IconPaths kind={kind} />
    </svg>
  )
}

function IconPaths({ kind }) {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'tessellation') return <><path d="m8 18 8-5 8 5-8 5Zm16 0 8-5 8 5-8 5ZM16 29l8-5 8 5-8 5Z" {...line} /><path d="m8 18 8 11 8-11 8 11 8-11" {...line} /></>
  if (kind === 'transformation') return <><path d="M8 31h13V18H8Zm20-13h12v12H28Z" {...line} /><path d="M20 12h13l-4-4m4 4-4 4M27 36H14l4 4m-4-4 4-4" {...line} /></>
  if (kind === 'volume') return <><path d="m11 16 13-7 13 7v17l-13 7-13-7Z" {...line} /><path d="m11 16 13 7 13-7M24 23v17" {...line} /></>
  if (kind === 'fraction') return <><circle cx="24" cy="24" r="16" {...line} /><path d="M24 8v32M24 24h16" {...line} /><path d="M24 24 35 13" {...line} /></>
  if (kind === 'multiplication') return <><path d="m15 15 18 18m0-18L15 33" {...line} /><circle cx="9" cy="9" r="2" fill="currentColor" /><circle cx="39" cy="39" r="2" fill="currentColor" /></>
  if (kind === 'division') return <><path d="M10 24h28" {...line} /><circle cx="24" cy="12" r="3" fill="currentColor" /><circle cx="24" cy="36" r="3" fill="currentColor" /></>
  if (kind === 'ratio') return <><path d="M8 35h32M13 35l8-20 6 20M35 35l-8-20" {...line} /><path d="M9 15h30" {...line} /><circle cx="9" cy="15" r="3" fill="var(--gb-rose)" /><circle cx="39" cy="15" r="3" fill="var(--gb-secondary)" /></>
  if (kind === 'statistics') return <><path d="M9 39V26h7v13M21 39V13h7v26M33 39V20h7v19M6 39h36" {...line} /></>
  if (kind === 'measurement') return <><path d="m9 34 25-25 7 7-25 25Z" {...line} /><path d="m16 31 4 4m0-8 4 4m0-8 4 4m0-8 4 4" {...line} /></>
  if (kind === 'geometry') return <><path d="M8 39 23 9l17 30Z" {...line} /><path d="m15 33 15-1-9-11Z" {...line} /></>
  return <><path d="M9 18h30M9 31h30M19 9l-4 30M33 9l-4 30" {...line} /></>
}
