import { createClient } from '@/lib/supabase/server'
import { upsertRegistro } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import {
  MEIO_OPTIONS, INTERESSE_OPTIONS, PRONTIDAO_OPTIONS,
  ABERTURA_OPTIONS, ENCAMINHAMENTOS_OPTIONS, CARGO_CONTATO_OPTIONS,
  RESPONSAVEIS_OPTIONS,
} from '@/types/database'

interface Props { searchParams: Promise<{ escola?: string }> }

/* ── Estilos locais ── */
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)',
}
const secHeader = (color = '#d97706'): React.CSSProperties => ({
  padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa',
  display: 'flex', alignItems: 'center', gap: '.65rem',
})
const iconDot = (c = '#d97706'): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
  background: c, display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const secTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a',
}
const body: React.CSSProperties = { padding: '1.5rem 1.75rem' }
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.45rem',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '.7rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none',
  boxSizing: 'border-box',
}
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1.5rem' }
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem 1.5rem' }

export default async function RegistroNovo({ searchParams }: Props) {
  const params   = await searchParams
  const escolaId = params.escola ?? ''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [escolas, { data: profiles }, { data: negociacoes }] = await Promise.all([
    buscarEscolasUnificadas(supabase),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    escolaId
      ? supabase.from('negociacoes').select('id, titulo, stage').eq('escola_id', escolaId).eq('ativa', true)
      : Promise.resolve({ data: [] }),
  ])

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div>
      <PageHeader
        title="Registrar Interação Comercial"
        subtitle="Documente o contato com a escola parceira"
        actions={
          <Link href={escolaId ? `/comercial/escolas/${escolaId}` : '/comercial/registros'}
            style={{ padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            ← Voltar
          </Link>
        }
      />

      <div style={{ padding: '2rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>
        <form action={upsertRegistro}>

          {/* ── 1. ESCOLA E DATA ─────────────────────────────── */}
          <div style={card}>
            <div style={secHeader('#0f172a')}>
              <div style={{ ...iconDot('#0f172a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
              <div style={secTitle}>Escola e Data do Contato</div>
            </div>
            <div style={body}>
              <div style={{ ...g3, marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>Escola <span style={{ color: '#d97706' }}>*</span></label>
                  <select name="escola_id" style={inp} required defaultValue={escolaId}>
                    <option value="">Selecione a escola...</option>
                    {escolas?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Negociação Vinculada</label>
                  <select name="negociacao_id" style={inp}>
                    <option value="">Nenhuma</option>
                    {negociacoes?.map((n: any) => (
                      <option key={n.id} value={n.id}>{n.titulo ?? n.stage}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={g3}>
                <div>
                  <label style={lbl}>Data do Contato <span style={{ color: '#d97706' }}>*</span></label>
                  <input name="data_contato" type="date" style={inp} defaultValue={hoje} required />
                </div>
                <div>
                  <label style={lbl}>Horário do Contato</label>
                  <input name="hora_contato" type="time" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Meio do Contato</label>
                  <select name="meio_contato" style={inp}>
                    {MEIO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. PESSOAS DO CONTATO ────────────────────────── */}
          <div style={card}>
            <div style={secHeader('#8b5cf6')}>
              <div style={{ ...iconDot('#8b5cf6'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div style={secTitle}>Pessoas do Contato</div>
            </div>
            <div style={body}>
              <div style={g3}>
                <div>
                  <label style={lbl}>Responsável pelo Contato</label>
                  <select name="responsavel_id" style={inp} defaultValue={user?.id ?? ''}>
                    {profiles?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nome do Contato na Escola</label>
                  <input name="contato_nome" style={inp} placeholder="Quem estava na reunião?" />
                </div>
                <div>
                  <label style={lbl}>Cargo do Contato</label>
                  <select name="contato_cargo" style={inp}>
                    <option value="">Selecione...</option>
                    {CARGO_CONTATO_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. RESUMO DA REUNIÃO ─────────────────────────── */}
          <div style={card}>
            <div style={secHeader('#0ea5e9')}>
              <div style={{ ...iconDot('#0ea5e9'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <div style={secTitle}>Resumo do Contato</div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Descreva os pontos discutidos, decisões tomadas e observações importantes</div>
              </div>
            </div>
            <div style={body}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Resumo da Conversa <span style={{ color: '#d97706' }}>*</span></label>
                <textarea name="resumo" rows={5} style={{ ...inp, resize: 'vertical', minHeight: 120 }}
                  placeholder="Descreva detalhadamente o que foi conversado, principais pontos discutidos, objeções levantadas, interesse demonstrado e qualquer informação relevante sobre o andamento da negociação..." required />
              </div>
              <div>
                <label style={lbl}>Notas Internas</label>
                <textarea name="notas_internas" rows={2} style={{ ...inp, resize: 'vertical', minHeight: 70 }}
                  placeholder="Anotações privadas da equipe (não visíveis ao parceiro)..." />
              </div>
            </div>
          </div>

          {/* ── 4. DIAGNÓSTICO COMERCIAL ─────────────────────── */}
          <div style={card}>
            <div style={secHeader('#d97706')}>
              <div style={{ ...iconDot('#d97706'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <div style={secTitle}>Diagnóstico Comercial</div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Avalie o nível de engajamento e a fase da negociação</div>
              </div>
            </div>
            <div style={body}>
              <div style={{ ...g3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={lbl}>Nível de Interesse Percebido</label>
                  <select name="interesse" style={inp}>
                    {INTERESSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Prontidão — Fase da Negociação</label>
                  <select name="prontidao" style={inp}>
                    {PRONTIDAO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Abertura para Proposta</label>
                  <select name="abertura" style={inp}>
                    {ABERTURA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Encaminhamentos */}
              <div>
                <label style={lbl}>Encaminhamentos — Próximo passo previsto</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.5rem', marginTop: '.5rem' }}>
                  {ENCAMINHAMENTOS_OPTIONS.map(o => (
                    <label key={o.value} style={{
                      display: 'flex', alignItems: 'center', gap: '.65rem',
                      padding: '.75rem 1rem', background: '#f8fafc',
                      border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer',
                      fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
                      transition: 'border-color .15s',
                    }}>
                      <input type="checkbox" name="encaminhamentos" value={o.value}
                        style={{ width: 16, height: 16, accentColor: '#d97706', flexShrink: 0 }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. QUANTITATIVOS DE ALUNOS ───────────────────── */}
          <div style={card}>
            <div style={secHeader('#16a34a')}>
              <div style={{ ...iconDot('#16a34a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <div>
                <div style={secTitle}>Quantitativos de Alunos</div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Dados de alunos informados nesta interação (base para cálculo de potencial)</div>
              </div>
            </div>
            <div style={body}>
              {/* Segmentos Granulares */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                
                {/* Infantil */}
                <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: 12, border: '1px solid #fed7aa' }}>
                  <label style={{ ...lbl, color: '#9a3412', marginBottom: '.75rem' }}>Educação Infantil</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem' }}>
                    {[
                      { n: 'qtd_infantil2', l: 'Inf 2' },
                      { n: 'qtd_infantil3', l: 'Inf 3' },
                      { n: 'qtd_infantil4', l: 'Inf 4' },
                      { n: 'qtd_infantil5', l: 'Inf 5' },
                    ].map(f => (
                      <div key={f.n}>
                        <div style={{ fontSize: '.6rem', fontWeight: 700, textAlign: 'center', color: '#ea580c' }}>{f.l}</div>
                        <input name={f.n} type="number" min="0" defaultValue="0" style={{ ...inp, padding: '.4rem', textAlign: 'center' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fund I */}
                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <label style={{ ...lbl, color: '#1e40af', marginBottom: '.75rem' }}>Fundamental I</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem' }}>
                    {[
                      { n: 'qtd_fund1_ano1', l: '1º A' },
                      { n: 'qtd_fund1_ano2', l: '2º A' },
                      { n: 'qtd_fund1_ano3', l: '3º A' },
                      { n: 'qtd_fund1_ano4', l: '4º A' },
                      { n: 'qtd_fund1_ano5', l: '5º A' },
                    ].map(f => (
                      <div key={f.n}>
                        <div style={{ fontSize: '.6rem', fontWeight: 700, textAlign: 'center', color: '#2563eb' }}>{f.l}</div>
                        <input name={f.n} type="number" min="0" defaultValue="0" style={{ ...inp, padding: '.4rem', textAlign: 'center' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fund II e Médio */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
                {[
                  ['qtd_fund2',    'Fundamental II'],
                  ['qtd_medio',    'Ensino Médio'],
                ].map(([name, label]) => (
                  <div key={name} style={{ gridColumn: 'span 2' }}>
                    <label style={lbl}>{label}</label>
                    <input name={name} type="number" min="0" defaultValue="0"
                      style={{ ...inp, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700 }} />
                  </div>
                ))}
              </div>

              {/* Cálculo automático exibido */}
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '.65rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>Cálculo Automático</div>
                  <div style={{ fontSize: '.78rem', color: '#78350f', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.5 }}>
                    Potencial, probabilidade e classificação são calculados automaticamente ao salvar.
                    <br />
                    <span style={{ fontWeight: 600 }}>Infantil × R$1.046,26 · Fund.I × R$1.302,15 · Fund.II × R$1.302,15 · Médio × R$1.302,15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. FOLLOW-UP ─────────────────────────────────── */}
          <div style={card}>
            <div style={secHeader('#6366f1')}>
              <div style={{ ...iconDot('#6366f1'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={secTitle}>Follow-up e Próximos Passos</div>
            </div>
            <div style={body}>
              <div style={g2}>
                <div>
                  <label style={lbl}>Data do Próximo Contato Previsto</label>
                  <input name="proximo_contato" type="date" style={inp} />
                </div>
              </div>
            </div>
          </div>

          {/* ── AÇÕES ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #d97706, #b45309)',
              color: '#fff', padding: '.7rem 2rem', borderRadius: 9999,
              border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 700,
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 4px 14px rgba(217,119,6,.35)', letterSpacing: '.01em',
            }}>
              Salvar Registro
            </button>
            <Link href={escolaId ? `/comercial/escolas/${escolaId}` : '/comercial/registros'}
              style={{ padding: '.7rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Cancelar
            </Link>
            <span style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginLeft: 'auto' }}>
              Campos com <span style={{ color: '#d97706', fontWeight: 700 }}>*</span> são obrigatórios
            </span>
          </div>

        </form>
      </div>
    </div>
  )
}
