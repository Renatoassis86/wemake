/**
 * DashboardCharts.tsx — primitivas de gráfico SSR-safe (sem recharts) reaproveitadas
 * entre Dashboard, Metas e Priorização. Extraído de duplicações locais em
 * priorizacao/page.tsx (MiniBarChart) e metas/page.tsx (BarraMeta) para as três
 * telas nunca divergirem em estilo.
 */
import Link from 'next/link'

export function MiniBarChart({
  title, data, colorHex, labelWidth = 84,
}: {
  title: string
  data: { label: string; count: number; full?: string }[]
  colorHex: string
  labelWidth?: number
}) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{
      background: 'white', border: '1.5px solid #E2E8F0',
      borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,.04)',
    }}>
      <div style={{
        fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '.08em', color: '#64748B', marginBottom: '1rem',
        fontFamily: 'var(--font-montserrat, sans-serif)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {data.map(({ label, count, full }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
            <div title={full && full !== label ? full : undefined} style={{
              width: labelWidth, fontSize: '.7rem', fontWeight: 700, color: '#475569',
              fontFamily: 'var(--font-montserrat, sans-serif)', flexShrink: 0, textAlign: 'right',
              lineHeight: 1.35,
            }}>{label}</div>
            <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((count / max) * 100)}%`,
                background: colorHex,
                borderRadius: 99,
                transition: 'width .3s',
              }} />
            </div>
            <div style={{
              width: 28, fontSize: '.68rem', fontWeight: 700, color: '#475569',
              fontFamily: 'var(--font-montserrat, sans-serif)', flexShrink: 0,
            }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BarraProgresso({ pct, cor, height = 10 }: { pct: number; cor: string; height?: number }) {
  const p = Math.min(100, Math.max(0, pct))
  return (
    <div style={{ height, background: '#f1f5f9', borderRadius: height, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${p}%`, borderRadius: height,
        background: p >= 100 ? '#16a34a' : cor,
        transition: 'width .8s ease',
        boxShadow: p > 0 ? `0 0 8px ${cor}55` : 'none',
      }} />
    </div>
  )
}

// Card de KPI com barra de progresso opcional — mesmo visual usado em Metas,
// generalizado para o dashboard (meta é opcional; sem meta, mostra só o valor).
export function KpiCard({
  label, valor, meta, pct, cor, bg, border, sub, icon, href,
}: {
  label: string
  valor: string | number
  meta?: string | number
  pct?: number
  cor: string
  bg: string
  border: string
  sub?: string
  icon: React.ReactNode
  href?: string
}) {
  const conteudo = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
          {label}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>
          {valor}
        </div>
        {meta !== undefined && (
          <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
            meta: {meta}
          </div>
        )}
        {sub && <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{sub}</div>}
      </div>
      {pct !== undefined && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {href ? 'ver detalhes →' : 'progresso'}
            </span>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: pct >= 100 ? '#16a34a' : cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{Math.min(100, pct)}%</span>
          </div>
          <BarraProgresso pct={pct} cor={cor} height={6} />
        </div>
      )}
    </>
  )
  const style: React.CSSProperties = {
    background: bg, border: `1.5px solid ${border}`,
    borderRadius: 16, padding: '1.25rem 1.4rem',
    borderTop: `3px solid ${cor}`,
    display: 'flex', flexDirection: 'column', gap: '.65rem',
    textDecoration: 'none',
  }
  return href
    ? <Link href={href} style={style}>{conteudo}</Link>
    : <div style={style}>{conteudo}</div>
}
