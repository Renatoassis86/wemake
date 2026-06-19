import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { ROLE_OPTIONS } from '@/types/database'
import { AdminActions } from './AdminActions'

export default async function AdminpanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Schema We Make: tabela é `usuarios` (não `profiles`). Mapeamos para o shape esperado pelo AdminActions.
  const admin = createAdminClient()
  const [{ data: me }, { data: usuariosRaw }, { data: logs }] = await Promise.all([
    admin.from('usuarios').select('role').eq('id', user.id).single(),
    admin.from('usuarios').select('*').order('nome_completo'),
    admin.from('audit_log').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const profiles = (usuariosRaw ?? []).map((u: any) => ({
    id:        u.id,
    email:     u.email,
    full_name: u.nome_completo ?? u.email,
    role:      u.role ?? 'consultor',
    is_active: u.ativo ?? true,
    phone:     u.cargo?.startsWith('Tel: ') ? u.cargo.slice(5) : null,
  }))

  const isGerente = me?.role === 'gerente'
  const ativos    = profiles?.filter((p: any) => p.is_active)?.length  ?? 0
  const inativos  = profiles?.filter((p: any) => !p.is_active)?.length ?? 0
  const gerentes  = profiles?.filter((p: any) => p.role === 'gerente')?.length ?? 0

  return (
    <div>
      <PageHeader title="Gestão de Usuários" subtitle={isGerente ? 'Criar, editar e gerenciar a equipe' : 'Visualização'} />
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* Aviso acesso restrito */}
        {!isGerente && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#991b1b', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Acesso restrito</div>
              <div style={{ fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>Somente gerentes podem criar e editar usuários.</div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total',    value: profiles?.length ?? 0, cor: '#4A7FDB', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Ativos',   value: ativos,   cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'Inativos', value: inativos, cor: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
            { label: 'Gerentes', value: gerentes, cor: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 14, padding: '1.1rem 1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.35rem' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {isGerente ? (
          /* Layout 2 colunas: criar (esq) + lista com editar inline (dir) */
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '3rem' }}>
            <AdminActions roleOptions={ROLE_OPTIONS} profiles={profiles ?? []} />
          </div>
        ) : (
          /* Só visualização */
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '3rem' }}>
            <div style={{ background: '#0f172a', padding: '1rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {profiles?.length ?? 0} usuários cadastrados
              </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {profiles?.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4A7FDB,#2563b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.78rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                    {(p.full_name || p.email).split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{p.full_name}</div>
                    <div style={{ fontSize: '.7rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>{p.email}</div>
                  </div>
                  <span style={{ fontSize: '.65rem', fontWeight: 700, background: '#dbeafe', color: '#1e3a8a', border: '1px solid #93c5fd', padding: '.2rem .6rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase' }}>{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log (Gerente Only) */}
        {isGerente && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <div style={{ background: '#0f172a', padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ width: 30, height: 30, background: '#4A7FDB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#fff' }}>Registro de Atividades (Audit Log)</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Data</th>
                    <th style={{ padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Usuário</th>
                    <th style={{ padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Ação</th>
                    <th style={{ padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Tabela</th>
                    <th style={{ padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-montserrat,sans-serif)' }}>ID do Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '.85rem 1.25rem', fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding: '.85rem 1.25rem', fontSize: '.8rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {log.user_email || 'Sistema'}
                      </td>
                      <td style={{ padding: '.85rem 1.25rem' }}>
                        <span style={{ 
                          fontSize: '.65rem', fontWeight: 800, 
                          color: log.action === 'INSERT' ? '#16a34a' : log.action === 'UPDATE' ? '#2563eb' : '#dc2626',
                          background: log.action === 'INSERT' ? '#f0fdf4' : log.action === 'UPDATE' ? '#eff6ff' : '#fef2f2',
                          padding: '.2rem .5rem', borderRadius: 4, textTransform: 'uppercase'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '.85rem 1.25rem', fontSize: '.78rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {log.table_name}
                      </td>
                      <td style={{ padding: '.85rem 1.25rem', fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        <code>{log.record_id?.slice(0, 8) || '—'}</code>
                      </td>
                    </tr>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.8rem' }}>Nenhuma atividade registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
