import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import { AgendaClient } from '@/components/agenda/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    eventosResult,
    { data: profiles },
    { data: escolas },
    { data: meProfile },
  ] = await Promise.all([
    supabase
      .from('agenda_eventos')
      .select(`
        id, titulo, descricao, local, tipo, cor,
        data_inicio, data_fim, dia_inteiro,
        escola_id, escola:escolas(nome),
        criado_por,
        participantes:agenda_participantes(
          id, profile_id, email, nome, status
        )
      `)
      .gte('data_fim', new Date(new Date().getFullYear(), 0, 1).toISOString())
      .order('data_inicio'),
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('escolas')
      .select('id, nome')
      .eq('ativa', true)
      .order('nome'),
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user!.id)
      .single(),
  ])

  const tabelaNaoExiste = (eventosResult.error as any)?.code === 'PGRST205'
  const eventos = eventosResult.data

  if (tabelaNaoExiste) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <PageHeader title="Agenda" subtitle="Gestão de reuniões e compromissos" />
        <div style={{ padding: '3rem 2.5rem' }}>
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18,
            padding: '3rem 2.5rem', textAlign: 'center', maxWidth: 560, margin: '0 auto',
            boxShadow: '0 2px 12px rgba(15,23,42,.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fffbeb', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>
              Configuração necessária
            </h2>
            <p style={{ fontSize: '.875rem', color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
              O banco de dados da Agenda ainda não foi criado. Execute o SQL abaixo no painel do Supabase para ativar este módulo.
            </p>
            <a
              href="https://supabase.com/dashboard/project/lyisdsnocroocxfblvqf/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.5rem',
                background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                color: '#fff', padding: '.7rem 1.75rem', borderRadius: 9999,
                textDecoration: 'none', fontWeight: 700, fontSize: '.875rem',
                fontFamily: 'var(--font-montserrat,sans-serif)',
                boxShadow: '0 4px 14px rgba(74,127,219,.35)',
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir SQL Editor do Supabase
            </a>
            <div style={{ marginTop: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.75rem 1rem', textAlign: 'left' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Arquivo SQL a executar:
              </div>
              <code style={{ fontSize: '.78rem', color: '#4A7FDB', fontFamily: 'monospace' }}>
                supabase/add_agenda.sql
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader title="Agenda" subtitle="Gestão de reuniões e compromissos" />
      <AgendaClient
        eventos={(eventos ?? []) as any}
        profiles={profiles ?? []}
        escolas={escolas ?? []}
        userId={user!.id}
        userEmail={meProfile?.email ?? user!.email ?? ''}
      />
    </div>
  )
}
