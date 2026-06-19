import { clsx } from 'clsx'
import { type LucideIcon } from 'lucide-react'

type BadgeVariant =
  | 'quente' | 'morno' | 'frio'
  | 'success' | 'danger' | 'warning' | 'info'
  | 'amber' | 'blue' | 'teal' | 'purple' | 'gray'
  | 'pendente' | 'concluida' | 'cancelada'
  | 'urgente' | 'alta' | 'media' | 'baixa'

type BadgeSize = 'xs' | 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: LucideIcon
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  quente:    'bg-red-50 text-red-700 border border-red-200 ring-0',
  morno:     'bg-amber-50 text-amber-800 border border-amber-200',
  frio:      'bg-blue-50 text-blue-700 border border-blue-200',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger:    'bg-red-50 text-red-700 border border-red-200',
  warning:   'bg-orange-50 text-orange-700 border border-orange-200',
  info:      'bg-blue-50 text-blue-700 border border-blue-200',
  amber:     'bg-amber-50 text-amber-800 border border-amber-200',
  blue:      'bg-blue-50 text-blue-800 border border-blue-200',
  teal:      'bg-teal-50 text-teal-700 border border-teal-200',
  purple:    'bg-violet-50 text-violet-700 border border-violet-200',
  gray:      'bg-slate-100 text-slate-600 border border-slate-200',
  pendente:  'bg-amber-50 text-amber-800 border border-amber-200',
  concluida: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelada: 'bg-slate-100 text-slate-500 border border-slate-200',
  urgente:   'bg-red-100 text-red-800 border border-red-300',
  alta:      'bg-orange-50 text-orange-700 border border-orange-200',
  media:     'bg-amber-50 text-amber-700 border border-amber-200',
  baixa:     'bg-slate-100 text-slate-500 border border-slate-200',
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  quente:    'bg-red-500',
  morno:     'bg-amber-500',
  frio:      'bg-blue-500',
  success:   'bg-emerald-500',
  danger:    'bg-red-500',
  warning:   'bg-orange-500',
  info:      'bg-blue-500',
  amber:     'bg-amber-500',
  blue:      'bg-blue-500',
  teal:      'bg-teal-500',
  purple:    'bg-violet-500',
  gray:      'bg-slate-400',
  pendente:  'bg-amber-500',
  concluida: 'bg-emerald-500',
  cancelada: 'bg-slate-400',
  urgente:   'bg-red-600',
  alta:      'bg-orange-500',
  media:     'bg-amber-500',
  baixa:     'bg-slate-400',
}

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[0.6rem] gap-1',
  sm: 'px-2 py-0.5 text-[0.68rem] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export default function Badge({ variant = 'gray', size = 'sm', icon: Icon, dot, children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-bold uppercase tracking-[0.05em] rounded-full whitespace-nowrap',
      VARIANT_STYLES[variant],
      SIZE_STYLES[size],
      className
    )}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_COLORS[variant])} />
      )}
      {Icon && <Icon size={10} strokeWidth={2.5} className="flex-shrink-0" />}
      {children}
    </span>
  )
}

// Convenience exports para casos comuns
export function ClassificacaoBadge({ value }: { value: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    quente: { variant: 'quente', label: 'Quente' },
    morno:  { variant: 'morno',  label: 'Morno'  },
    frio:   { variant: 'frio',   label: 'Frio'   },
  }
  const cfg = map[value] ?? { variant: 'gray' as BadgeVariant, label: value }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function PrioridadeBadge({ value }: { value: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    urgente: { variant: 'urgente', label: 'Urgente' },
    alta:    { variant: 'alta',    label: 'Alta'    },
    media:   { variant: 'media',   label: 'Média'   },
    baixa:   { variant: 'baixa',   label: 'Baixa'   },
  }
  const cfg = map[value] ?? { variant: 'gray' as BadgeVariant, label: value }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StatusTarefaBadge({ value }: { value: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    pendente:  { variant: 'pendente',  label: 'Pendente'  },
    concluida: { variant: 'concluida', label: 'Concluída' },
    cancelada: { variant: 'cancelada', label: 'Cancelada' },
  }
  const cfg = map[value] ?? { variant: 'gray' as BadgeVariant, label: value }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}
