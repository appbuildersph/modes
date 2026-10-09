export default function OnlineBadge({ online = true, className = '' }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border-[2.5px] border-outline bg-white px-3 py-1 shadow-hard-sm ${className}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${online ? 'animate-pulse bg-green-700' : 'bg-rose'}`} />
      <span className="text-xs font-bold">{online ? 'Online' : 'Offline'}</span>
    </span>
  )
}
