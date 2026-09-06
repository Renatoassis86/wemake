import { createAdminClient } from '@/lib/supabase/admin'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import { upsertNegociacao } from '@/lib/actions'
import { getFunilContratacao, FASE_LABELS, FASE_FUNIL_ORDEM, type FaseFunil } from '@/lib/funil-contratacao'
import { META_RECEITA } from '@/lib/metas'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EscolaSelector } from '@/components/ui/EscolaSelector'
import { FunilVisual } from '@/components/comercial/FunilVisual'
import { FasePopover } from '@/components/comercial/FasePopover'
import { ResponsavelInlineSelect } from '@/components/comercial/ResponsavelInlineSelect'
import { ContatoQuickEdit } from '@/components/comercial/ContatoQuickEdit'
import { PrioridadeInline } from '@/components/comercial/PrioridadeInline'
import { AnotacaoContatoInline } from '@/components/comercial/AnotacaoContatoInline'
import { AnexarPropostaPdf } from '@/components/comercial/AnexarPropostaPdf'
import { ContratoDocumentosPanel } from '@/components/comercial/ContratoDocumentosPanel'
import { STAGE_OPTIONS } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props { searchParams: Promise<{ escola?: string; fase?: string; q?: string }> }

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)',
}
const secHdr = (color = '#4A7FDB'): React.CSSProperties => ({
  padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9',
  background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem',
})
const dot = (c = '#4A7FDB'): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: c,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
  background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1.5rem' }

const FASE_COR: Record<FaseFunil, { bg: string; text: string; border: string }> = {
  negociacao:        { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  proposta_enviada:  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
  minuta:            { bg: '#fdf4ff', text: '#a21caf', border: '#e9d5ff' },
  contrato_enviado:  { bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' },
  contrato_assinado: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  implantacao:       { bg: '#f5f3ff', text: '#7c3aed', border: '#c4b5fd' },
  parceiro_ativo:    { bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' },
}
const FASE_DECLINADA = { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' }

export default async function FunilContratacaoPage({ searchParams }: Props) {
  const params   = await searchParams
  const escolaId = params.escola ?? ''
  const faseFiltro = (params.fase ?? '') as FaseFunil | ''
  const q = (params.q ?? '').toLowerCase()

  const admin = createAdminClient()

  const [{ linhas, kpis }, escolasSelect, { data: usuariosAtivos }, { data: usuariosTodos }, { data: notasContatoRaw }, { data: notasContratoRaw }, { data: anexosPropostaRaw }, { data: anexosContratoRaw }] = await Promise.all([
    getFunilContratacao(),
    buscarEscolasUnificadas(),
    admin.from('usuarios').select('id, nome_completo').eq('ativo', true).order('nome_completo'),
    admin.from('usuarios').select('id, nome_completo'),
    admin.from('notas_escola').select('escola_id, texto, created_by, created_at').eq('categoria', 'contato').order('created_at', { ascending: false }),
    admin.from('notas_escola').select('escola_id, texto, created_by, created_at').eq('categoria', 'contrato').order('created_at', { ascending: false }),
    admin.from('contratos_arquivos').select('escola_id, path, created_at').eq('categoria', 'proposta').order('created_at', { ascending: false }),
    admin.from('contratos_arquivos').select('id, escola_id, nome, path, categoria, created_at').in('categoria', ['minuta', 'contrato_final', 'contrato_assinado']).order('created_at', { ascending: false }),
  ])

  // Escolas sem proposta_id (não geradas pela Calculadora) podem ter o PDF da
  // proposta enviada anexado manualmente — mesma tabela/bucket de
  // ContratoUpload.tsx, só filtrando categoria:'proposta'. Mantém só o mais
  // recente por escola.
  const anexoPropostaPorEscola = new Map<string, string>()
  for (const a of anexosPropostaRaw ?? []) {
    if (anexoPropostaPorEscola.has(a.escola_id)) continue
    const { data } = admin.storage.from('documentos-oficiais').getPublicUrl(a.path)
    anexoPropostaPorEscola.set(a.escola_id, data.publicUrl)
  }

  const nomePorUsuario = new Map((usuariosTodos ?? []).map(u => [u.id, u.nome_completo]))
  const notasPorEscola = new Map<string, { texto: string; autor: string; criadoEm: string }[]>()
  for (const n of notasContatoRaw ?? []) {
    const lista = notasPorEscola.get(n.escola_id) ?? []
    if (lista.length < 5) {
      lista.push({ texto: n.texto, autor: nomePorUsuario.get(n.created_by) ?? 'Equipe', criadoEm: n.created_at })
      notasPorEscola.set(n.escola_id, lista)
    }
  }

  const notasContratoPorEscola = new Map<string, { texto: string; autor: string; criadoEm: string }[]>()
  for (const n of notasContratoRaw ?? []) {
    const lista = notasContratoPorEscola.get(n.escola_id) ?? []
    if (lista.length < 8) {
      lista.push({ texto: n.texto, autor: nomePorUsuario.get(n.created_by) ?? 'Equipe', criadoEm: n.created_at })
      notasContratoPorEscola.set(n.escola_id, lista)
    }
  }

  // Minuta/versão final/assinado — cada upload é uma linha nova (nunca
  // sobrescreve), por isso mantém TODAS as versões por escola, não só a mais
  // recente.
  const arquivosContratoPorEscola = new Map<string, { id: string; nome: string; url: string; criadoEm: string; categoria: string }[]>()
  for (const a of anexosContratoRaw ?? []) {
    const lista = arquivosContratoPorEscola.get(a.escola_id) ?? []
    const { data } = admin.storage.from('documentos-oficiais').getPublicUrl(a.path)
    lista.push({ id: a.id, nome: a.nome, url: data.publicUrl, criadoEm: a.created_at, categoria: a.categoria })
    arquivosContratoPorEscola.set(a.escola_id, lista)
  }

  let escolaSelecionada: { id: string; nome: string; cidade: string | null; estado: string | null } | null = null
  let negociacaoAtual: { id: string; stage: string; valor_estimado: number | null; observacoes: string | null; responsavel_id: string | null } | null = null

  if (escolaId) {
    const [{ data: e }, { data: n }] = await Promise.all([
      admin.from('escolas').select('id, nome, cidade, estado').eq('id', escolaId).single(),
      admin.from('negociacoes').select('id, stage, valor_estimado, observacoes, responsavel_id').eq('escola_id', escolaId).eq('ativa', true).maybeSingle(),
    ])
    escolaSelecionada = e
    negociacaoAtual = n
  }

  const linhasFiltradas = linhas.filter(l => {
    if (faseFiltro && l.fase_funil !== faseFiltro) return false
    if (q && !l.escola_nome.toLowerCase().includes(q)) return false
    return true
  })

  const pctReceita = Math.min(100, Math.round((kpis.valorContratadoTotal / META_RECEITA) * 100))

  return (
    <div>
      <PageHeader title="Funil de Contratação" subtitle="Da negociação ao contrato assinado — visão consolidada por escola" />

      <div className="mp-page-padding-x" style={{ padding: '2rem 2.5rem' }}>

        {/* ── KPIs ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Escolas em Funil',   value: kpis.totalEscolasEmFunil, sub: 'ativas no funil', cor: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
            { label: 'Valor em Pipeline',  value: formatCurrency(kpis.valorPipelineTotal), sub: 'negociações abertas', cor: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Valor Contratado',   value: formatCurrency(kpis.valorContratadoTotal), sub: 'contratos assinados', cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'Em Implantação',     value: kpis.emImplantacao, sub: 'pós-arquivamento', cor: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
            { label: 'Meta de Receita 2027', value: `${pctReceita}%`, sub: formatCurrency(META_RECEITA), cor: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 14, padding: '1.1rem 1.25rem', borderTop: `3px solid ${k.cor}` }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.35rem' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>{k.value}</div>
              <div style={{ fontSize: '.7rem', color: '#64748b', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Funil visual + classificação de leads ─────────── */}
        <div style={card}>
          <div style={secHdr('#0f172a')}>
            <div>
              <div style={secTitle}>Funil de Vendas</div>
              <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>
                Cada etapa soma as escolas nela ou em qualquer etapa mais avançada. Cor = cruzamento Fit (porte, segmentos, perfil pedagógico) × Engajamento (reuniões, recência) — Prioritário (alto/alto) é quente, Baixa Prioridade (baixo/baixo) é frio, os quadrantes mistos ficam mornos.
              </div>
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <FunilVisual
              estagios={FASE_FUNIL_ORDEM.map((fase, idx) => {
                const faseComOuMaisAvancadas = FASE_FUNIL_ORDEM.slice(idx)
                const acumulado = faseComOuMaisAvancadas.reduce((acc, f) => ({
                  total:  acc.total  + kpis.porFase[f],
                  quente: acc.quente + kpis.porFaseTemperatura[f].quente,
                  morno:  acc.morno  + kpis.porFaseTemperatura[f].morno,
                  frio:   acc.frio   + kpis.porFaseTemperatura[f].frio,
                }), { total: 0, quente: 0, morno: 0, frio: 0 })
                return { fase, label: FASE_LABELS[fase], ...acumulado }
              })}
            />
          </div>
        </div>

        {/* ── Distribuição por fase ─────────────────────────── */}
        <div style={{ ...card }}>
          <div style={secHdr('#0f172a')}>
            <div style={secTitle}>Distribuição por Fase</div>
          </div>
          <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
            {(Object.keys(FASE_LABELS) as FaseFunil[]).map(fase => (
              <Link key={fase} href={faseFiltro === fase ? '/comercial/funil-contratacao' : `/comercial/funil-contratacao?fase=${fase}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .9rem',
                  borderRadius: 10, background: faseFiltro === fase ? '#0f172a' : '#f8fafc',
                  border: `1.5px solid ${faseFiltro === fase ? '#0f172a' : '#e2e8f0'}`,
                }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: faseFiltro === fase ? '#fff' : '#334155', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    {FASE_LABELS[fase]}
                  </span>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 800, color: faseFiltro === fase ? '#fff' : '#0f172a',
                    fontFamily: 'var(--font-cormorant,serif)',
                  }}>
                    {kpis.porFase[fase]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Seletor de escola + formulário rápido de negociação ── */}
        {/* overflow: visible (sobrescrevendo o `card` padrão) — o dropdown de
            busca do EscolaSelector é position:absolute e ficava cortado pelo
            overflow:hidden do card. */}
        <div style={{ ...card, overflow: 'visible' }}>
          <div style={{ ...secHdr(), borderRadius: '16px 16px 0 0' }}>
            <div style={secTitle}>Registrar / Atualizar Negociação</div>
          </div>
          <div style={{ padding: '1.25rem 1.75rem' }}>
            <EscolaSelector
              escolas={escolasSelect ?? []}
              escolaId={escolaId}
              basePath="/comercial/funil-contratacao"
              placeholder="— Escolha uma escola para registrar a negociação —"
              extraButton={escolaSelecionada ? (
                <>
                  <Link href={`/comercial/contratos?escola=${escolaId}`} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Editar Contrato Completo →
                  </Link>
                  <Link href={`/comercial/jornada?escola=${escolaId}`} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Ver Jornada →
                  </Link>
                </>
              ) : undefined}
            />
          </div>

          {escolaSelecionada && (
            <form action={upsertNegociacao} style={{ padding: '0 1.75rem 1.75rem' }}>
              <input type="hidden" name="id" value={negociacaoAtual?.id ?? ''} />
              <input type="hidden" name="escola_id" value={escolaId} />
              <input type="hidden" name="ativa" value="true" />

              <div style={{ ...g2, marginBottom: '1.25rem' }}>
                <div>
                  <label style={lbl}>Estágio</label>
                  <select name="stage" defaultValue={negociacaoAtual?.stage ?? 'prospeccao'} style={{ ...inp, cursor: 'pointer' }}>
                    {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Valor Total Estimado (R$/ano)</label>
                  <input name="valor_estimado" type="number" min="0" step="0.01" style={inp}
                    defaultValue={negociacaoAtual?.valor_estimado ?? ''} placeholder="Ex: 67550.00" />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Responsável</label>
                <select name="responsavel_id" defaultValue={negociacaoAtual?.responsavel_id ?? ''} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Selecione —</option>
                  {(usuariosAtivos ?? []).map((u: { id: string; nome_completo: string }) => (
                    <option key={u.id} value={u.id}>{u.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Observações da negociação</label>
                <textarea name="observacoes" rows={3} style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                  defaultValue={negociacaoAtual?.observacoes ?? ''}
                  placeholder="Histórico de negociação, condições especiais, motivo de recusa..." />
              </div>

              <button type="submit" style={{ background: 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: '#fff', padding: '.7rem 2rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 14px rgba(74,127,219,.35)' }}>
                Salvar Negociação
              </button>
            </form>
          )}
        </div>

        {/* ── Tabela principal ──────────────────────────────── */}
        <div style={card}>
          <div style={{ ...secHdr('#6366f1'), justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={secTitle}>Escolas em Processo Comercial</div>
              <div style={{ fontSize: '.66rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.25rem', maxWidth: 520 }}>
                Alunos/Cidade vêm do cadastro da escola, Reuniões e 1º Contato vêm dos Registros, Valor vem da Proposta/Negociação e Fase vem do Contrato — clique em "Editar" para atualizar a negociação, ou use os links "Contrato Completo" / "Jornada" para os demais dados.
              </div>
            </div>
            <form style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
              {faseFiltro && <input type="hidden" name="fase" value={faseFiltro} />}
              <input name="q" defaultValue={params.q ?? ''} placeholder="Buscar por escola..." style={{ ...inp, width: 220, padding: '.4rem .7rem', fontSize: '.78rem' }} />
            </form>
          </div>
          <div className="mp-escolas-table-wrap" style={{ overflowX: 'auto' }}>
            {linhasFiltradas.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Prior.', 'Escola', 'Responsável', 'Alunos', 'Atividade', 'Valor/Desconto', 'Fase', 'Contato', ''].map(col => (
                      <th key={col} style={{ padding: '.6rem .75rem', textAlign: 'left', fontSize: '.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((l, idx) => (
                    <tr key={l.escola_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '.65rem .75rem', verticalAlign: 'middle' }}>
                        <PrioridadeInline escolaId={l.escola_id} prioridade={l.prioridade_manual} />
                      </td>
                      <td style={{ padding: '.65rem .75rem', verticalAlign: 'middle', width: 150, maxWidth: 150 }}>
                        <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.3 }}>
                          {l.escola_nome}
                        </div>
                        <div style={{ fontSize: '.68rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.contato_nome ? `${l.contato_nome} · ` : ''}{l.cidade ?? '—'}{l.estado ? `/${l.estado}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '.65rem .75rem', whiteSpace: 'nowrap' }}>
                        <ResponsavelInlineSelect escolaId={l.escola_id} responsavelId={l.responsavel_id} usuarios={usuariosAtivos ?? []} />
                      </td>
                      <td style={{ padding: '.65rem .75rem', fontSize: '.8rem', color: '#0f172a', fontWeight: 700, textAlign: 'center' }}>{l.alunos_cadastro || '—'}</td>
                      <td style={{ padding: '.65rem .75rem', fontSize: '.72rem', color: '#334155', maxWidth: 160 }}
                        title={l.primeiro_contato_resumo ?? ''}>
                        {l.primeiro_contato ? (
                          <>
                            <div>{l.reunioes_total} reunião{l.reunioes_total > 1 ? 'ões' : ''}{l.ultima_interacao ? ` · últ. ${formatDate(l.ultima_interacao)}` : ''}</div>
                            <div style={{ fontSize: '.65rem', color: '#94a3b8' }}>1º contato: {formatDate(l.primeiro_contato)}</div>
                          </>
                        ) : (
                          <Link href={`/comercial/registros/novo?escola=${l.escola_id}`} style={{ fontSize: '.68rem', fontWeight: 700, color: '#b45309', textDecoration: 'none' }}>
                            + registrar
                          </Link>
                        )}
                      </td>
                      <td style={{ padding: '.65rem .75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '.85rem', fontWeight: 700, color: '#0f172a' }}>
                          {l.proposta_valor_aluno_ano
                            ? `${formatCurrency(l.proposta_valor_aluno_ano)}/aluno`
                            : l.negociacao_valor_estimado
                              ? formatCurrency(l.negociacao_valor_estimado)
                              : l.contrato_valor_total > 0 ? formatCurrency(l.contrato_valor_total) : '—'}
                        </div>
                        {l.proposta_desconto_pct != null && l.proposta_desconto_pct > 0 && (
                          <div style={{ fontSize: '.63rem', color: '#b45309' }}>{l.proposta_desconto_pct}% desconto</div>
                        )}
                      </td>
                      <td style={{ padding: '.65rem .75rem', verticalAlign: 'middle' }}>
                        <FasePopover
                          escolaId={l.escola_id}
                          faseLabel={l.declinou ? 'Recusada' : FASE_LABELS[l.fase_funil]}
                          faseCor={l.declinou ? FASE_DECLINADA : FASE_COR[l.fase_funil]}
                          checklist={{
                            formulario_enviado: l.formulario_enviado,
                            formulario_recebido: l.formulario_recebido,
                            proposta_enviada: l.proposta_enviada_manual,
                            minuta_enviada: l.minuta_enviada,
                            retorno_minuta: l.retorno_minuta,
                            minuta_atualizada: l.minuta_atualizada,
                            contrato_enviado: l.contrato_enviado,
                            contrato_assinado: l.contrato_assinado,
                            contrato_arquivado: l.contrato_arquivado,
                            declinou: l.declinou,
                          }}
                          implantacaoStatus={l.implantacao_status}
                        />
                      </td>
                      <td style={{ padding: '.65rem .75rem', verticalAlign: 'middle', maxWidth: 170 }}>
                        <ContatoQuickEdit escolaId={l.escola_id} telefone={l.telefone} email={l.email} escolaNome={l.escola_nome} />
                      </td>
                      <td style={{ padding: '.65rem .75rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <ContratoDocumentosPanel
                            escolaId={l.escola_id}
                            escolaNome={l.escola_nome}
                            arquivos={arquivosContratoPorEscola.get(l.escola_id) ?? []}
                            notas={notasContratoPorEscola.get(l.escola_id) ?? []}
                          />
                          <AnotacaoContatoInline escolaId={l.escola_id} notas={notasPorEscola.get(l.escola_id) ?? []} />
                          {l.proposta_id ? (
                            <a href={`/api/propostas/pdf/${l.proposta_id}`} style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                              background: '#f0fdf4', color: '#16a34a',
                            }} title="Baixar proposta em PDF">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          ) : anexoPropostaPorEscola.has(l.escola_id) ? (
                            <a href={anexoPropostaPorEscola.get(l.escola_id)} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                              background: '#f0fdf4', color: '#16a34a',
                            }} title="Baixar PDF da proposta (anexado manualmente)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          ) : (
                            <AnexarPropostaPdf escolaId={l.escola_id} escolaNome={l.escola_nome} />
                          )}
                          <Link href={`/comercial/escolas/${l.escola_id}`} style={{ fontSize: '.72rem', fontWeight: 700, color: '#4A7FDB', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            Editar →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                <div style={{ fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Nenhuma escola em processo comercial ainda. Registre uma negociação acima para começar.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
