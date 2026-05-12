import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { upsertEscola } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { PERFIL_OPTIONS, ORIGEM_OPTIONS, CARGO_CONTATO_OPTIONS } from '@/types/database'
import { CheckboxPaideia } from '@/components/ui/CheckboxPaideia'

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
  const supabase = await createClient()

  const [{ data: escola }, { data: profiles }] = await Promise.all([
    supabase.from('escolas').select('*').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  if (!escola) notFound()
  const e = escola as any

  return (
    <div>
      <PageHeader title={`Editar: ${e.nome}`} />
      <div className="p-6 max-w-4xl">
        <div className="breadcrumb mb-4">
          <Link href="/comercial/escolas">Escolas</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href={`/comercial/escolas/${id}`}>{e.nome}</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Editar</span>
        </div>

        <form action={upsertEscola}>
          <input type="hidden" name="id" value={id} />

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Identificação</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <CheckboxPaideia defaultChecked={e.escola_paideia ?? false} />
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Endereço</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Contato</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Quantidade de Alunos por Segmento</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                
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
            </div>
          </div>

          <div className="card mb-6">
            <div className="card-header"><span className="card-title">Gestão Comercial</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    {profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">Observações</label>
                <textarea name="observacoes" className="form-control" rows={3} defaultValue={e.observacoes ?? ''} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button type="submit" className="btn btn-primary">Salvar Alterações</button>
            <Link href={`/comercial/escolas/${id}`} className="btn btn-ghost">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
