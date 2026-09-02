import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { getDashboardData } from '@/lib/dashboard'
import { FASE_FUNIL_ORDEM, FASE_LABELS, type FaseFunil } from '@/lib/funil-contratacao'
import { META_REUNIOES, META_PROPOSTAS, META_MINUTAS } from '@/lib/metas'
import { KpiCard, MiniBarChart } from '@/components/comercial/DashboardCharts'
import { FunilVisual } from '@/components/comercial/FunilVisual'
import { BrasilMapa } from '@/components/comercial/BrasilMapa'
import { MatrizFitEngajamento } from '@/components/comercial/MatrizFitEngajamento'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ estado?: string; cidade?: string; bairro?: string; fase?: string; periodo?: string }>
}

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)',
}
const cardHead: React.CSSProperties = {
  padding: '.85rem 1.4rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', flexWrap: 'wrap',
}
const cardTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.74rem', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a',
}
const cardSub: React.CSSProperties = {
  fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem',
}
const pill = (ativo: boolean): React.CSSProperties => ({
  padding: '.35rem .8rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700,
  textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)',
  background: ativo ? 'linear-gradient(135deg, #4A7FDB, #5FE3D0)' : '#F1F5F9',
  color: ativo ? '#fff' : '#475569',
  border: ativo ? 'none' : '1px solid #E2E8F0',
})

export default async function ComercialDashboard({ searchParams }: Props) {
  const params = await searchParams
  const estadoAtivo = params.estado ?? ''
  const cidadeAtiva = params.cidade ?? ''
  const bairroAtivo = params.bairro ?? ''
  const faseAtiva = (params.fase ?? '') as FaseFunil | ''
  const periodoAtivo = params.periodo === '30d' ? '30d' as const : undefined

  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({
      estado: estadoAtivo, cidade: cidadeAtiva, bairro: bairroAtivo, fase: faseAtiva, periodo: periodoAtivo ?? '',
      ...overrides,
    })
    for (const k of [...p.keys()]) if (!p.get(k)) p.delete(k)
    return `/comercial?${p.toString()}`
  }

  // registros e escolas têm policy de SELECT restrita por responsável/role no
  // client comum (confirmado comparando este mesmo dashboard logado como
  // gerente vs. usuario) — usa admin, este painel é o mesmo pra todo mundo.
  const admin = createAdminClient()
  const dados = await getDashboardData({ estado: estadoAtivo || undefined, cidade: cidadeAtiva || undefined, bairro: bairroAtivo || undefined, fase: faseAtiva || undefined, periodo: periodoAtivo })

  const [{ data: registrosRecentes }, { data: todasEscolas }, { data: escolasComRegistro }] = await Promise.all([
    admin.from('registros').select('*, escola:escolas(nome,id,cidade,estado)').order('data_contato', { ascending: false }).limit(6),
    admin.from('escolas').select('id, nome, cidade, estado, created_at').eq('ativa', true).order('created_at', { ascending: false }),
    admin.from('registros').select('escola_id'),
  ])
  const idsComRegistro = new Set((escolasComRegistro ?? []).map((r: any) => r.escola_id))
  const escolasSemNegociacao = (todasEscolas ?? []).filter((e: any) => !idsComRegistro.has(e.id)).slice(0, 8)

  const MEIO_LABEL: Record<string, string> = { presencial: 'Presencial', whatsapp: 'WhatsApp', email: 'E-mail', telefone: 'Telefone', videoconf: 'Videoconf', outro: 'Outro' }
  const CLASSIF_DOT: Record<string, string> = { quente: '#dc2626', morno: '#4A7FDB', frio: '#60a5fa' }

  return (
    <div>
      <PageHeader
        title="Dashboard Comercial"
        subtitle={`Ao vivo · atualizado a cada acesso · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
        actions={
          <Link href="/comercial/registros/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem 1rem', borderRadius: 9999, background: '#4A7FDB', color: '#fff', textDecoration: 'none', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 12px rgba(74,127,219,.3)' }}>
            <Plus size={13} /> Novo Registro
          </Link>
        }
      />

      <div className="mp-page-padding-x" style={{ padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Filtros ────────────────────────────────────────────── */}
        <div style={{ ...card, padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Estado:</span>
            <Link href={buildHref({ estado: '', cidade: '', bairro: '' })} style={pill(!estadoAtivo)}>Todos</Link>
            {dados.filtrosDisponiveis.estados.slice(0, 12).map(e => (
              <Link key={e.uf} href={buildHref({ estado: estadoAtivo === e.uf ? '' : e.uf, cidade: '', bairro: '' })} style={pill(estadoAtivo === e.uf)}>{e.uf} ({e.count})</Link>
            ))}
            <span style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 .3rem' }} />
            <span style={{ fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Período:</span>
            <Link href={buildHref({ periodo: '' })} style={pill(!periodoAtivo)}>Tudo</Link>
            <Link href={buildHref({ periodo: '30d' })} style={pill(periodoAtivo === '30d')}>Últimos 30 dias</Link>
          </div>

          {estadoAtivo && dados.filtrosDisponiveis.cidades.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.66rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Cidade ({estadoAtivo}):</span>
              <Link href={buildHref({ cidade: '', bairro: '' })} style={pill(!cidadeAtiva)}>Todas</Link>
              {dados.filtrosDisponiveis.cidades.slice(0, 15).map(c => (
                <Link key={c.key} href={buildHref({ cidade: cidadeAtiva.toLowerCase() === c.label.toLowerCase() ? '' : c.label, bairro: '' })} style={pill(cidadeAtiva.toLowerCase() === c.label.toLowerCase())}>{c.label} ({c.count})</Link>
              ))}
            </div>
          )}

          {cidadeAtiva && dados.filtrosDisponiveis.bairros.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.66rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Bairro ({cidadeAtiva}):</span>
              <Link href={buildHref({ bairro: '' })} style={pill(!bairroAtivo)}>Todos</Link>
              {dados.filtrosDisponiveis.bairros.slice(0, 15).map(b => (
                <Link key={b.key} href={buildHref({ bairro: bairroAtivo.toLowerCase() === b.label.toLowerCase() ? '' : b.label })} style={pill(bairroAtivo.toLowerCase() === b.label.toLowerCase())}>{b.label} ({b.count})</Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.66rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Fase do funil:</span>
            <Link href={buildHref({ fase: '' })} style={pill(!faseAtiva)}>Todas</Link>
            {FASE_FUNIL_ORDEM.map(f => (
              <Link key={f} href={buildHref({ fase: faseAtiva === f ? '' : f })} style={pill(faseAtiva === f)}>{FASE_LABELS[f]}</Link>
            ))}
          </div>
        </div>

        {/* ── Hero KPIs ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          <KpiCard label="Reuniões com Escolas Únicas" valor={dados.kpis.reunioesUnicas} meta={!periodoAtivo && !faseAtiva && !estadoAtivo ? META_REUNIOES : undefined} cor="#2563eb" bg="#eff6ff" border="#bfdbfe" sub={periodoAtivo === '30d' ? 'últimos 30 dias' : 'histórico'} href="/comercial/registros"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
          <KpiCard label="Propostas Enviadas" valor={dados.kpis.propostasEnviadas} meta={!estadoAtivo && !faseAtiva ? META_PROPOSTAS : undefined} cor="#b45309" bg="#fffbeb" border="#fcd34d" sub={`${dados.kpis.alunosPipeline.toLocaleString('pt-BR')} alunos no pipeline`} href="/comercial/propostas"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
          <KpiCard label="Minutas Enviadas" valor={dados.kpis.minutasEnviadas} meta={!estadoAtivo && !faseAtiva ? META_MINUTAS : undefined} cor="#7c3aed" bg="#f5f3ff" border="#c4b5fd" sub={`${dados.kpis.contratosAssinados} contratos assinados`} href="/comercial/contratos"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>} />
          <KpiCard label="Ticket Médio (Pipeline)" valor={dados.kpis.ticketMedioPipeline ? dados.kpis.ticketMedioPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'} cor="#0d9488" bg="#f0fdfa" border="#99f6e4" sub="valor/aluno/ano nas propostas"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
          <KpiCard label="Pipeline Potencial" valor={dados.kpis.pipelineValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} cor="#c2410c" bg="#fff7ed" border="#fed7aa" sub="propostas + contratos, valor anual"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>} />
          <KpiCard label="Taxa de Conversão" valor={`${dados.kpis.taxaConversaoContrato}%`} cor="#16a34a" bg="#f0fdf4" border="#86efac" sub="propostas → contrato assinado"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
        </div>

        {/* ── Funil completo ─────────────────────────────────────── */}
        <div style={card}>
          <div style={cardHead}>
            <div>
              <div style={cardTitle}>Funil de Conversão Completo</div>
              <div style={cardSub}>Cada etapa soma as escolas nela ou em qualquer etapa mais avançada · cor = temperatura do lead</div>
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <FunilVisual estagios={dados.funilEstagios} />
          </div>
        </div>

        {/* ── Geografia ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '1.5rem' }}>
          <div style={card}>
            <div style={cardHead}><div style={cardTitle}>Distribuição no Mapa</div></div>
            <div style={{ padding: '1.25rem' }}>
              <BrasilMapa porEstado={dados.porEstadoMapa} width={340} height={340} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={card}>
              <div style={cardHead}><div style={cardTitle}>Por Região</div></div>
              <TabelaSimples linhas={dados.regional.map(r => [r.regiao, String(r.qtd), r.alunos.toLocaleString('pt-BR'), r.ticket ? r.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'])} cabecalho={['Região', 'Prop.', 'Alunos', 'Ticket/aluno/ano']} />
            </div>
            <div style={card}>
              <div style={cardHead}><div style={cardTitle}>Por Estado</div></div>
              <TabelaSimples linhas={dados.porEstado.slice(0, 8).map(r => [r.uf, String(r.qtd), r.alunos.toLocaleString('pt-BR'), r.ticket ? r.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'])} cabecalho={['UF', 'Prop.', 'Alunos', 'Ticket/aluno/ano']} />
            </div>
          </div>
        </div>

        {/* ── Ranking ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={card}>
            <div style={cardHead}><div style={cardTitle}>Ranking por Porte</div><div style={cardSub}>top 10 · nº de alunos</div></div>
            <RankingLista itens={dados.rankingPorte.map(r => ({ nome: r.escola_nome, valor: `${r.alunos.toLocaleString('pt-BR')} alunos`, sub: r.estado }))} />
          </div>
          <div style={card}>
            <div style={cardHead}><div style={cardTitle}>Ranking por Valor Potencial</div><div style={cardSub}>top 10 · pipeline ou contrato</div></div>
            <RankingLista itens={dados.rankingValor.map(r => ({ nome: r.escola_nome, valor: r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), sub: r.estado }))} />
          </div>
        </div>

        {/* ── Distribuições ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <MiniBarChart title="Perfil Pedagógico" data={dados.perfilPedagogico.map(p => ({ label: p.label, count: p.count }))} colorHex="#7c3aed" labelWidth={100} />
          <MiniBarChart title="Segmentos Atendidos" data={dados.segmentos.map(s => ({ label: s.label, count: s.count }))} colorHex="#b45309" labelWidth={70} />
          <MiniBarChart title="Origem do Lead" data={dados.origemLead.map(o => ({ label: o.label, count: o.count }))} colorHex="#2563eb" labelWidth={100} />
          <MiniBarChart title="Canal de Contato" data={dados.meioContato.map(m => ({ label: m.label, count: m.count }))} colorHex="#0d9488" labelWidth={80} />
        </div>

        {/* ── Formulários × Conversão ────────────────────────────── */}
        <div style={card}>
          <div style={cardHead}>
            <div>
              <div style={cardTitle}>Formulários Recebidos × Conversão em Proposta</div>
              <div style={cardSub}>Cruza form_precadastro_wemake (exclui descartados) com propostas geradas</div>
            </div>
            <Link href="/comercial/pre-cadastros" style={{ fontSize: '.72rem', color: '#4A7FDB', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Ver todos →</Link>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.85rem', borderBottom: dados.formularios.pendentes.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
            <MiniStat label="Formulários Recebidos" valor={dados.formularios.total} cor="#0f172a" />
            <MiniStat label="Convertidos em Proposta" valor={dados.formularios.convertidos} cor="#16a34a" sub={dados.formularios.total ? `${Math.round((dados.formularios.convertidos / dados.formularios.total) * 100)}% do total` : undefined} />
            <MiniStat label="Sem Proposta Correspondente" valor={dados.formularios.pendentes.length} cor="#dc2626" />
          </div>
          {dados.formularios.pendentes.length > 0 && (
            <TabelaSimples
              linhas={dados.formularios.pendentes.slice(0, 12).map(f => [f.nome, `${f.cidade ?? ''}${f.cidade && f.estado ? '/' : ''}${f.estado ?? ''}`, formatDate(f.dataFormulario.slice(0, 10)), f.dias != null ? `${f.dias} dias` : '—'])}
              cabecalho={['Escola', 'Cidade/UF', 'Recebido em', 'Em espera']}
            />
          )}
        </div>

        {/* ── Urgência ───────────────────────────────────────────── */}
        {dados.urgencia.length > 0 && (
          <div style={card}>
            <div style={cardHead}>
              <div>
                <div style={cardTitle}>Urgência: Validade de Propostas</div>
                <div style={cardSub}>vencidas ou vencendo em até 15 dias</div>
              </div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '.15rem .6rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{dados.urgencia.length}</span>
            </div>
            <TabelaSimples
              linhas={dados.urgencia.map(u => [u.escola_nome, u.estado ?? 'N/I', u.diasValidade < 0 ? `venceu há ${Math.abs(u.diasValidade)} dias` : `vence em ${u.diasValidade} dias`])}
              cabecalho={['Escola', 'UF', 'Situação de prazo']}
            />
          </div>
        )}

        {/* ── Paradas + Matriz ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={card}>
            <div style={cardHead}>
              <div>
                <div style={cardTitle}>Propostas Paradas</div>
                <div style={cardSub}>enviadas, sem avanço nem contato há mais de 15 dias</div>
              </div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', padding: '.15rem .6rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{dados.propostasParadas.length}</span>
            </div>
            {dados.propostasParadas.length > 0 ? (
              <TabelaSimples linhas={dados.propostasParadas.slice(0, 10).map(p => [p.escola_nome, p.estado ?? 'N/I', p.dias != null ? `${p.dias} dias sem contato` : 'sem contato registrado'])} cabecalho={['Escola', 'UF', 'Última atividade']} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.8rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Nenhuma proposta parada no recorte atual</div>
            )}
          </div>
          <div style={card}>
            <div style={cardHead}>
              <div>
                <div style={cardTitle}>Matriz Fit × Engajamento</div>
                <div style={cardSub}>qualificação de conta — encaixe de perfil vs. engajamento atual</div>
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <MatrizFitEngajamento linhas={dados.matrizQuadrante} />
            </div>
          </div>
        </div>

        {/* ── Atividade recente ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={card}>
            <div style={cardHead}>
              <div style={cardTitle}>Últimas Interações</div>
              <Link href="/comercial/registros" style={{ fontSize: '.72rem', color: '#4A7FDB', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Ver todas →</Link>
            </div>
            {registrosRecentes && registrosRecentes.length > 0 ? (
              <div style={{ padding: '.75rem' }}>
                {registrosRecentes.map((r: any, idx: number) => (
                  <Link key={r.id} href={`/comercial/escolas/${r.escola_id}`} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.6rem .85rem', borderRadius: 10, textDecoration: 'none', marginBottom: idx < registrosRecentes.length - 1 ? '.25rem' : 0, background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CLASSIF_DOT[r.classificacao] ?? '#94a3b8', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{r.escola?.nome ?? '—'}</div>
                      <div style={{ fontSize: '.66rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{formatDate(r.data_contato)} · {MEIO_LABEL[r.meio_contato] ?? r.meio_contato}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>Sem registros ainda</div>}
          </div>

          <div style={card}>
            <div style={cardHead}>
              <div style={cardTitle}>Escolas Aguardando Início de Negociação</div>
              <span style={{ fontSize: '.65rem', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', padding: '.1rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{escolasSemNegociacao.length}</span>
            </div>
            {escolasSemNegociacao.length > 0 ? (
              <div style={{ padding: '.75rem' }}>
                {escolasSemNegociacao.map((e: any, idx: number) => (
                  <Link key={e.id} href={`/comercial/registros/novo?escola=${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.6rem .85rem', borderRadius: 10, textDecoration: 'none', marginBottom: idx < escolasSemNegociacao.length - 1 ? '.25rem' : 0, background: idx % 2 === 0 ? '#faf5ff' : '#fff' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.7rem', fontWeight: 700, flexShrink: 0 }}>{e.nome[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.nome}</div>
                      <div style={{ fontSize: '.66rem', color: '#7c3aed', fontFamily: 'var(--font-inter,sans-serif)' }}>{e.cidade}{e.estado ? `, ${e.estado}` : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>Todas as escolas já têm negociação iniciada</div>}
          </div>
        </div>

        {/* ── Acesso rápido ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {[
            { label: 'Nova Escola', href: '/comercial/escolas/nova', cor: '#4A7FDB', desc: 'Cadastrar parceiro' },
            { label: 'Novo Registro', href: '/comercial/registros/novo', cor: '#0d9488', desc: 'Registrar interação' },
            { label: 'Ver Pipeline', href: '/comercial/pipeline', cor: '#7c3aed', desc: 'Kanban de negociações' },
            { label: 'Metas do Sprint', href: '/comercial/metas', cor: '#b45309', desc: 'Acompanhamento até 31/08' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'block', background: '#fff', border: '1px solid #e2e8f0', borderLeft: `4px solid ${item.cor}`, borderRadius: 12, padding: '.85rem 1.1rem', textDecoration: 'none', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.15rem' }}>{item.label}</div>
              <div style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{item.desc}</div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Helpers de apresentação locais ───────────────────────────────────────────

function TabelaSimples({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  if (linhas.length === 0) return <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '.8rem' }}>Sem dados no recorte atual</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr>
            {cabecalho.map((c, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '.5rem 1rem', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', borderBottom: '1px solid #f1f5f9' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fafafa' : '#fff' }}>
              {linha.map((v, ci) => (
                <td key={ci} style={{ padding: '.5rem 1rem', textAlign: ci === 0 ? 'left' : 'right', color: ci === 0 ? '#0f172a' : '#475569', fontWeight: ci === 0 ? 600 : 500, fontFamily: 'var(--font-inter,sans-serif)' }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankingLista({ itens }: { itens: { nome: string; valor: string; sub: string | null }[] }) {
  if (itens.length === 0) return <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '.8rem' }}>Sem dados no recorte atual</div>
  return (
    <div style={{ padding: '.75rem 1rem' }}>
      {itens.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem 0', borderBottom: i < itens.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 800, color: '#64748b', flexShrink: 0, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>{it.nome}</div>
            {it.sub && <div style={{ fontSize: '.64rem', color: '#94a3b8' }}>{it.sub}</div>}
          </div>
          <div style={{ fontSize: '.76rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>{it.valor}</div>
        </div>
      ))}
    </div>
  )
}

function MiniStat({ label, valor, cor, sub }: { label: string; valor: number; cor: string; sub?: string }) {
  return (
    <div style={{ padding: '.75rem .9rem', background: '#f8fafc', border: `1px solid ${cor}20`, borderTop: `3px solid ${cor}`, borderRadius: 10 }}>
      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{valor.toLocaleString('pt-BR')}</div>
      {sub && <div style={{ fontSize: '.64rem', color: '#94a3b8', marginTop: '.2rem' }}>{sub}</div>}
    </div>
  )
}
