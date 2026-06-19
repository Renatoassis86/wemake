import { createClient } from '@/lib/supabase/server'
import { upsertEscola } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { PERFIL_OPTIONS, ORIGEM_OPTIONS, CARGO_CONTATO_OPTIONS } from '@/types/database'
import { CheckboxPaideia } from '@/components/ui/CheckboxPaideia'

/* ── Estilos reutilizáveis ──────────────────────────────────────── */
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  marginBottom: '1.5rem', overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(15,23,42,.06)',
}
const cardHeader = (color = '#4A7FDB'): React.CSSProperties => ({
  padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9',
  background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem',
})
const dot = (color = '#4A7FDB'): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem',
})
const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.78rem', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a',
}
const cardBody: React.CSSProperties = { padding: '1.5rem 1.75rem' }
const label: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.4rem',
}
const input: React.CSSProperties = {
  width: '100%', padding: '.65rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none',
  boxSizing: 'border-box',
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1.5rem' }
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem 1.5rem' }

/* ── Componente de campo de turma ───────────────────────────────── */
function TurmaField({ name, label: lbl }: { name: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ ...label, textTransform: 'none', fontSize: '.75rem', letterSpacing: '.01em', color: '#475569', fontWeight: 600 }}>
        {lbl}
      </label>
      <input
        name={name} type="number" min="0" defaultValue="0"
        style={{ ...input, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700 }}
      />
    </div>
  )
}

interface Props { searchParams: Promise<{ lead?: string }> }

export default async function EscolaNova({ searchParams }: Props) {
  const params = await searchParams
  const leadId = params.lead ?? ''  // 'lead:NomeEscola' quando vindo do banco de leads

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles').select('id, full_name').eq('is_active', true).order('full_name')

  // Pré-preencher com dados do lead se vier do banco de leads
  let leadData: any = null
  if (leadId.startsWith('lead:')) {
    const nomeEscola = decodeURIComponent(leadId.replace('lead:', ''))
    const { data: leads } = await supabase
      .from('leads_universal')
      .select('*')
      .ilike('escola_nome', nomeEscola)
      .limit(1)
    if (leads && leads.length > 0) leadData = leads[0]
  }

  return (
    <div>
      <PageHeader
        title="Cadastrar Nova Escola"
        subtitle="Preencha os dados da escola parceira"
        actions={
          <Link href="/comercial/escolas" style={{
            padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', textDecoration: 'none',
            fontSize: '.82rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            ← Voltar
          </Link>
        }
      />

      <div style={{ padding: '2rem 2.5rem', maxWidth: 860, margin: '0 auto' }}>
        <form action={upsertEscola}>

          {/* ── 1. IDENTIFICAÇÃO ───────────────────────────────── */}
          <div style={card}>
            <div style={cardHeader()}>
              <div style={dot()}><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/></svg></div>
              <div style={sectionTitle}>Identificação</div>
            </div>
            <div style={cardBody}>
              <div style={grid2}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Nome da Escola <span style={{ color: '#4A7FDB' }}>*</span></label>
                  <input name="nome" style={input} required placeholder="Nome completo da escola" />
                </div>
                <div>
                  <label style={label}>CNPJ</label>
                  <input name="cnpj" style={input} placeholder="00.000.000/0001-00" />
                </div>
                <div>
                  <label style={label}>Perfil Pedagógico</label>
                  <select name="perfil_pedagogico" style={input}>
                    {PERFIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <CheckboxPaideia defaultChecked={false} />
              </div>
            </div>
          </div>

          {/* ── 2. ENDEREÇO ────────────────────────────────────── */}
          <div style={card}>
            <div style={cardHeader('#0ea5e9')}>
              <div style={dot('#0ea5e9')}><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg></div>
              <div style={sectionTitle}>Endereço</div>
            </div>
            <div style={cardBody}>
              <div style={{ ...grid3, marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Rua / Logradouro</label>
                  <input name="rua" style={input} placeholder="Rua, Avenida, Travessa..." />
                </div>
                <div>
                  <label style={label}>Número</label>
                  <input name="numero" style={input} placeholder="Ex: 142" />
                </div>
              </div>
              <div style={{ ...grid3, marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Complemento</label>
                  <input name="complemento" style={input} placeholder="Sala, Bloco..." />
                </div>
                <div>
                  <label style={label}>Bairro</label>
                  <input name="bairro" style={input} />
                </div>
                <div>
                  <label style={label}>CEP</label>
                  <input name="cep" style={input} placeholder="00000-000" />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={label}>Cidade</label>
                  <input name="cidade" style={input} />
                </div>
                <div>
                  <label style={label}>Estado (UF)</label>
                  <input name="estado" style={input} maxLength={2} placeholder="Ex: PB" />
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. CONTATO ─────────────────────────────────────── */}
          <div style={card}>
            <div style={cardHeader('#8b5cf6')}>
              <div style={dot('#8b5cf6')}><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6.29 6.29l1.62-1.34a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'/></svg></div>
              <div style={sectionTitle}>Contato</div>
            </div>
            <div style={cardBody}>
              <div style={{ ...grid3, marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Telefone</label>
                  <input name="telefone" style={input} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label style={label}>E-mail</label>
                  <input name="email" type="email" style={input} placeholder="contato@escola.edu.br" />
                </div>
                <div>
                  <label style={label}>Site</label>
                  <input name="site" style={input} placeholder="https://..." />
                </div>
              </div>
              <div style={grid3}>
                <div>
                  <label style={label}>Nome do Contato Principal</label>
                  <input name="contato_nome" style={input} />
                </div>
                <div>
                  <label style={label}>Cargo do Contato</label>
                  <select name="contato_cargo" style={input}>
                    <option value="">Selecione...</option>
                    {CARGO_CONTATO_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Nome do Diretor</label>
                  <input name="diretor_nome" style={input} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. ALUNOS POR SEGMENTO ─────────────────────────── */}
          <div style={card}>
            <div style={cardHeader('#16a34a')}>
              <div style={dot('#16a34a')}><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><path d='M22 10v6M2 10l10-5 10 5-10 5z'/><path d='M6 12v5c3 3 9 3 12 0v-5'/></svg></div>
              <div>
                <div style={sectionTitle}>Quantidade de Alunos por Segmento</div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Informe o total de alunos em cada segmento. Deixe 0 para segmentos inexistentes.
                </div>
              </div>
            </div>
            <div style={cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>

                {/* Infantil */}
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '1.1rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}>
                    <div style={{ width: 4, height: 16, background: '#f97316', borderRadius: 2 }} />
                    <label style={{ ...label, color: '#ea580c', marginBottom: 0, fontSize: '.68rem' }}>Ed. Infantil</label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                    <TurmaField name="qtd_infantil2" label="Inf. 2" />
                    <TurmaField name="qtd_infantil3" label="Inf. 3" />
                    <TurmaField name="qtd_infantil4" label="Inf. 4" />
                    <TurmaField name="qtd_infantil5" label="Inf. 5" />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #fed7aa', paddingTop: '.6rem' }}>
                    <label style={{ ...label, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_infantil" type="number" min="0" defaultValue="0"
                      style={{ ...input, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Fund I */}
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '1.1rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}>
                    <div style={{ width: 4, height: 16, background: '#2563eb', borderRadius: 2 }} />
                    <label style={{ ...label, color: '#2563eb', marginBottom: 0, fontSize: '.68rem' }}>Fund. I</label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.4rem' }}>
                    <TurmaField name="qtd_fund1_ano1" label="1º Ano" />
                    <TurmaField name="qtd_fund1_ano2" label="2º Ano" />
                    <TurmaField name="qtd_fund1_ano3" label="3º Ano" />
                    <TurmaField name="qtd_fund1_ano4" label="4º Ano" />
                    <TurmaField name="qtd_fund1_ano5" label="5º Ano" />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #bfdbfe', paddingTop: '.6rem' }}>
                    <label style={{ ...label, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_fund1" type="number" min="0" defaultValue="0"
                      style={{ ...input, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Fund II */}
                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '1.1rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}>
                    <div style={{ width: 4, height: 16, background: '#7c3aed', borderRadius: 2 }} />
                    <label style={{ ...label, color: '#7c3aed', marginBottom: 0, fontSize: '.68rem' }}>Fund. II</label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                    <TurmaField name="qtd_fund2_ano6" label="6º Ano" />
                    <TurmaField name="qtd_fund2_ano7" label="7º Ano" />
                    <TurmaField name="qtd_fund2_ano8" label="8º Ano" />
                    <TurmaField name="qtd_fund2_ano9" label="9º Ano" />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #ddd6fe', paddingTop: '.6rem' }}>
                    <label style={{ ...label, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_fund2" type="number" min="0" defaultValue="0"
                      style={{ ...input, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

                {/* Médio */}
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '1.1rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}>
                    <div style={{ width: 4, height: 16, background: '#dc2626', borderRadius: 2 }} />
                    <label style={{ ...label, color: '#dc2626', marginBottom: 0, fontSize: '.68rem' }}>Ens. Médio</label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
                    <TurmaField name="qtd_medio_1s" label="1ª S" />
                    <TurmaField name="qtd_medio_2s" label="2ª S" />
                    <TurmaField name="qtd_medio_3s" label="3ª S" />
                  </div>
                  <div style={{ marginTop: '.8rem', borderTop: '1px dashed #fca5a5', paddingTop: '.6rem' }}>
                    <label style={{ ...label, fontSize: '.6rem', color: '#94a3b8', textAlign: 'center' }}>Total (Opcional)</label>
                    <input name="qtd_medio" type="number" min="0" defaultValue="0"
                      style={{ ...input, textAlign: 'center', padding: '.4rem', background: '#fff', fontSize: '.9rem', fontWeight: 700 }} />
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ── 5. GESTÃO COMERCIAL ────────────────────────────── */}
          <div style={card}>
            <div style={cardHeader('#4A7FDB')}>
              <div style={dot()}><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><line x1='18' y1='20' x2='18' y2='10'/><line x1='12' y1='20' x2='12' y2='4'/><line x1='6' y1='20' x2='6' y2='14'/></svg></div>
              <div style={sectionTitle}>Gestão Comercial</div>
            </div>
            <div style={cardBody}>
              <div style={{ ...grid2, marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Origem do Lead</label>
                  <select name="origem_lead" style={input}>
                    <option value="">Selecione...</option>
                    {ORIGEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Responsável Comercial</label>
                  <select name="responsavel_id" style={input}>
                    <option value="">Selecione...</option>
                    {profiles?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={label}>Observações internas</label>
                <textarea name="observacoes" rows={3} style={{ ...input, resize: 'vertical', minHeight: 80 }}
                  placeholder="Notas relevantes sobre esta escola..." />
              </div>
            </div>
          </div>

          {/* ── AÇÕES ──────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1.25rem 1.75rem',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 16,
          }}>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
              color: '#fff', padding: '.7rem 2rem',
              borderRadius: 9999, border: 'none', cursor: 'pointer',
              fontSize: '.875rem', fontWeight: 700,
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 4px 14px rgba(74,127,219,.35)',
              letterSpacing: '.01em',
            }}>
              Cadastrar Escola
            </button>
            <Link href="/comercial/escolas" style={{
              padding: '.7rem 1.5rem', borderRadius: 9999,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', textDecoration: 'none',
              fontSize: '.875rem', fontWeight: 600,
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Cancelar
            </Link>
            <span style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginLeft: 'auto' }}>
              Campos com <span style={{ color: '#4A7FDB', fontWeight: 700 }}>*</span> são obrigatórios
            </span>
          </div>

        </form>
      </div>
    </div>
  )
}
