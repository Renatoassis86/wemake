import { clsx } from 'clsx'

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'blue' | 'amber'
type ProgressSize = 'xs' | 'sm' | 'md' | 'lg'

interface ProgressProps {
  value: number          // 0-100
  max?: number
  variant?: ProgressVariant
  size?: ProgressSize
  label?: string
  showValue?: boolean
  animate?: boolean
  className?: string
}

const TRACK_H: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const FILL_COLOR: Record<ProgressVariant, string> = {
  default: 'from-amber-400 to-amber-500',
  success: 'from-emerald-400 to-emerald-500',
  warning: 'from-orange-400 to-orange-500',
  danger:  'from-red-400 to-red-500',
  blue:    'from-blue-500 to-indigo-500',
  amber:   'from-amber-400 to-orange-400',
}

// Auto-seleciona variante pela probabilidade (útil para deals)
function autoVariant(pct: number): ProgressVariant {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'blue'
  if (pct >= 30) return 'warning'
  return 'danger'
}

export default function Progress({
  value, max = 100, variant, size = 'sm', label, showValue = false, animate = true, className
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const resolvedVariant = variant ?? autoVariant(pct)

  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold text-slate-700">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden', TRACK_H[size])}>
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r',
            FILL_COLOR[resolvedVariant],
            animate && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// Circular progress (para probabilidade de fechamento)
interface CircularProgressProps {
  value: number   // 0-100
  size?: number   // px
  strokeWidth?: number
  label?: string
  variant?: ProgressVariant
}

export function CircularProgress({ value, size = 56, strokeWidth = 5, label, variant }: CircularProgressProps) {
  const pct = Math.min(100, Math.max(0, value))
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const resolvedVariant = variant ?? autoVariant(pct)

  const STROKE_COLORS: Record<ProgressVariant, string> = {
    default: '#f59e0b',
    success: '#10b981',
    warning: '#f97316',
    danger:  '#ef4444',
    blue:    '#3b82f6',
    amber:   '#f59e0b',
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={STROKE_COLORS[resolvedVariant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[0.65rem] font-extrabold text-slate-800 leading-none">{pct}%</span>
        {label && <span className="text-[0.5rem] text-slate-400 mt-0.5 text-center leading-none">{label}</span>}
      </div>
    </div>
  )
}
