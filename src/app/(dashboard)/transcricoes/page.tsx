import { createClient } from '@/lib/supabase/server'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import PageHeader from '@/components/layout/PageHeader'
import { TranscricaoForm } from '@/components/transcricoes/TranscricaoForm'

export default async function TranscricoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    escolas,
    { data: transcricoes },
    { data: meProfile },
  ] = await Promise.all([
    buscarEscolasUnificadas(supabase),
    supabase.from('transcricoes_reunioes')
      .select('*, escola:escolas(nome), criador:profiles(full_name)')
      .order('data_reuniao', { ascending: false }),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
  ])

  // Tabela não existe ainda
  const tabelaInexistente = (transcricoes === null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader
        title="Transcrições de Reuniões"
        subtitle="Histórico de reuniões com escolas — texto, áudio e vídeo"
      />

      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── Diretrizes do módulo ─────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: 16, padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: '2rem', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#d97706', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              ✦ Central de Registros de Reuniões
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '.5rem' }}>
              Transcrições & Gravações
            </h2>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.7, maxWidth: 560 }}>
              Ao finalizar uma reunião com uma escola, registre aqui a transcrição e o áudio/vídeo.
              Este histórico enriquece a jornada comercial e serve como base para análises futuras pela ALMA.
            </p>
          </div>
          {/* Como usar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', minWidth: 220 }}>
            {[
              { n: '1', text: 'Finalize a reunião no Meet/Zoom' },
              { n: '2', text: 'Copie a transcrição automática' },
              { n: '3', text: 'Clique em "Nova Transcrição"' },
              { n: '4', text: 'Selecione a escola e a data' },
              { n: '5', text: 'Cole o texto e suba os arquivos' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.6rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                  {step.n}
                </div>
                <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-inter,sans-serif)' }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Aviso se tabela não existe ───────────────────── */}
        {tabelaInexistente ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fffbeb', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>
              Configure o banco de dados
            </h3>
            <p style={{ fontSize: '.875rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
              Execute o SQL abaixo no Supabase para ativar este módulo.
            </p>
            <a href="https://supabase.com/dashboard/project/lyisdsnocroocxfblvqf/sql/new"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', padding: '.65rem 1.75rem', borderRadius: 9999, textDecoration: 'none', fontWeight: 700, fontSize: '.875rem', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 14px rgba(217,119,6,.35)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir SQL Editor do Supabase
            </a>
            <div style={{ marginTop: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.75rem 1rem', textAlign: 'left', display: 'inline-block' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Arquivo a executar:</div>
              <code style={{ fontSize: '.78rem', color: '#d97706', fontFamily: 'monospace' }}>supabase/add_transcricoes.sql</code>
            </div>
          </div>
        ) : (
          <TranscricaoForm
            escolas={escolas ?? []}
            transcricoes={(transcricoes ?? []) as any}
            userId={user!.id}
          />
        )}
      </div>
    </div>
  )
}
