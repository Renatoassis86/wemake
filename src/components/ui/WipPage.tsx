import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'

interface Feature {
  icon: React.ReactNode
  title: string
  desc: string
}

interface WipPageProps {
  title: string
  subtitle?: string
  tag?: string
  headline: string
  description: string
  features: Feature[]
  integration?: {
    label: string
    desc: string
    icon: React.ReactNode
  }
  note?: string
  cta?: { label: string; href: string }
}

export function WipPage({
  title, subtitle, tag = 'Em Breve', headline, description,
  features, integration, note, cta,
}: WipPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div style={{ padding: '2rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>

        {/* ── Hero do módulo ──────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 20, padding: '2.5rem 3rem', marginBottom: '1.5rem',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decoração */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(74,127,219,.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(74,127,219,.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(74,127,219,.15)', border: '1px solid rgba(74,127,219,.3)', borderRadius: 9999, padding: '.3rem .9rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {tag} — Em Desenvolvimento
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: '.85rem', maxWidth: 560 }}>
              {headline}
            </h2>
            <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 500 }}>
              {description}
            </p>

            {cta && (
              <div style={{ marginTop: '1.5rem' }}>
                <Link href={cta.href} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: '#4A7FDB', color: '#fff', padding: '.55rem 1.25rem',
                  borderRadius: 9999, fontSize: '.82rem', fontWeight: 700,
                  textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)',
                  boxShadow: '0 4px 14px rgba(74,127,219,.35)',
                }}>
                  {cta.label} →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Funcionalidades planejadas ──────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fafafa', padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>
              Funcionalidades planejadas
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '1rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '1rem 1.1rem', display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#64748b' }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '.2rem' }}>{f.title}</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', lineHeight: 1.55, fontFamily: 'var(--font-inter,sans-serif)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Integração ──────────────────────────────────────── */}
        {integration && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem 1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.85rem' }}>
              Integração planejada
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
                {integration.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.875rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>{integration.label}</div>
                <div style={{ fontSize: '.8rem', color: '#78350f', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>{integration.desc}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Nota informativa ────────────────────────────────── */}
        {note && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '.1rem' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: '.8rem', color: '#1e40af', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>{note}</div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>
    </div>
  )
}
