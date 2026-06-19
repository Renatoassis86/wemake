import { clsx } from 'clsx'
import {
  MapPin, Users, DollarSign, CalendarDays, Phone,
  ArrowRight, Building2, Flame, Thermometer, Snowflake
} from 'lucide-react'
import Badge from './Badge'
import { CircularProgress } from './Progress'

interface EscolaCardProps {
  id: string
  nome: string
  cidade?: string | null
  estado?: string | null
  perfil_pedagogico?: string
  total_alunos?: number
  potencial_financeiro?: number
  classificacao?: string | null
  probabilidade?: number | null
  ultimo_contato?: string | null
  responsavel_nome?: string | null
  telefone?: string | null
  href: string
  variant?: 'grid' | 'compact'
}

const PERFIL_LABELS: Record<string, string> = {
  crista_catolica:  'Cristã Católica',
  evangelica:       'Cristã Evangélica',
  por_principio:    'Por Princípio',
  crista_classica:  'Cristã Clássica',
  convencional:     'Convencional',
  outro:            'Outro',
}

const CLASSIF_CONFIG: Record<string, { icon: typeof Flame; color: string; bg: string; label: string }> = {
  quente: { icon: Flame,       color: 'text-red-500',    bg: 'bg-red-50',    label: 'Quente' },
  morno:  { icon: Thermometer, color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Morno'  },
  frio:   { icon: Snowflake,   color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Frio'   },
}

function formatCurrency(n: number) {
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `R$ ${(n / 1000).toFixed(0)}k`
  return `R$ ${n}`
}

function daysSince(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sem contato'
  try {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diff === 0) return 'Hoje'
    if (diff === 1) return 'Ontem'
    return `${diff}d atrás`
  } catch { return '—' }
}

// Grid card — para listas de escolas em modo card
export default function EscolaCard({
  id, nome, cidade, estado, perfil_pedagogico, total_alunos, potencial_financeiro,
  classificacao, probabilidade, ultimo_contato, responsavel_nome, telefone, href,
  variant = 'grid'
}: EscolaCardProps) {
  const classifCfg = classificacao ? CLASSIF_CONFIG[classificacao] : null
  const ClassifIcon = classifCfg?.icon

  if (variant === 'compact') {
    return (
      <a href={href} className={clsx(
        'group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg',
        'hover:border-amber-300 hover:shadow-sm transition-all duration-150 no-underline'
      )}>
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} style={{ color: "#94a3b8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{nome}</div>
          <div className="text-[0.7rem] text-slate-400">
            {cidade}{estado ? `, ${estado}` : ''}
          </div>
        </div>
        {classificacao && classifCfg && (
          <Badge variant={classificacao as any} size="xs" dot>
            {classifCfg.label}
          </Badge>
        )}
        <ArrowRight size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
      </a>
    )
  }

  return (
    <a href={href} className={clsx(
      'group block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden',
      'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 no-underline'
    )}>
      {/* Accent top bar */}
      <div className={clsx(
        'h-[3px]',
        classificacao === 'quente' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
        classificacao === 'morno'  ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                                     'bg-gradient-to-r from-blue-400 to-indigo-400'
      )} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-amber-700 transition-colors">
              {nome}
            </h3>
            {(cidade || estado) && (
              <p className="text-[0.7rem] text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="flex-shrink-0" />
                {cidade}{estado ? `, ${estado}` : ''}
              </p>
            )}
          </div>
          {probabilidade !== undefined && probabilidade !== null && (
            <CircularProgress value={probabilidade} size={40} strokeWidth={4} />
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {perfil_pedagogico && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.62rem] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {PERFIL_LABELS[perfil_pedagogico] ?? perfil_pedagogico}
            </span>
          )}
          {classificacao && classifCfg && ClassifIcon && (
            <span className={clsx(
              'inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[0.62rem] font-bold',
              classifCfg.bg, classifCfg.color
            )}>
              <ClassifIcon size={10} />
              {classifCfg.label}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          {total_alunos !== undefined && (
            <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-600">
              <Users size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
              <span><strong className="text-slate-800">{total_alunos}</strong> alunos</span>
            </div>
          )}
          {potencial_financeiro !== undefined && potencial_financeiro > 0 && (
            <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-600">
              <DollarSign size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
              <span className="font-semibold text-emerald-700">{formatCurrency(potencial_financeiro)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.68rem] text-slate-400">
          <CalendarDays size={10} />
          <span>{daysSince(ultimo_contato)}</span>
          {responsavel_nome && (
            <span className="text-slate-300">· {responsavel_nome.split(' ')[0]}</span>
          )}
        </div>
        <ArrowRight size={12} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
      </div>
    </a>
  )
}
