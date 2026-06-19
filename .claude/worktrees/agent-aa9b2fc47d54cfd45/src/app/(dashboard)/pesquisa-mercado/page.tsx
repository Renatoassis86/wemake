import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Props { searchParams: Promise<{ ano?: string; tipo?: string; uf?: string }> }

// ── Tabela de leads reutilizável ─────────────────────────────
function TabelaLeads({ leads }: { leads: any[] }) {
  const TIPO_COR: Record<string, { bg: string; cor: string; border: string }> = {
    gestor:      { bg: '#fef2f2', cor: '#dc2626', border: '#fca5a5' },
    mantenedor:  { bg: '#fffbeb', cor: '#4A7FDB', border: '#fde68a' },
    diretor:     { bg: '#eff6ff', cor: '#2563eb', border: '#bfdbfe' },
    coordenador: { bg: '#f5f3ff', cor: '#7c3aed', border: '#ddd6fe' },
  }

  function getTipoCor(tipo: string | null) {
    if (!tipo) return { bg: '#f8fafc', cor: '#64748b', border: '#e2e8f0' }
    const t = tipo.toLowerCase()
    for (const [k, v] of Object.entries(TIPO_COR)) {
      if (t.includes(k)) return v
    }
    return { bg: '#f8fafc', cor: '#64748b', border: '#e2e8f0' }
  }

  // Agrupar por UF para facilitar prospeccao regional
  const porUF = leads.reduce((acc: Record<string, any[]>, l) => {
    const uf = l.uf ?? 'Sem UF'
    if (!acc[uf]) acc[uf] = []
    acc[uf].push(l)
    return acc
  }, {})
  const ufsOrdenadas = Object.entries(porUF).sort((a, b) => b[1].length - a[1].length)

  return (
    <div>
      {/* Resumo por UF */}
      <div style={{ padding: '.75rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-montserrat,sans-serif)', marginRight: '.25rem' }}>Por Estado:</span>
        {ufsOrdenadas.slice(0, 12).map(([uf, items]) => (
          <span key={uf} style={{ fontSize: '.65rem', fontWeight: 700, background: '#fff', border: '1px solid #e2e8f0', color: '#475569', padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            {uf} <span style={{ color: '#4A7FDB' }}>{items.length}</span>
          </span>
        ))}
        {ufsOrdenadas.length > 12 && <span style={{ fontSize: '.62rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>+{ufsOrdenadas.length - 12} estados</span>}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Nome', 'Cargo', 'Escola Declarada', 'E-mail', 'Telefone', 'Cidade/UF'].map(c => (
                <th key={c} style={{ padding: '.5rem .85rem', textAlign: 'left', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 200).map((l, i) => {
              const tc = getTipoCor(l.tipo_inscricao)
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '.6rem .85rem', fontWeight: 600, fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.nome ?? '—'}
                  </td>
                  <td style={{ padding: '.6rem .85rem' }}>
                    <span style={{ fontSize: '.62rem', fontWeight: 700, background: tc.bg, color: tc.cor, border: `1px solid ${tc.border}`, padding: '.15rem .45rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                      {l.tipo_inscricao ? String(l.tipo_inscricao).slice(0, 25) : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '.6rem .85rem', fontSize: '.72rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: l.instituicao ? 'normal' : 'italic' }}>
                    {l.instituicao ?? <span style={{ color: '#cbd5e1' }}>não informado</span>}
                  </td>
                  <td style={{ padding: '.6rem .85rem', fontSize: '.72rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {l.email
                      ? <a href={`mailto:${l.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{l.email}</a>
                      : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '.6rem .85rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>
                    {l.telefone ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '.6rem .85rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>
                    {l.cidade}{l.uf ? `/${l.uf}` : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {leads.length > 200 && (
          <div style={{ padding: '.85rem', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f1f5f9', fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
            Mostrando 200 de {leads.length} registros.
          </div>
        )}
      </div>
    </div>
  )
}

function count(arr: any[], campo: string) {
  const m: Record<string, number> = {}
  arr.forEach(r => {
    const v = r[campo]
    if (v) m[String(v)] = (m[String(v)] ?? 0) + 1
  })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

export default async function PesquisaMercadoPage({ searchParams }: Props) {
  const params    = await searchParams
  const anoFiltro = params.ano  ?? 'todos'
  const tipoFiltro = params.tipo ?? 'todos'
  const ufFiltro  = params.uf   ?? 'todos'

  const supabase = await createClient()

  // Verificar se há dados no leads_universal (tabela principal de importação)
  const { count: totalLeadsUniversal } = await supabase
    .from('leads_universal')
    .select('*', { count: 'exact', head: true })
    .in('fonte', ['ciecc_2025', 'ciecc_2026'])

  // Tabela legada ciecc_inscritos — verificar se existe
  const { error: erroTabela } = await supabase
    .from('ciecc_inscritos').select('id').limit(1)

  // Usar leads_universal se tiver dados lá (nova importação), senão tentar ciecc_inscritos
  const usarLeadsUniversal = (totalLeadsUniversal ?? 0) > 0
  const tabelaOk = usarLeadsUniversal || (!erroTabela || erroTabela?.code !== 'PGRST205')

  if (!tabelaOk) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <PageHeader title="Pesquisa de Mercado CIECC" subtitle="Dados dos congressos 2025 e 2026" />
        <div style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '3rem 2.5rem', maxWidth: 560, margin: '0 auto', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#fffbeb', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>Dados não importados ainda</h3>
            <p style={{ fontSize: '.875rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
              Execute o SQL e importe as planilhas do CIECC 2025 e 2026 para visualizar a pesquisa de mercado.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://supabase.com/dashboard/project/lyisdsnocroocxfblvqf/sql/new" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#4A7FDB', color: '#fff', padding: '.6rem 1.5rem', borderRadius: 9999, textDecoration: 'none', fontWeight: 700, fontSize: '.82rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                1. Criar tabelas (SQL)
              </a>
              <Link href="/importacao" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', padding: '.6rem 1.5rem', borderRadius: 9999, textDecoration: 'none', fontWeight: 600, fontSize: '.82rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                2. Importar Planilhas
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tabela de dados: usa leads_universal se houver dados importados lá
  const TABELA = usarLeadsUniversal ? 'leads_universal' : 'ciecc_inscritos'
  const CAMPO_ESCOLA     = usarLeadsUniversal ? 'escola_nome'       : 'nome_escola'
  const CAMPO_INTERESSE  = usarLeadsUniversal ? 'dados_extras'      : 'interesse_solucao_WeMake'
  const CAMPO_NPS        = usarLeadsUniversal ? 'dados_extras'      : 'nps'

  // Buscar dados com filtros
  let query = supabase.from(TABELA).select('*') as any
  if (anoFiltro !== 'todos')  query = query.eq('fonte', anoFiltro === '2025' ? 'ciecc_2025' : 'ciecc_2026')
  else query = query.in('fonte', ['ciecc_2025', 'ciecc_2026'])
  if (tipoFiltro !== 'todos') query = query.eq('tipo_inscricao', tipoFiltro)
  if (ufFiltro !== 'todos')   query = query.eq('uf', ufFiltro)

  const { data: inscritos } = await query
  const todos = (inscritos ?? []).map((r: any) => ({
    ...r,
    // Normaliza campos para interface unificada
    nome_escola:         r.nome_escola         ?? r.escola_nome,
    nps:                 r.nps                 ?? r.dados_extras?.['NPS Sistema Atual (0-10)'],
    csi:                 r.csi                 ?? r.dados_extras?.['Satisfação Sistema Atual (CSI)'],
    interesse_solucao_WeMake: r.interesse_solucao_WeMake ?? r.dados_extras?.['Interesse Solução We Make'],
    confessionalidade:   r.confessionalidade   ?? r.dados_extras?.['Qual é a situação atual da sua escola em relação à confessionalidade cristã?'],
    prazo_decisao:       r.prazo_decisao       ?? r.dados_extras?.['Prazo de Decisão'],
    investimento_atual:  r.investimento_atual  ?? r.dados_extras?.['Investimento Atual (R$/aluno/ano)'],
    qtd_alunos_total:    r.qtd_alunos_total    ?? r.qtd_alunos,
  }))

  // Dados das escolas por ano (para as tabelas de escolas)
  const buildEscolaQuery = (fonte: string) =>
    supabase.from(TABELA)
      .select('escola_nome, nome_escola, cidade, uf, tipo_inscricao, dados_extras, nps, csi, interesse_solucao_WeMake, prazo_decisao, confessionalidade, qtd_alunos_total, qtd_alunos, investimento_atual, disponibilidade_invest')
      .eq('fonte', fonte)
      .not(CAMPO_ESCOLA, 'is', null) as any

  const { data: _escolas2025 } = await buildEscolaQuery('ciecc_2025')
  const { data: _escolas2026 } = await buildEscolaQuery('ciecc_2026')

  // Normalizar escolas
  const normalizar = (arr: any[]) => (arr ?? []).map((r: any) => ({
    ...r,
    nome_escola: r.nome_escola ?? r.escola_nome,
    nps: r.nps ?? r.dados_extras?.['NPS Sistema Atual (0-10)'],
    interesse_solucao_WeMake: r.interesse_solucao_WeMake ?? r.dados_extras?.['Interesse Solução We Make'],
    confessionalidade: r.confessionalidade ?? r.dados_extras?.['Qual é a situação atual da sua escola em relação à confessionalidade cristã?'],
    qtd_alunos_total: r.qtd_alunos_total ?? r.qtd_alunos,
  }))
  const escolas2025 = normalizar(_escolas2025)
  const escolas2026 = normalizar(_escolas2026)

  // Tipos relevantes para prospecção (decisores / gestão escolar)
  // Filtramos apenas quem tem poder de decisão na escola
  const TIPOS_DECISORES = [
    'gestor', 'gestora', 'mantenedor', 'mantenedora',
    'diretor', 'diretora', 'coordenador', 'coordenadora',
    'Gestor', 'Gestora', 'Mantenedor', 'Mantenedora',
    'Diretor', 'Diretora', 'Coordenador', 'Coordenadora',
  ]

  // Regex para detectar qualquer variação dessas palavras no tipo_inscricao
  const isDecisores = (tipo: string | null) => {
    if (!tipo) return false
    const t = tipo.toLowerCase()
    return t.includes('gestor') || t.includes('mantenedor') ||
           t.includes('diretor') || t.includes('coordenador')
  }

  // Leads sem escola APENAS dos tipos decisores
  // 2025: considera que já temos todas as escolas mapeadas — mostra só como referência histórica
  // 2026: ainda há escolas não identificadas — esses são prospects ativos
  const { data: leadsDecisores2026 } = await supabase
    .from('ciecc_leads_sem_escola')
    .select('id, nome, tipo_inscricao, instituicao, email, telefone, cidade, uf, fonte')
    .eq('fonte', 'ciecc_2026')
    .order('uf')
    .limit(1000)

  const { data: leadsDecisores2025 } = await supabase
    .from('ciecc_leads_sem_escola')
    .select('id, nome, tipo_inscricao, instituicao, email, telefone, cidade, uf, fonte')
    .eq('fonte', 'ciecc_2025')
    .order('uf')
    .limit(1000)

  // Filtrar apenas decisores
  const leads2026Decisores = (leadsDecisores2026 ?? []).filter(l => isDecisores(l.tipo_inscricao))
  const leads2025Decisores = (leadsDecisores2025 ?? []).filter(l => isDecisores(l.tipo_inscricao))

  // Estatísticas gerais — usa leads_universal ou ciecc_inscritos
  const countFonte = async (fonte: string) =>
    ((await (supabase.from(TABELA) as any).select('id', { count: 'exact', head: true }).eq('fonte', fonte)).count ?? 0)

  const countEscolas = async (fonte: string) => {
    const colEscola = usarLeadsUniversal ? 'escola_nome' : 'nome_escola'
    return ((await (supabase.from(TABELA) as any).select(colEscola, { count: 'exact', head: true }).eq('fonte', fonte).not(colEscola, 'is', null)).count ?? 0)
  }

  const [total2025, total2026, totalEscolas2025, totalEscolas2026] = await Promise.all([
    countFonte('ciecc_2025'),
    countFonte('ciecc_2026'),
    countEscolas('ciecc_2025'),
    countEscolas('ciecc_2026'),
  ])

  const totalLeads2026 = leads2026Decisores.length
  const totalLeads2025 = leads2025Decisores.length

  // Tipos únicos para filtro
  const { data: tipos } = await (supabase.from(TABELA) as any).select('tipo_inscricao').not('tipo_inscricao', 'is', null).limit(500)
  const tiposUnicos = [...new Set(tipos?.map((t: any) => t.tipo_inscricao).filter(Boolean) ?? [])] as string[]

  const { data: ufs } = await (supabase.from(TABELA) as any).select('uf').not('uf', 'is', null).limit(500)
  const ufsUnicas = ([...new Set(ufs?.map((u: any) => u.uf).filter(Boolean) ?? [])] as string[]).sort()

  // Análises dos dados filtrados
  const porTipo         = count(todos, 'tipo_inscricao')
  const porUF           = count(todos, 'uf')
  const porConfessional = count(todos, 'confessionalidade')
  const porInteresse    = count(todos, 'interesse_solucao_WeMake')
  const porPrazo        = count(todos, 'prazo_decisao')
  const porInvestimento = count(todos, 'investimento_atual')

  const comEscola   = todos.filter((r: any) => r.nome_escola)
  const npsValidos  = todos.filter((r: any) => r.nps != null && r.nps >= 0)
  const npsMedia    = npsValidos.length > 0 ? (npsValidos.reduce((a: number, r: any) => a + (r.nps ?? 0), 0) / npsValidos.length).toFixed(1) : '—'
  const csiValidos  = todos.filter((r: any) => r.csi != null)
  const csiMedia    = csiValidos.length > 0 ? (csiValidos.reduce((a: number, r: any) => a + (Number(r.csi) ?? 0), 0) / csiValidos.length).toFixed(1) : '—'

  // ── KPIs do banco de leads (novo banco relacional) ─────────
  const tabelaLeadsOk = !(await supabase.from('leads_pessoa').select('id').limit(1)).error

  let kpiLeads = {
    totalPessoas: 0, totalEscolas: 0, totalContatos: 0,
    totalOikos: 0, decisores: 0, comEmail: 0,
    por2025: 0, por2026: 0,
    porUFTop: [] as { uf: string; n: number }[],
    porTipoTop: [] as { tipo: string; n: number }[],
    interesseAlto: 0, npsPromotor: 0,
  }

  if (tabelaLeadsOk) {
    const [
      { count: totalPessoas },
      { count: totalEscolasLeads },
      { count: totalContatos },
      { count: totalOikos },
      { count: decisores },
      { count: comEmail },
      { count: por2025 },
      { count: por2026 },
    ] = await Promise.all([
      supabase.from('leads_pessoa').select('*', { count: 'exact', head: true }),
      supabase.from('leads_escola').select('*', { count: 'exact', head: true }),
      supabase.from('leads_contato_escola').select('*', { count: 'exact', head: true }),
      supabase.from('leads_oikos_live').select('*', { count: 'exact', head: true }),
      supabase.from('leads_pessoa').select('*', { count: 'exact', head: true })
        .or('tipo_inscricao.ilike.%gestor%,tipo_inscricao.ilike.%diretor%,tipo_inscricao.ilike.%mantenedor%,tipo_inscricao.ilike.%coordenador%'),
      supabase.from('leads_pessoa').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('leads_participacao').select('*', { count: 'exact', head: true }).eq('evento', '1_CIECC_2025'),
      supabase.from('leads_participacao').select('*', { count: 'exact', head: true }).eq('evento', '2_CIECC_2026'),
    ])

    // Top UFs
    const { data: ufData } = await supabase.from('leads_pessoa').select('uf').not('uf', 'is', null).limit(5000)
    const ufCount: Record<string, number> = {}
    ufData?.forEach(r => { if (r.uf) ufCount[r.uf] = (ufCount[r.uf] ?? 0) + 1 })
    const porUFTop = Object.entries(ufCount).sort((a,b) => b[1]-a[1]).slice(0,6).map(([uf,n]) => ({ uf, n }))

    // Top tipos de inscrição
    const { data: tipoData } = await supabase.from('leads_pessoa').select('tipo_inscricao').not('tipo_inscricao', 'is', null).limit(5000)
    const tipoCount: Record<string, number> = {}
    tipoData?.forEach(r => { if (r.tipo_inscricao) tipoCount[r.tipo_inscricao] = (tipoCount[r.tipo_inscricao] ?? 0) + 1 })
    const porTipoTop = Object.entries(tipoCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([tipo,n]) => ({ tipo, n }))

    // NPS promotores (9-10) via perfil
    const { count: npsPromotor } = await supabase.from('leads_perfil_escola').select('*', { count: 'exact', head: true }).gte('nps', 9)
    // Interesse alto via perfil
    const { count: interesseAlto } = await supabase.from('leads_perfil_escola').select('*', { count: 'exact', head: true }).ilike('interesse_solucao', '%muito%')

    kpiLeads = {
      totalPessoas: totalPessoas ?? 0,
      totalEscolas: totalEscolasLeads ?? 0,
      totalContatos: totalContatos ?? 0,
      totalOikos: totalOikos ?? 0,
      decisores: decisores ?? 0,
      comEmail: comEmail ?? 0,
      por2025: por2025 ?? 0,
      por2026: por2026 ?? 0,
      porUFTop,
      porTipoTop,
      interesseAlto: interesseAlto ?? 0,
      npsPromotor: npsPromotor ?? 0,
    }
  }

  const pill = (label: string, val: string, ativo: boolean, cor: string) => ({
    href: '', label, ativo, cor,
  })

  const cor = '#2563eb'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader title="Pesquisa de Mercado CIECC" subtitle="Dados dos congressos 2025 e 2026" />

      <div style={{ padding: '1.5rem 2.5rem' }}>

        {/* ══════════════════════════════════════════════════════
            DASHBOARD DE KPIs — BANCO DE LEADS CONSOLIDADO
            Boas práticas: HubSpot, Salesforce, Pipedrive
            ══════════════════════════════════════════════════════ */}
        {tabelaLeadsOk && kpiLeads.totalPessoas > 0 ? (
          <div style={{ marginBottom: '2rem' }}>

            {/* Label do bloco */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>
                Banco de Leads Consolidado
              </span>
              <span style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                — CIECC 2025 + 2026 + Oikos Live
              </span>
            </div>

            {/* Linha 1 — Volume total */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.85rem', marginBottom: '.85rem' }}>
              {[
                {
                  label: 'Total de Leads', val: kpiLeads.totalPessoas.toLocaleString('pt-BR'),
                  sub: 'pessoas únicas no banco', cor: '#0f172a', bg: '#f8fafc', border: '#e2e8f0',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                },
                {
                  label: 'Decisores', val: kpiLeads.decisores.toLocaleString('pt-BR'),
                  sub: `${kpiLeads.totalPessoas > 0 ? Math.round(kpiLeads.decisores/kpiLeads.totalPessoas*100) : 0}% do total — gestores, diretores, mantenedores`,
                  cor: '#dc2626', bg: '#fef2f2', border: '#fca5a5',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                },
                {
                  label: 'Escolas Identificadas', val: kpiLeads.totalEscolas.toLocaleString('pt-BR'),
                  sub: `${kpiLeads.totalContatos.toLocaleString('pt-BR')} contatos vinculados`,
                  cor: '#4A7FDB', bg: '#fffbeb', border: '#fde68a',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                },
                {
                  label: 'Leads com E-mail', val: kpiLeads.comEmail.toLocaleString('pt-BR'),
                  sub: `${kpiLeads.totalPessoas > 0 ? Math.round(kpiLeads.comEmail/kpiLeads.totalPessoas*100) : 0}% de alcançabilidade por e-mail`,
                  cor: '#16a34a', bg: '#f0fdf4', border: '#86efac',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{k.label}</div>
                    <div style={{ color: k.cor, opacity: .6 }}>{k.icon}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '.3rem' }}>{k.val}</div>
                  <div style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Linha 2 — Congressos + Oikos + Qualificação */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '.85rem', marginBottom: '.85rem' }}>
              {[
                { label: '1º CIECC 2025', val: kpiLeads.por2025.toLocaleString('pt-BR'), sub: 'participações', cor: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                { label: '2º CIECC 2026', val: kpiLeads.por2026.toLocaleString('pt-BR'), sub: 'participações', cor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'Oikos Live', val: kpiLeads.totalOikos.toLocaleString('pt-BR'), sub: 'leads captados', cor: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
                { label: 'Promotores NPS', val: kpiLeads.npsPromotor.toLocaleString('pt-BR'), sub: 'NPS 9–10 (alto interesse)', cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
                { label: 'Interesse Alto We Make', val: kpiLeads.interesseAlto.toLocaleString('pt-BR'), sub: 'declaram muito interesse', cor: '#4A7FDB', bg: '#fffbeb', border: '#fde68a' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 12, padding: '.85rem 1rem' }}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '.2rem' }}>{k.val}</div>
                  <div style={{ fontSize: '.62rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Linha 3 — Distribuição por Estado + Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>

              {/* Top Estados */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem 1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#475569', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Distribuição por Estado
                </div>
                {kpiLeads.porUFTop.map(({ uf, n }, i) => {
                  const pct = kpiLeads.totalPessoas > 0 ? Math.round(n/kpiLeads.totalPessoas*100) : 0
                  const cores = ['#dc2626','#4A7FDB','#2563eb','#7c3aed','#0d9488','#64748b']
                  const c = cores[i] ?? '#64748b'
                  return (
                    <div key={uf} style={{ marginBottom: '.55rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.2rem' }}>
                        <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{uf}</span>
                        <span style={{ fontSize: '.72rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{n.toLocaleString('pt-BR')} <span style={{ color: c, fontWeight: 700 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: c, width: `${pct}%`, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Top Tipos de Inscrição */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem 1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#475569', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Perfil dos Inscritos
                </div>
                {kpiLeads.porTipoTop.map(({ tipo, n }, i) => {
                  const pct = kpiLeads.totalPessoas > 0 ? Math.round(n/kpiLeads.totalPessoas*100) : 0
                  const isDecisor = ['gestor','diretor','mantenedor','coordenador'].some(d => tipo.toLowerCase().includes(d))
                  const c = isDecisor ? '#dc2626' : '#64748b'
                  return (
                    <div key={tipo} style={{ marginBottom: '.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', minWidth: 0 }}>
                          {isDecisor && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />}
                          <span style={{ fontSize: '.72rem', color: '#1e293b', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tipo.length > 35 ? tipo.slice(0,35)+'…' : tipo}
                          </span>
                        </div>
                        <span style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', flexShrink: 0, marginLeft: '.5rem', fontWeight: 600 }}>{n}</span>
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: c, width: `${pct}%`, borderRadius: 3, opacity: isDecisor ? 1 : 0.5 }} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ marginTop: '.6rem', fontSize: '.62rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                  Decisores comerciais (gestores, diretores, mantenedores)
                </div>
              </div>
            </div>
          </div>
        ) : tabelaLeadsOk ? (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#92400e', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Banco de leads criado mas ainda vazio</div>
              <div style={{ fontSize: '.78rem', color: '#4A7FDB', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.2rem' }}>
                Execute o script <code style={{ background: '#fef3c7', padding: '.1rem .3rem', borderRadius: 4 }}>python importar_leads.py</code> para importar os dados das planilhas CIECC e Oikos Live.
              </div>
            </div>
          </div>
        ) : null}

        {/* ── KPIs Gerais (dados da tabela ciecc_inscritos) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '.85rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Inscritos 2025',  val: total2025.toLocaleString('pt-BR'),    cor: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Inscritos 2026',  val: total2026.toLocaleString('pt-BR'),    cor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Escolas 2025',    val: totalEscolas2025.toLocaleString('pt-BR'), cor: '#4A7FDB', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Escolas 2026',    val: totalEscolas2026.toLocaleString('pt-BR'), cor: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
            { label: 'Leads Decisores 2026', val: totalLeads2026.toLocaleString('pt-BR'),  cor: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderTop: `3px solid ${k.cor}`, borderRadius: 14, padding: '.9rem 1rem' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* ── Filtros ──────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Filtrar:</span>

          {/* Ano */}
          <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Ano:</span>
            {[['todos','Todos'],['2025','2025'],['2026','2026']].map(([v, l]) => (
              <Link key={v} href={`/pesquisa-mercado?ano=${v}&tipo=${tipoFiltro}&uf=${ufFiltro}`}
                style={{ padding: '.3rem .7rem', borderRadius: 7, textDecoration: 'none', fontSize: '.72rem', fontWeight: anoFiltro === v ? 700 : 500, background: anoFiltro === v ? '#0f172a' : '#f1f5f9', color: anoFiltro === v ? '#fff' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {l}
              </Link>
            ))}
          </div>

          {/* UF */}
          <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Estado:</span>
            <Link href={`/pesquisa-mercado?ano=${anoFiltro}&tipo=${tipoFiltro}&uf=todos`}
              style={{ padding: '.3rem .7rem', borderRadius: 7, textDecoration: 'none', fontSize: '.72rem', fontWeight: ufFiltro === 'todos' ? 700 : 500, background: ufFiltro === 'todos' ? '#0f172a' : '#f1f5f9', color: ufFiltro === 'todos' ? '#fff' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Todos
            </Link>
            {ufsUnicas.slice(0, 10).map(uf => (
              <Link key={uf} href={`/pesquisa-mercado?ano=${anoFiltro}&tipo=${tipoFiltro}&uf=${uf}`}
                style={{ padding: '.3rem .7rem', borderRadius: 7, textDecoration: 'none', fontSize: '.72rem', fontWeight: ufFiltro === uf ? 700 : 500, background: ufFiltro === uf ? '#4A7FDB' : '#f1f5f9', color: ufFiltro === uf ? '#fff' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {uf}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Grid de análises ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* NPS e CSI médio */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Indicadores de Satisfação</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'NPS Médio', val: npsMedia, sub: `${npsValidos.length} respostas`, cor: '#2563eb' },
                { label: 'CSI Médio', val: csiMedia, sub: `${csiValidos.length} respostas`, cor: '#16a34a' },
                { label: 'Com Escola', val: comEscola.length.toString(), sub: `de ${todos.length} inscritos`, cor: '#4A7FDB' },
                { label: 'Filtrado', val: todos.length.toString(), sub: 'registros visíveis', cor: '#64748b' },
              ].map(k => (
                <div key={k.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontSize: '.62rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.2rem' }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Inscrição */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Tipo de Inscrição</div>
            {porTipo.slice(0, 6).map(([tipo, n]) => (
              <div key={tipo} style={{ marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                  <span style={{ fontSize: '.72rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '.5rem' }}>{tipo}</span>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>{n} ({pct(n, todos.length)}%)</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#2563eb', width: `${pct(n, todos.length)}%`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Confessionalidade + Interesse We Make ────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Confessionalidade</div>
            {porConfessional.slice(0, 5).map(([v, n]) => (
              <div key={v} style={{ marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                  <span style={{ fontSize: '.68rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '.5rem' }}>{String(v).slice(0, 30)}</span>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#4A7FDB', width: `${pct(n, comEscola.length)}%`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Interesse na Solução We Make</div>
            {porInteresse.slice(0, 5).map(([v, n]) => (
              <div key={v} style={{ marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                  <span style={{ fontSize: '.68rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '.5rem' }}>{String(v).slice(0, 30)}</span>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#16a34a', width: `${pct(n, comEscola.length)}%`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Prazo de Decisão</div>
            {porPrazo.slice(0, 5).map(([v, n]) => (
              <div key={v} style={{ marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                  <span style={{ fontSize: '.68rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '.5rem' }}>{String(v).slice(0, 30)}</span>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#7c3aed', width: `${pct(n, comEscola.length)}%`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabela de escolas com dados de pesquisa ─── */}
        {comEscola.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.05)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '.85rem 1.25rem', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                Escolas com Dados de Pesquisa ({comEscola.length})
              </div>
              <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Clique em uma escola para ver os dados completos
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Escola','Cidade/UF','Tipo','NPS','Interesse We Make','Confessionalidade','Alunos','Investimento'].map(c => (
                      <th key={c} style={{ padding: '.55rem .85rem', textAlign: 'left', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comEscola.slice(0, 50).map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '.65rem .85rem', fontWeight: 700, fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nome_escola}</td>
                      <td style={{ padding: '.65rem .85rem', fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>{r.cidade}{r.uf ? `/${r.uf}` : ''}</td>
                      <td style={{ padding: '.65rem .85rem', fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.tipo_inscricao ?? '—'}</td>
                      <td style={{ padding: '.65rem .85rem', textAlign: 'center' }}>
                        {r.nps != null ? (
                          <span style={{ fontWeight: 800, fontSize: '.82rem', color: r.nps >= 9 ? '#16a34a' : r.nps >= 7 ? '#4A7FDB' : '#dc2626', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{r.nps}</span>
                        ) : <span style={{ color: '#cbd5e1', fontSize: '.72rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '.65rem .85rem', fontSize: '.68rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.interesse_solucao_WeMake ? <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '.1rem .4rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600, fontSize: '.62rem' }}>{String(r.interesse_solucao_WeMake).slice(0, 20)}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '.65rem .85rem', fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.confessionalidade ? String(r.confessionalidade).slice(0, 25) : '—'}</td>
                      <td style={{ padding: '.65rem .85rem', textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.9rem', fontWeight: 700, color: '#0f172a' }}>{r.qtd_alunos_total ?? '—'}</td>
                      <td style={{ padding: '.65rem .85rem', fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'nowrap' }}>{r.investimento_atual ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comEscola.length > 50 && (
                <div style={{ padding: '.85rem', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f1f5f9', fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Mostrando 50 de {comEscola.length} escolas. Use os filtros para refinar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Leads Decisores 2026 — Prospects Ativos ─── */}
        {leads2026Decisores.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.05)', marginBottom: '1.25rem' }}>
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Prospects 2026 — Escola não identificada
                </div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                  Gestores, mantenedores, diretores e coordenadores do 2º CIECC cuja escola ainda não foi vinculada ao CRM — prioridade de contato
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem', flexShrink: 0 }}>
                <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '.2rem .75rem', borderRadius: 99, fontSize: '.72rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  {leads2026Decisores.length} prospects
                </span>
                <span style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  gestores · mantenedores · diretores · coordenadores
                </span>
              </div>
            </div>
            <TabelaLeads leads={leads2026Decisores} />
          </div>
        )}

        {/* ── Leads Decisores 2025 — Referência histórica ─ */}
        {leads2025Decisores.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #64748b, #475569)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Histórico 2025 — Decisores sem escola mapeada
                </div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                  Do 1º CIECC — as escolas deste ano já foram em sua maioria identificadas. Use como base de verificação.
                </div>
              </div>
              <span style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', padding: '.2rem .75rem', borderRadius: 99, fontSize: '.72rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {leads2025Decisores.length} registros
              </span>
            </div>
            <TabelaLeads leads={leads2025Decisores} />
          </div>
        )}

      </div>
    </div>
  )
}

