'use client'

import {
  School, Flame, TrendingUp, Activity, Users, FileText,
  CheckCircle, AlertTriangle, DollarSign, Target, BarChart2,
  Kanban, Clock, Star, Package, BookOpen, Award, Zap,
} from 'lucide-react'

// Mapa de ícones — apenas plain strings são serializáveis entre Server e Client
export type StatIconName =
  | 'school' | 'flame' | 'trending-up' | 'activity' | 'users' | 'file-text'
  | 'check-circle' | 'alert-triangle' | 'dollar' | 'target' | 'bar-chart'
  | 'kanban' | 'clock' | 'star' | 'package' | 'book' | 'award' | 'zap'

const ICON_MAP: Record<StatIconName, React.ComponentType<{ size?: number; className?: string }>> = {
  'school':          School,
  'flame':           Flame,
  'trending-up':     TrendingUp,
  'activity':        Activity,
  'users':           Users,
  'file-text':       FileText,
  'check-circle':    CheckCircle,
  'alert-triangle':  AlertTriangle,
  'dollar':          DollarSign,
  'target':          Target,
  'bar-chart':       BarChart2,
  'kanban':          Kanban,
  'clock':           Clock,
  'star':            Star,
  'package':         Package,
  'book':            BookOpen,
  'award':           Award,
  'zap':             Zap,
}

type StatVariant = 'default' | 'blue' | 'amber' | 'success' | 'danger' | 'warning' | 'teal' | 'purple'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: StatIconName
  trend?: number
  trendLabel?: string
  variant?: StatVariant
  href?: string
  loading?: boolean
}

const VARIANT_MAP: Record<StatVariant, {
  barColor: string; iconBg: string; iconColor: string; valueColor: string
}> = {
  default: { barColor: '#d97706', iconBg: '#fef3c7', iconColor: '#b45309', valueColor: '#0f172a' },
  blue:    { barColor: '#1d4ed8', iconBg: '#dbeafe', iconColor: '#1d4ed8', valueColor: '#1e3a8a' },
  amber:   { barColor: '#d97706', iconBg: '#fef3c7', iconColor: '#b45309', valueColor: '#0f172a' },
  success: { barColor: '#16a34a', iconBg: '#dcfce7', iconColor: '#15803d', valueColor: '#14532d' },
  danger:  { barColor: '#dc2626', iconBg: '#fee2e2', iconColor: '#dc2626', valueColor: '#7f1d1d' },
  warning: { barColor: '#d97706', iconBg: '#fef3c7', iconColor: '#b45309', valueColor: '#78350f' },
  teal:    { barColor: '#0d9488', iconBg: '#ccfbf1', iconColor: '#0d9488', valueColor: '#134e4a' },
  purple:  { barColor: '#7c3aed', iconBg: '#ede9fe', iconColor: '#7c3aed', valueColor: '#3b0764' },
}

export function StatCard({ label, value, sub, icon, trend, trendLabel, variant = 'default', href, loading }: StatCardProps) {
  const v = VARIANT_MAP[variant]
  const IconComp = icon ? ICON_MAP[icon] : null

  const card = (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 12, padding: '1.25rem', position: 'relative',
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      transition: 'box-shadow .2s, transform .2s',
      cursor: href ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (href) { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
      onMouseLeave={e => { if (href) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(0)' }}}
    >
      {/* Barra de accent no topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: v.barColor, borderRadius: '12px 12px 0 0' }} />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <div style={{ height: 12, width: '60%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 28, width: '40%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 10, width: '80%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.85rem' }}>
            <div style={{
              fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.07em', color: '#64748b',
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              {label}
            </div>
            {IconComp && (
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconComp size={17} className="text-slate-500" />
              </div>
            )}
          </div>

          <div style={{
            fontSize: '1.85rem', fontWeight: 800, lineHeight: 1,
            color: v.valueColor, marginBottom: '.5rem',
            fontFamily: 'var(--font-cormorant,serif)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {sub && (
              <div style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                {sub}
              </div>
            )}
            {trend !== undefined && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.2rem',
                fontSize: '.68rem', fontWeight: 700,
                color: trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : '#64748b',
                fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
                {Math.abs(trend)}%
                {trendLabel && <span style={{ fontWeight: 400, color: '#94a3b8' }}> {trendLabel}</span>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  if (href) {
    return <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{card}</a>
  }
  return card
}

export default StatCard
