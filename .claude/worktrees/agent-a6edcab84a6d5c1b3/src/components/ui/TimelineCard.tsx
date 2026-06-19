import { clsx } from 'clsx'
import { type LucideIcon, Phone, Mail, MapPin, Video, MessageSquare, Star, CheckCircle2 } from 'lucide-react'
import Badge, { ClassificacaoBadge } from './Badge'
import { CircularProgress } from './Progress'

type MeioContato = 'presencial' | 'whatsapp' | 'email' | 'telefone' | 'videoconf' | 'outro'

interface TimelineCardProps {
  id: string
  data: string
  hora?: string | null
  meio: MeioContato
  resumo: string
  responsavel?: string | null
  contato_nome?: string | null
  contato_cargo?: string | null
  classificacao?: string
  probabilidade?: number
  encaminhamentos?: string[]
  href?: string
  isLast?: boolean
}

const MEIO_CONFIG: Record<MeioContato, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  presencial: { icon: MapPin,        label: 'Presencial',       color: 'text-emerald-600', bg: 'bg-emerald-100' },
  whatsapp:   { icon: MessageSquare, label: 'WhatsApp',         color: 'text-green-600',   bg: 'bg-green-100'   },
  email:      { icon: Mail,          label: 'E-mail',           color: 'text-blue-600',    bg: 'bg-blue-100'    },
  telefone:   { icon: Phone,         label: 'Telefone',         color: 'text-indigo-600',  bg: 'bg-indigo-100'  },
  videoconf:  { icon: Video,         label: 'Videoconferência', color: 'text-violet-600',  bg: 'bg-violet-100'  },
  outro:      { icon: Star,          label: 'Outro',            color: 'text-slate-500',   bg: 'bg-slate-100'   },
}

const ENCAMINHAMENTO_LABELS: Record<string, string> = {
  agendamento_reuniao:    'Reunião agendada',
  apresentacao_curriculo: 'Apresent. Currículo',
  envio_material:         'Envio de material',
  nova_visita:            'Nova visita',
  contato_futuro:         'Contato futuro',
  elaboracao_contrato:    'Elabor. contrato',
  contrato_enviado:       'Contrato enviado',
  contrato_assinado:      'Contrato assinado',
}

function formatDatePT(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return dateStr }
}

export default function TimelineCard({
  id, data, hora, meio, resumo, responsavel, contato_nome, contato_cargo,
  classificacao, probabilidade, encaminhamentos = [], href, isLast = false
}: TimelineCardProps) {
  const meioCfg = MEIO_CONFIG[meio] ?? MEIO_CONFIG.outro
  const Icon = meioCfg.icon

  const cardContent = (
    <div className={clsx(
      'group relative',
      !isLast && 'pb-6'
    )}>
      {/* Linha vertical da timeline */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-slate-200" />
      )}

      <div className="flex gap-4">
        {/* Ícone do meio de contato */}
        <div className={clsx(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          'border-2 border-white shadow-sm',
          meioCfg.bg
        )}>
          <Icon size={16} className={meioCfg.color} strokeWidth={2} />
        </div>

        {/* Card */}
        <div className={clsx(
          'flex-1 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm',
          'border-l-[3px] border-l-amber-400',
          href && 'hover:shadow-md hover:border-l-amber-500 transition-all duration-200 cursor-pointer'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-bold',
                meioCfg.bg, meioCfg.color
              )}>
                <Icon size={10} />
                {meioCfg.label}
              </span>
              {classificacao && <ClassificacaoBadge value={classificacao} />}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {probabilidade !== undefined && (
                <CircularProgress value={probabilidade} size={36} strokeWidth={4} />
              )}
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">{formatDatePT(data)}</div>
                {hora && <div className="text-[0.65rem] text-slate-400">{hora}</div>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{resumo}</p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              {contato_nome && (
                <div className="text-[0.72rem] text-slate-500">
                  <span className="font-medium text-slate-700">{contato_nome}</span>
                  {contato_cargo && <span className="text-slate-400"> · {contato_cargo}</span>}
                </div>
              )}
              {responsavel && !contato_nome && (
                <div className="text-[0.72rem] text-slate-500">
                  por <span className="font-medium text-slate-700">{responsavel}</span>
                </div>
              )}
            </div>

            {encaminhamentos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {encaminhamentos.slice(0, 3).map(enc => (
                  <span key={enc} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.6rem] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <CheckCircle2 size={9} className="text-emerald-500" />
                    {ENCAMINHAMENTO_LABELS[enc] ?? enc}
                  </span>
                ))}
                {encaminhamentos.length > 3 && (
                  <span className="text-[0.6rem] text-slate-400 self-center">+{encaminhamentos.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href} className="block no-underline text-inherit">{cardContent}</a>
  }
  return cardContent
}
