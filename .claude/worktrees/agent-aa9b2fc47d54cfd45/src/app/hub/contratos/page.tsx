import Link from 'next/link'

export const metadata = { title: 'Gestão de Contratos · We Make' }

export default function ContratosPlaceholder() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 540, textAlign: 'center', background: '#fff', borderRadius: 20, padding: '3rem 2.5rem', boxShadow: '0 8px 32px rgba(15,23,42,.08)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: '#16a34a', marginBottom: '.6rem' }}>
          Plataforma acadêmica
        </div>
        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '.85rem' }}>
          Gestão de Contratos
        </h1>
        <p style={{ fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.95rem', color: '#64748b', lineHeight: 1.65, marginBottom: '2rem' }}>
          O módulo de contratos está sendo integrado ao Hub. Em breve você poderá acessar a plataforma acadêmica e contratual diretamente daqui.
        </p>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', padding: '.75rem 1.5rem', borderRadius: 9999, background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: '.82rem', fontFamily: 'var(--font-montserrat,sans-serif)', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Voltar ao Hub
        </Link>
      </div>
    </div>
  )
}


