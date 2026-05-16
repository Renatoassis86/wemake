import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { UploadDoc } from './UploadDoc'
import { ClipboardList, Download, FileText, FileCheck, ExternalLink } from 'lucide-react'

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDateSafe(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function ExportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  const isGerente = profile?.role === 'gerente'

  // Buscar documentos cadastrados no banco
  const { data: docs } = await supabase
    .from('documentos_oficiais')
    .select('*')
    .order('updated_at', { ascending: false })

  // Buscar formulários preenchidos
  const { data: formularios } = await supabase
    .from('formularios')
    .select('id, data_envio, nome_escola, email_responsavel, cidade, estado, infantil2_qtd, infantil3_qtd, infantil4_qtd, infantil5_qtd, fund1_ano1_qtd')
    .order('data_envio', { ascending: false })

  // Tentar buscar URLs públicas do Storage
  const admin  = createAdminClient()
  const BUCKET = 'documentos-oficiais'

  const getUrl = (path: string) => {
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  // Documentos padrão (fallback se ainda não há no banco)
  const fichaDoc    = docs?.find((d: any) => d.tipo === 'ficha_cadastral')
  const minutaDoc   = docs?.find((d: any) => d.tipo === 'minuta_contrato')
  const fichaUrl    = fichaDoc?.url    || '/docs/ficha-cadastral.docx'
  const minutaUrl   = minutaDoc?.url   || '/docs/minuta-contrato.pdf'

  const totalFormularios = formularios?.length ?? 0
  const totalAlunos      = formularios?.reduce((acc: number, f: any) =>
    acc + (f.infantil2_qtd ?? 0) + (f.infantil3_qtd ?? 0) + (f.infantil4_qtd ?? 0) + (f.infantil5_qtd ?? 0) + (f.fund1_ano1_qtd ?? 0), 0) ?? 0

  return (
    <div>
      <PageHeader
        title="Relatórios e Downloads"
        subtitle="Documentos oficiais e formulários preenchidos"
        actions={
          <Link href="/formulario" target="_blank" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.45rem 1rem', borderRadius: 9999, background: '#4A7FDB',
            color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 700,
            fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 12px rgba(74,127,219,.3)',
          }}>
            <ExternalLink size={13} /> Formulário Público
          </Link>
        }
      />

      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── KPIs ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Formulários Recebidos', value: totalFormularios, cor: '#4A7FDB', bg: '#fffbeb', border: '#fcd34d', icon: <ClipboardList size={18} style={{ color: '#64748b' }} /> },
            { label: 'Alunos Mapeados (Fund I)', value: totalAlunos, cor: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', icon: <FileText size={18} style={{ color: '#64748b' }} /> },
            { label: 'Documentos Oficiais', value: 2, cor: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: <FileCheck size={18} style={{ color: '#64748b' }} /> },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 14, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {k.icon}
              </div>
              <div>
                <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Documentos Oficiais ───────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>
                Biblioteca de Documentos
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                Documentos Oficiais da We Make
              </div>
            </div>
            {isGerente && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '.4rem .75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Clique em "Atualizar" para substituir um documento</span>
              </div>
            )}
          </div>

          <div style={{ padding: '1.5rem 1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Ficha Cadastral */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, fontSize: '.875rem', color: '#0f172a', marginBottom: '.15rem' }}>Ficha Cadastral</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {fichaDoc ? `${fichaDoc.nome_arquivo} · ${formatBytes(fichaDoc.tamanho)}` : 'We Make.docx'}
                  </div>
                  {fichaDoc && (
                    <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '.15rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      Atualizado em {formatDateSafe(fichaDoc.updated_at)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <a href={fichaUrl} download style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                  padding: '6px 14px', borderRadius: 8, background: '#2563eb',
                  color: '#fff', textDecoration: 'none', fontSize: '.72rem', fontWeight: 700,
                  fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 2px 8px rgba(37,99,235,.25)',
                }}>
                  <Download size={12} /> Baixar
                </a>
                {isGerente && <UploadDoc tipo="ficha_cadastral" label="Atualizar" />}
              </div>
            </div>

            {/* Minuta do Contrato */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, fontSize: '.875rem', color: '#0f172a', marginBottom: '.15rem' }}>Minuta do Contrato</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {minutaDoc ? `${minutaDoc.nome_arquivo} · ${formatBytes(minutaDoc.tamanho)}` : 'Minuta - We Make.pdf'}
                  </div>
                  {minutaDoc && (
                    <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '.15rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      Atualizado em {formatDateSafe(minutaDoc.updated_at)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <a href={minutaUrl} download style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                  padding: '6px 14px', borderRadius: 8, background: '#dc2626',
                  color: '#fff', textDecoration: 'none', fontSize: '.72rem', fontWeight: 700,
                  fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 2px 8px rgba(220,38,38,.25)',
                }}>
                  <Download size={12} /> Baixar
                </a>
                {isGerente && <UploadDoc tipo="minuta_contrato" label="Atualizar" />}
              </div>
            </div>
          </div>

          {isGerente && (
            <div style={{ margin: '0 1.75rem 1.5rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '.85rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              <div style={{ fontSize: '.75rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
                <strong>Atenção:</strong> Ao fazer upload de um novo documento, ele substitui automaticamente o anterior. Aceito: PDF, DOC, DOCX.
                O arquivo é armazenado no Supabase Storage e disponibilizado publicamente para download.
              </div>
            </div>
          )}
        </div>

        {/* ── Formulário público — link ──────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #4A7FDB', borderRadius: 16, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Formulário de Pré-Cadastro Escolar</div>
              <div style={{ fontSize: '.78rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                Página pública · Acesso sem login · Compartilhe com escolas parceiras
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <Link href="/formulario" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.5rem 1.1rem', borderRadius: 9999, background: '#4A7FDB', color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 12px rgba(74,127,219,.3)' }}>
              <ExternalLink size={13} /> Abrir Formulário
            </Link>
          </div>
        </div>

        {/* ── Formulários preenchidos ───────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
          <div style={{ background: '#0f172a', padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>Formulários Recebidos</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                {totalFormularios} pré-cadastro{totalFormularios !== 1 ? 's' : ''} preenchido{totalFormularios !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {totalAlunos} alunos Fund. I mapeados
            </div>
          </div>

          {formularios && formularios.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Data', 'Escola', 'Responsável', 'Localidade', 'Inf.2', 'Inf.3', 'Inf.4', 'Inf.5', '1ºFI'].map(col => (
                      <th key={col} style={{ padding: '.65rem 1rem', textAlign: 'left', fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formularios.map((f: any, idx: number) => {
                    const dataEnvio = f.data_envio ? new Date(f.data_envio) : null
                    const dataStr   = dataEnvio && !isNaN(dataEnvio.getTime())
                      ? dataEnvio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : '—'
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '.75rem 1rem', fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dataStr}</td>
                        <td style={{ padding: '.75rem 1rem', fontWeight: 700, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{f.nome_escola}</td>
                        <td style={{ padding: '.75rem 1rem', fontSize: '.78rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{f.email_responsavel}</td>
                        <td style={{ padding: '.75rem 1rem', fontSize: '.78rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>
                          {f.cidade || '—'}{f.estado ? `, ${f.estado}` : ''}
                        </td>
                        {['infantil2_qtd','infantil3_qtd','infantil4_qtd','infantil5_qtd','fund1_ano1_qtd'].map(col => (
                          <td key={col} style={{ padding: '.75rem 1rem', textAlign: 'center', fontSize: '.82rem', fontFamily: 'var(--font-cormorant,serif)', fontWeight: 700, color: (f[col] ?? 0) > 0 ? '#0f172a' : '#cbd5e1' }}>
                            {f[col] ?? 0}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <ClipboardList size={40} style={{ display: 'block', margin: '0 auto .75rem', opacity: .3 }} />
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', color: '#0f172a', marginBottom: '.3rem' }}>Nenhum formulário preenchido ainda</div>
              <div style={{ fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Compartilhe o link do formulário público com as escolas parceiras.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

