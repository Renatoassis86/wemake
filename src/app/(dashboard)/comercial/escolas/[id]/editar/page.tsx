import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { upsertEscola } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { PERFIL_OPTIONS, ORIGEM_OPTIONS, CARGO_CONTATO_OPTIONS } from '@/types/database'

export const dynamic = 'force-dynamic'

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '.65rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none',
  boxSizing: 'border-box',
}

const ICON_PROPS = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const SECTION_ICONS: Record<string, React.ReactNode> = {
  identificacao: <svg {...ICON_PROPS}><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>,
  endereco: <svg {...ICON_PROPS}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
  contato: <svg {...ICON_PROPS}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>,
  alunos: <svg {...ICON_PROPS}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  gestao: <svg {...ICON_PROPS}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
}

function SectionHeader({ icon, title, hint }: { icon: keyof typeof SECTION_ICONS; title: string; hint?: string }) {
  return (
    <div className="card-header" style={{ padding: '1.1rem 1.4rem', gap: '.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(74,127,219,.12), rgba(74,127,219,.06))',
          color: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {SECTION_ICONS[icon]}
        </div>
        <span className="card-title" style={{ fontSize: '1.15rem' }}>{title}</span>
      </div>
      {hint && <span style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{hint}</span>}
    </div>
  )
}

function TurmaField({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ ...labelStyle, textTransform: 'none', fontSize: '.72rem', color: '#475569', fontWeight: 600, marginBottom: 0 }}>
        {label}
      </label>
      <input
        name={name} type="number" min="0" defaultValue={value}
        style={{ ...inputStyle, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, padding: '.45rem' }}
      />
    </div>
  )
}

interface Props { params: Promise<{ id: string }> }

export default async function EscolaEditar({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: escola }, { data: profiles }] = await Promise.all([
    admin.from('escolas').select('*').eq('id', id).single(),
    admin.from('usuarios').select('id, nome_completo').eq('ativo', true).order('nome_completo'),
  ])

  if (!escola) notFound()
  const e = escola as any

  return (
    <div>
      <PageHeader
        title={`Editar: ${e.nome}`}
        subtitle="Dados cadastrais da escola parceira"
        breadcrumbs={[
          { label: 'Escolas', href: '/comercial/escolas' },
          { label: e.nome, href: `/comercial/escolas/${id}` },
          { label: 'Editar' },
        ]}
      />
      <div className="p-6 mp-page-padding-x" style={{ maxWidth: 1400, margin: '0 auto', boxSizing: 'border-box', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <form action={upsertEscola} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <input type="hidden" name="id" value={id} />

          <div className="card">
            <SectionHeader icon="identificacao" title="Identificação" />
            <div className="card-body" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Nome da Escola *</label>
                  <input name="nome" className="form-control" defaultValue={e.nome} required />
                </div>
                <div>
                  <label className="form-label">CNPJ</label>
                  <input name="cnpj" className="form-control" defaultValue={e.cnpj ?? ''} />
                </div>
                <div>
                  <label className="form-label">Perfil Pedagógico</label>
                  <select name="perfil_pedagogico" className="form-control" defaultValue={e.perfil_pedagogico}>
                    {PERFIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <input type="hidden" name="escola_paideia" value={e.escola_paideia ? 'true' : 'false'} />
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader icon="endereco" title="Endereço" />
            <div className="card-body" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Rua</label>
                  <input name="rua" className="form-control" defaultValue={e.rua ?? ''} />
                </div>
                <div>
                  <label className="form-label">Número</label>
                  <input name="numero" className="form-control" defaultValue={e.numero ?? ''} />
                </div>
                <div>
                  <label className="form-label">Complemento</label>
                  <input name="complemento" className="form-control" defaultValue={e.complemento ?? ''} />
                </div>
                <div>
                  <label className="form-label">Bairro</label>
                  <input name="bairro" className="form-control" defaultValue={e.bairro ?? ''} />
                </div>
                <div>
                  <label className="form-label">CEP</label>
                  <input name="cep" className="form-control" defaultValue={e.cep ?? ''} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Cidade</label>
                  <input name="cidade" className="form-control" defaultValue={e.cidade ?? ''} />
                </div>
                <div>
                  <label className="form-label">Estado (UF)</label>
                  <input name="estado" className="form-control" maxLength={2} defaultValue={e.estado ?? ''} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader icon="contato" title="Contato" />
            <div className="card-body" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div><label className="form-label">Telefone</label><input name="telefone" className="form-control" defaultValue={e.telefone ?? ''} /></div>
                <div><label className="form-label">E-mail</label><input name="email" type="email" className="form-control" defaultValue={e.email ?? ''} /></div>
                <div><label className="form-label">Site</label><input name="site" className="form-control" defaultValue={e.site ?? ''} /></div>
                <div><label className="form-label">Nome do Contato</label><input name="contato_nome" className="form-control" defaultValue={e.contato_nome ?? ''} /></div>
                <div>
                  <label className="form-label">Cargo do Contato</label>
                  <select name="contato_cargo" className="form-control" defaultValue={e.contato_cargo ?? ''}>
                    <option value="">Selecione...</option>
                    {CARGO_CONTATO_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Nome do Diretor</label><input name="diretor_nome" className="form-control" defaultValue={e.diretor_nome ?? ''} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader icon="alunos" title="Quantidade de Alunos por Segmento" hint="Total é opcional — some sozinho se deixado em branco" />
            <div className="card-body" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                
                {/* Infantil */}
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '1rem' }}>
                  <label style={{ ...labelStyle, color: '#ea580c', fontSize: '.68rem' }}>Ed. Infantil</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                    <TurmaField name="qtd_infantil2" label="Inf. 2" value={e.qtd_infantil2 ?? 0} />
                    <TurmaField name="qtd_infantil3" label="Inf. 3" value={e.qtd_infantil3 ?? 0} />
                    <TurmaField name="qtd_infantil4" label="Inf. 4" value={e.qtd_infantil4 ?? 0} />
                    <TurmaField name="qtd_infantil5" label="Inf. 5" value={e.qtd_infantil5 ?? 0} />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #fed7aa', paddingTop: '.6rem' }}>
                    <label style={{ ...labelStyle, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_infantil" type="number" min="0" defaultValue={e.qtd_infantil ?? 0}
                      style={{ ...inputStyle, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Fund I */}
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '1rem' }}>
                  <label style={{ ...labelStyle, color: '#2563eb', fontSize: '.68rem' }}>Fund. I</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.4rem' }}>
                    <TurmaField name="qtd_fund1_ano1" label="1º Ano" value={e.qtd_fund1_ano1 ?? 0} />
                    <TurmaField name="qtd_fund1_ano2" label="2º Ano" value={e.qtd_fund1_ano2 ?? 0} />
                    <TurmaField name="qtd_fund1_ano3" label="3º Ano" value={e.qtd_fund1_ano3 ?? 0} />
                    <TurmaField name="qtd_fund1_ano4" label="4º Ano" value={e.qtd_fund1_ano4 ?? 0} />
                    <TurmaField name="qtd_fund1_ano5" label="5º Ano" value={e.qtd_fund1_ano5 ?? 0} />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #bfdbfe', paddingTop: '.6rem' }}>
                    <label style={{ ...labelStyle, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_fund1" type="number" min="0" defaultValue={e.qtd_fund1 ?? 0}
                      style={{ ...inputStyle, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Fund II */}
                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '1rem' }}>
                  <label style={{ ...labelStyle, color: '#7c3aed', fontSize: '.68rem' }}>Fund. II</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                    <TurmaField name="qtd_fund2_ano6" label="6º Ano" value={e.qtd_fund2_ano6 ?? 0} />
                    <TurmaField name="qtd_fund2_ano7" label="7º Ano" value={e.qtd_fund2_ano7 ?? 0} />
                    <TurmaField name="qtd_fund2_ano8" label="8º Ano" value={e.qtd_fund2_ano8 ?? 0} />
                    <TurmaField name="qtd_fund2_ano9" label="9º Ano" value={e.qtd_fund2_ano9 ?? 0} />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #ddd6fe', paddingTop: '.6rem' }}>
                    <label style={{ ...labelStyle, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_fund2" type="number" min="0" defaultValue={e.qtd_fund2 ?? 0}
                      style={{ ...inputStyle, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Médio */}
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '1rem' }}>
                  <label style={{ ...labelStyle, color: '#dc2626', fontSize: '.68rem' }}>Ens. Médio</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.4rem' }}>
                    <TurmaField name="qtd_medio_1s" label="1ª S" value={e.qtd_medio_1s ?? 0} />
                    <TurmaField name="qtd_medio_2s" label="2ª S" value={e.qtd_medio_2s ?? 0} />
                    <TurmaField name="qtd_medio_3s" label="3ª S" value={e.qtd_medio_3s ?? 0} />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #fca5a5', paddingTop: '.6rem' }}>
                    <label style={{ ...labelStyle, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_medio" type="number" min="0" defaultValue={e.qtd_medio ?? 0}
                      style={{ ...inputStyle, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

              </div>

              {/* Maior turma */}
              <div style={{ marginTop: '1.25rem', padding: '1.1rem 1.25rem', background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', border: '2px solid #bfdbfe', borderRadius: 14, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#2563eb', marginBottom: '.3rem' }}>
                    Maior Turma <span style={{ color: '#dc2626' }}>*</span>
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.5, maxWidth: 340 }}>
                    Quantidade de alunos na maior turma. Determina o nº de notebooks no Comodato (1 notebook a cada 2 alunos).
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <input
                    name="maior_sala" type="number" min="0" max="60" defaultValue={e.maior_sala ?? 0}
                    style={{ ...inputStyle, width: 90, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, padding: '.55rem', borderColor: '#93c5fd', background: '#fff' }}
                  />
                  <div style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.7 }}>
                    alunos<br /><span style={{ color: '#7c3aed', fontWeight: 700 }}>= ⌈n÷2⌉ notebooks</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="card">
            <SectionHeader icon="gestao" title="Gestão Comercial" />
            <div className="card-body" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Origem do Lead</label>
                  <select name="origem_lead" className="form-control" defaultValue={e.origem_lead ?? ''}>
                    <option value="">Selecione...</option>
                    {ORIGEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Responsável Comercial</label>
                  <select name="responsavel_id" className="form-control" defaultValue={e.responsavel_id ?? ''}>
                    <option value="">Selecione...</option>
                    {profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Observações</label>
                <textarea name="observacoes" className="form-control" rows={3} defaultValue={e.observacoes ?? ''} />
              </div>
            </div>
          </div>

          <div
            className="mp-form-actions"
            style={{
              display: 'flex', gap: '.75rem', alignItems: 'center', justifyContent: 'flex-end',
              padding: '1.1rem 1.4rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
              position: 'sticky', bottom: '1rem', zIndex: 5,
            }}
          >
            <Link href={`/comercial/escolas/${id}`} className="btn btn-ghost">Cancelar</Link>
            <button type="submit" className="btn btn-primary" style={{ padding: '.65rem 1.5rem' }}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  )
}
