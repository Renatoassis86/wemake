import { clsx } from 'clsx'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: AvatarSize
  className?: string
  ring?: boolean
}

const SIZE_MAP: Record<AvatarSize, { outer: string; text: string }> = {
  xs: { outer: 'w-6 h-6',   text: 'text-[0.55rem]' },
  sm: { outer: 'w-8 h-8',   text: 'text-xs'        },
  md: { outer: 'w-10 h-10', text: 'text-sm'        },
  lg: { outer: 'w-12 h-12', text: 'text-base'      },
  xl: { outer: 'w-16 h-16', text: 'text-xl'        },
}

// Gera uma cor determinística baseada no nome
function nameToColor(name: string): string {
  const colors = [
    'from-amber-500 to-orange-500',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-500',
    'from-slate-600 to-slate-800',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, src, size = 'md', className, ring = false }: AvatarProps) {
  const { outer, text } = SIZE_MAP[size]
  const initials = name ? getInitials(name) : '?'
  const gradient = name ? nameToColor(name) : 'from-slate-400 to-slate-600'

  return (
    <div className={clsx(
      outer,
      'rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden',
      ring && 'ring-2 ring-white ring-offset-1',
      className
    )}>
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <div className={clsx(
          'w-full h-full flex items-center justify-center bg-gradient-to-br',
          gradient
        )}>
          <span className={clsx('font-bold text-white leading-none select-none', text)}>
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

// Avatar stack (grupo de avatars sobrepostos)
interface AvatarStackProps {
  items: Array<{ name?: string | null; src?: string | null }>
  max?: number
  size?: AvatarSize
}

export function AvatarStack({ items, max = 4, size = 'sm' }: AvatarStackProps) {
  const visible = items.slice(0, max)
  const extra = items.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((item, i) => (
        <Avatar
          key={i}
          name={item.name}
          src={item.src}
          size={size}
          ring
        />
      ))}
      {extra > 0 && (
        <div className={clsx(
          SIZE_MAP[size].outer,
          'rounded-full bg-slate-200 border-2 border-white flex items-center justify-center flex-shrink-0'
        )}>
          <span className={clsx('text-slate-600 font-bold', SIZE_MAP[size].text)}>
            +{extra}
          </span>
        </div>
      )}
    </div>
  )
}
