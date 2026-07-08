import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { atualizarProposta } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CopyButton } from '@/components/ui/CopyButton'
import { ArquivarPropostaBtn } from '@/components/comercial/ArquivarPropostaBtn'

export const dynamic = 'force-dynamic'

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.4rem',
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }

interface Props { params: Promise<{ id: string }> }

export default async function PropostaEditar({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: p } = await supabase.from('propostas').select('*').eq('id', id).single()
  if (!p) notFound()

  const arquivada = !!p.arquivada_em

  return (
    <div>
      <PageHeader title={`Editar proposta: ${p.escola_nome}`} />
      <div className="p-6" style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
        <div className="breadcrumb mb-4">
          <Link href="/comercial/propostas">Propostas</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{p.escola_nome}</span>
        </div>

        {arquivada && (
          <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
            Esta proposta está arquivada — não aparece na listagem principal nem deve ser enviada à escola.
          </div>
        )}

        {/* ── Somente leitura: token, PIN, link, contadores ─────────── */}
        <div className="card mb-4">
          <div className="card-header"><span className="card-title">Acesso da escola</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={grid2}>
              <div>
                <label style={labelStyle}>PIN de acesso</label>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 800, color: '#92400e', letterSpacing: '.2em' }}>
                  {p.escola_pin}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Visualizações</label>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {p.visualizacoes ?? 0}
                  {p.visualizado_em && (
                    <span style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 400, fontFamily: 'var(--font-inter,sans-serif)', marginLeft: '.5rem' }}>
                      última em {formatDate(p.visualizado_em)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Link da proposta</label>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <a href={`/proposta/${p.token}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.8rem', color: '#2a69ba', textDecoration: 'underline', wordBreak: 'break-all', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  /proposta/{p.token}
                </a>
                <CopyButton text={`/proposta/${p.token}`} absolute label="Copiar link" />
              </div>
            </div>
            <div style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
              Criada em {formatDate(p.created_at)} · Tipo original: {p.tipo === 'curriculo_comodato' ? 'Currículo + Comodato' : 'Somente Currículo'}
            </div>
          </div>
        </div>

        {/* ── Formulário editável ────────────────────────────────────── */}
        <form action={atualizarProposta}>
          <input type="hidden" name="id" value={id} />

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Escola</span></div>
            <div className="card-body">
              <div style={{ ...grid2, marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Nome da escola *</label>
                  <input name="escola_nome" className="form-control" defaultValue={p.escola_nome} required />
                </div>
                <div>
                  <label className="form-label">E-mail da escola</label>
                  <input name="escola_email" type="email" className="form-control" defaultValue={p.escola_email ?? ''} />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label className="form-label">Validade da proposta</label>
                  <input name="validade" type="date" className="form-control" defaultValue={p.validade} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" className="form-control" defaultValue={p.status}>
                    <option value="ativa">Ativa</option>
                    <option value="expirada">Expirada</option>
                    <option value="aceita">Aceita</option>
                    <option value="recusada">Recusada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Comercial</span></div>
            <div className="card-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Tipo de proposta</label>
                <select name="tipo" className="form-control" defaultValue={p.tipo}>
                  <option value="curriculo">Somente Currículo</option>
                  <option value="curriculo_comodato">Currículo + Comodato</option>
                </select>
                <div className="form-hint">
                  Trocar o tipo aqui não recalcula os valores automaticamente — ajuste os campos abaixo manualmente se precisar.
                </div>
              </div>
              <div style={{ ...grid2, marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Valor por aluno / ano — Somente Currículo (R$)</label>
                  <input name="valor_aluno_ano" type="number" step="0.01" min="0" className="form-control" defaultValue={p.valor_aluno_ano} />
                </div>
                <div>
                  <label className="form-label">Valor por aluno / ano — Currículo + Comodato (R$)</label>
                  <input name="valor_aluno_ano_comodato" type="number" step="0.01" min="0" className="form-control" defaultValue={p.valor_aluno_ano_comodato ?? ''} />
                  <div className="form-hint">Só é usado quando o tipo acima é &quot;Currículo + Comodato&quot;.</div>
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label className="form-label">Quantidade de parcelas da proposta</label>
                  <input name="num_parcelas" type="number" min="1" max="24" className="form-control" defaultValue={p.num_parcelas} />
                </div>
                <div>
                  <label className="form-label">Duração do contrato (meses)</label>
                  <input name="duracao_meses" type="number" min="1" className="form-control" defaultValue={p.duracao_meses} />
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Texto personalizado</span></div>
            <div className="card-body">
              <textarea name="texto_personalizado" rows={4} className="form-control" defaultValue={p.texto_personalizado ?? ''}
                placeholder="Mensagem ou observações especiais para incluir na proposta..." style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header"><span className="card-title">Somente leitura — configuração do comodato</span></div>
            <div className="card-body">
              <p className="form-hint" style={{ marginBottom: '1rem' }}>
                Alunos, segmentos e os detalhes do comodato (equipamentos, leasing) vêm da calculadora e não são editáveis aqui — para mudar esses dados, gere uma nova proposta pela Calculadora.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', fontSize: '.82rem', color: '#475569' }}>
                <div><strong style={{ display: 'block', color: '#0f172a' }}>{p.num_alunos}</strong>alunos</div>
                <div><strong style={{ display: 'block', color: '#0f172a' }}>{p.segmentos}</strong>segmento(s)</div>
                <div><strong style={{ display: 'block', color: '#0f172a' }}>{p.comodato_notebooks ?? '—'}</strong>notebooks</div>
                <div><strong style={{ display: 'block', color: '#0f172a' }}>{p.comodato_parcela ? formatCurrency(p.comodato_parcela) : '—'}</strong>parcela comodato</div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            padding: '1.25rem 1.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
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
            <div style={{ marginLeft: 'auto' }}>
              <ArquivarPropostaBtn propostaId={id} escolaNome={p.escola_nome} arquivada={arquivada} variant="form" redirectTo="/comercial/propostas" />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
