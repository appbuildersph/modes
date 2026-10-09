import novaPng from '../assets/nova.png'

export function Mascot({ size = 96, className = '', float = false, alt = 'Nova' }) {
  return (
    <img
      src={novaPng}
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
