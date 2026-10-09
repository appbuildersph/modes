import { Mascot } from './Mascot.jsx'
import { thinkingClass } from '../lib/thinking.js'

// Shown only while a tutor request is pending; no artificial delay.
export default function ThinkingIndicator({ text, mode, size = 36 }) {
  return (
    <div role="status" aria-live="polite" className={`${thinkingClass(mode)} mt-3 flex items-center gap-3`}>
      <Mascot size={size} className="gb-thinking-nova" alt="" />
      <span className="text-base font-bold text-ink/75">{text}</span>
      <span className="gb-thinking-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
    </div>
  )
}
