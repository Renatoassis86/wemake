import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { atualizarProposta } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CopyButton } from '@/components/ui/CopyButton'
import { ArquivarPropostaBtn } from '@/components/comercial/ArquivarPropostaBtn'
import { RenovarValidadeBtn } from '@/components/comercial/RenovarValidadeBtn'

export const dynamic = 'force-dynamic'

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.07em', color: '#64748b', marginBottom: '.45rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '.65rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
}

const hintStyle: React.CSSProperties = {
  fontSize: '.72rem', color: '#94a3b8', marginTop: '.35rem',
  fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.5,
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  )
}

function SectionCard({ title, icon, accent, bg, children }: {
  title: string; icon: React.ReactNode; accent: string; bg: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>
          {title}
        </div>
      </div>
      <div style={{ padding: '1.5rem', background: bg }}>
        {children}
      </div>
    </div>
  )
}

const Icon = {
  key: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>,
  school: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  dollar: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  note: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="10" y2="11"/></svg>,
  lock: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
}

interface Props { params: Promise<{ id: string }> }

export default async function PropostaEditar({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: p } = await admin.from('propostas').select('*').eq('id', id).single()
  if (!p) notFound()

  const arquivada = !!p.arquivada_em

  const mensagemEnvio = `Foi um prazer conversar sobre a ${p.escola_nome}. Acreditamos que formar estudantes que pensam, criam e vivem com intencionalidade cristã é um dos trabalhos mais importantes que uma escola confessional pode fazer, e é com esse propósito que a We Make se coloca como parceira.

Como combinamos, aqui está a proposta personalizada para vocês:

🔗 Link: https://comercial.wemake.tec.br/proposta/${p.token}
🔑 PIN de acesso: ${p.escola_pin}

Essa foi a proposta oficial que enviamos para a escola.`

  return (
    <div>
      <PageHeader title={`Editar proposta: ${p.escola_nome}`} />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="breadcrumb mb-4">
          <Link href="/comercial/propostas">Propostas</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{p.escola_nome}</span>
        </div>

        {arquivada && (
          <div style={{ marginBottom: '1.5rem', padding: '.9rem 1.25rem', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, fontSize: '.82rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
            Esta proposta está arquivada — não aparece na listagem principal nem deve ser enviada à escola.
          </div>
        )}

        {/* ── Somente leitura: token, PIN, link, contadores ─────────── */}
        <SectionCard title="Acesso da Escola" icon={Icon.key} accent="#b45309" bg="#fffbeb">
          <div style={{ ...grid2, marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>PIN de acesso</label>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#92400e', letterSpacing: '.25em' }}>
                {p.escola_pin}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Visualizações</label>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {p.visualizacoes ?? 0}
                {p.visualizado_em && (
                  <span style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 400, fontFamily: 'var(--font-inter,sans-serif)', marginLeft: '.6rem', letterSpacing: 0 }}>
                    última em {formatDateTime(p.visualizado_em)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Link da proposta</label>
            <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', background: '#fff', border: '1.5px solid #fde68a', borderRadius: 8, padding: '.6rem .9rem' }}>
              <a href={`/proposta/${p.token}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '.8rem', color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all', fontFamily: 'var(--font-inter,sans-serif)' }}>
                /proposta/{p.token}
              </a>
              <CopyButton text={`/proposta/${p.token}`} absolute label="Copiar link" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Mensagem pronta para enviar</label>
            <div style={{
              background: '#fff', border: '1.5px solid #fde68a', borderRadius: 8,
              padding: '.9rem 1.1rem', fontSize: '.8rem', color: '#334155',
              lineHeight: 1.65, whiteSpace: 'pre-line', fontFamily: 'var(--font-inter,sans-serif)',
              marginBottom: '.6rem',
            }}>
              {mensagemEnvio}
            </div>
            <CopyButton text={mensagemEnvio} label="Copiar mensagem" />
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #fde68a', fontSize: '.72rem', color: '#a16207', fontFamily: 'var(--font-inter,sans-serif)' }}>
            Criada em {formatDateTime(p.created_at)} · Tipo original: {p.tipo === 'curriculo_comodato' ? 'Currículo + Comodato' : 'Somente Currículo'}
          </div>
        </SectionCard>

        {/* ── Formulário editável ────────────────────────────────────── */}
        <form action={async (formData: FormData) => { 'use server'; await atualizarProposta(formData) }}>
          <input type="hidden" name="id" value={id} />

          <SectionCard title="Escola" icon={Icon.school} accent="#2563eb" bg="#fff">
            <div style={{ ...grid2, marginBottom: '1.25rem' }}>
              <Field label="Nome da escola *">
                <input name="escola_nome" style={inputStyle} defaultValue={p.escola_nome} required />
              </Field>
              <Field label="E-mail da escola">
                <input name="escola_email" type="email" style={inputStyle} defaultValue={p.escola_email ?? ''} />
              </Field>
            </div>
            <div style={grid2}>
              <Field label="Validade da proposta">
                <input name="validade" type="date" style={inputStyle} defaultValue={p.validade} />
              </Field>
              <Field label="Status">
                <select name="status" style={{ ...inputStyle, cursor: 'pointer' }} defaultValue={p.status}>
                  <option value="ativa">Ativa</option>
                  <option value="expirada">Expirada</option>
                  <option value="aceita">Aceita</option>
                  <option value="recusada">Recusada</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Comercial" icon={Icon.dollar} accent="#16a34a" bg="#fff">
            <div style={{ marginBottom: '1.25rem' }}>
              <Field
                label="Tipo de proposta"
                hint="Trocar o tipo aqui não recalcula os valores automaticamente — ajuste os campos abaixo manualmente se precisar."
              >
                <select name="tipo" style={{ ...inputStyle, cursor: 'pointer' }} defaultValue={p.tipo}>
                  <option value="curriculo">Somente Currículo</option>
                  <option value="curriculo_comodato">Currículo + Comodato</option>
                </select>
              </Field>
            </div>
            <div style={{ ...grid2, marginBottom: '1.25rem' }}>
              <Field label="Valor por aluno / ano — Somente Currículo (R$)">
                <input name="valor_aluno_ano" type="number" step="0.01" min="0" style={inputStyle} defaultValue={p.valor_aluno_ano} />
              </Field>
              <Field
                label="Valor por aluno / ano — Currículo + Comodato (R$)"
                hint='Só é usado quando o tipo acima é "Currículo + Comodato".'
              >
                <input name="valor_aluno_ano_comodato" type="number" step="0.01" min="0" style={inputStyle} defaultValue={p.valor_aluno_ano_comodato ?? ''} />
              </Field>
            </div>
            <div style={{ ...grid2, marginBottom: '1.25rem' }}>
              <Field
                label="Parcelas — Comodato (ou proposta, se não houver comodato)"
                hint="Quando o tipo é Currículo + Comodato, esse número é o parcelamento do lado Comodato (normalmente 12x, mensal)."
              >
                <input name="num_parcelas" type="number" min="1" max="24" style={inputStyle} defaultValue={p.num_parcelas} />
              </Field>
              <Field
                label="Parcelas — Somente Currículo"
                hint='Só é usado quando o tipo é "Currículo + Comodato" — parcelamento do modelo Somente Currículo, mostrado lado a lado com o comodato.'
              >
                <input name="num_parcelas_curriculo" type="number" min="1" max="24" style={inputStyle} defaultValue={p.num_parcelas_curriculo ?? 5} />
              </Field>
            </div>
            <div style={grid2}>
              <Field label="Duração do contrato (meses)">
                <input name="duracao_meses" type="number" min="1" style={inputStyle} defaultValue={p.duracao_meses} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Texto Personalizado" icon={Icon.note} accent="#7c3aed" bg="#fff">
            <textarea
              name="texto_personalizado" rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100, fontFamily: 'var(--font-inter,sans-serif)' }}
              defaultValue={p.texto_personalizado ?? ''}
              placeholder="Mensagem ou observações especiais para incluir na proposta..."
            />
          </SectionCard>

          <SectionCard title="Somente Leitura — Configuração do Comodato" icon={Icon.lock} accent="#64748b" bg="#f8fafc">
            <p style={{ ...hintStyle, marginBottom: '1.1rem' }}>
              Alunos, segmentos e os detalhes do comodato (equipamentos, leasing) vêm da calculadora e não são editáveis aqui — para mudar esses dados, gere uma nova proposta pela Calculadora.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {[
                { val: p.num_alunos, label: 'alunos' },
                { val: p.segmentos, label: 'segmento(s)' },
                { val: p.comodato_notebooks ?? '—', label: 'notebooks' },
                { val: p.comodato_parcela ? formatCurrency(p.comodato_parcela) : '—', label: 'parcela comodato' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.85rem 1rem' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.3rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            padding: '1.25rem 1.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            boxShadow: '0 1px 4px rgba(15,23,42,.06)',
          }}>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: '#fff',
              padding: '.7rem 2rem', borderRadius: 9999, border: 'none', cursor: 'pointer',
              fontSize: '.875rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: '0 4px 14px rgba(74,127,219,.35)',
            }}>
              Salvar alterações
            </button>
            <Link href="/comercial/propostas" style={{
              padding: '.7rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600,
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Cancelar
            </Link>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem' }}>
              <RenovarValidadeBtn propostaId={id} escolaNome={p.escola_nome} variant="form" />
              <ArquivarPropostaBtn propostaId={id} escolaNome={p.escola_nome} arquivada={arquivada} variant="form" redirectTo="/comercial/propostas" />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
