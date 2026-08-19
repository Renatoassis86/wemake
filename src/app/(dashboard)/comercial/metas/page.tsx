import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { ContadorRegressivo } from '@/components/metas/ContadorRegressivo'
import { getFunilContratacao } from '@/lib/funil-contratacao'
import { ALUNOS_ATUAIS } from '@/lib/metas'

// ══════════════════════════════════════════════════
// METAS — sprint até 31/08/2026
// ══════════════════════════════════════════════════
const METAS = {
  // Prospecção / funil — metas de curto prazo até o fim de agosto/2026
  reunioes_meta:  40,
  propostas_meta: 25,
  minutas_meta:   15,
  prazo:          '31/08/2026',

  // Escolas
  escolas_novas_meta: 26,    // novas parcerias a conquistar

  // Alunos — meta única, sem detalhamento por segmento/turma
  alunos_total_meta: 4000,
}

function BarraMeta({ pct, cor, height = 10 }: { pct: number; cor: string; height?: number }) {
  const p = Math.min(100, Math.max(0, pct))
  return (
    <div style={{ height, background: '#f1f5f9', borderRadius: height, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${p}%`, borderRadius: height,
        background: p >= 100 ? '#16a34a' : cor,
        transition: 'width .8s ease',
        boxShadow: p > 0 ? `0 0 8px ${cor}55` : 'none',
      }} />
    </div>
  )
}

function FunilBarras({ etapas }: { etapas: { label: string; valor: number; cor: string }[] }) {
  const max = Math.max(...etapas.map(e => e.valor), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {etapas.map((e, i) => {
        const largura = Math.max(Math.round((e.valor / max) * 100), e.valor > 0 ? 6 : 2)
        const anterior = i > 0 ? etapas[i - 1].valor : null
        const conversao = anterior && anterior > 0 ? Math.round((e.valor / anterior) * 100) : null
        return (
          <div key={e.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.35rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-inter,sans-serif)' }}>{e.label}</span>
              <span style={{ fontSize: '.78rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                <strong style={{ color: '#0f172a', fontSize: '.95rem' }}>{e.valor}</strong>
                {conversao !== null && (
                  <span style={{ color: '#94a3b8', fontWeight: 600, marginLeft: '.4rem' }}>· {conversao}% da etapa anterior</span>
                )}
              </span>
            </div>
            <div style={{ height: 26, background: '#f1f5f9', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${largura}%`, borderRadius: 7,
                background: `linear-gradient(90deg, ${e.cor}cc, ${e.cor})`,
                transition: 'width .8s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KpiCard({ label, valor, meta, pct, cor, bg, border, sub, icon }: {
  label: string; valor: string | number; meta?: string | number
  pct: number; cor: string; bg: string; border: string; sub?: string
  icon: React.ReactNode
}) {
  return (
    <div style={{
      background: bg, border: `1.5px solid ${border}`,
      borderRadius: 16, padding: '1.25rem 1.4rem',
      borderTop: `3px solid ${cor}`,
      display: 'flex', flexDirection: 'column', gap: '.65rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
          {label}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>
          {valor}
        </div>
        {meta !== undefined && (
          <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
            meta: {meta}
          </div>
        )}
        {sub && <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: '.1rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{sub}</div>}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
          <span style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>progresso</span>
          <span style={{ fontSize: '.7rem', fontWeight: 700, color: pct >= 100 ? '#16a34a' : cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{Math.min(100, pct)}%</span>
        </div>
        <BarraMeta pct={pct} cor={cor} height={6} />
      </div>
    </div>
  )
}

export default async function MetasPage() {
  const supabase = await createClient()

  const [
    { data: registrosRaw },
    { data: contratosAssinados },
    { data: contratosMinuta },
    funil,
  ] = await Promise.all([
    supabase.from('registros')
      .select('escola_id, data_contato, classificacao, responsavel_id, escola:escolas(nome)')
      .order('data_contato', { ascending: false }),

    // ✅ NOVAS ESCOLAS PARCEIRAS = contrato assinado por ambas as partes
    // Cresce conforme "Contrato assinado por ambas as partes" = Sim na Jornada Contratual
    supabase.from('contratos')
      .select('escola_id, contrato_assinado, escola:escolas(id, nome, cidade, estado, total_alunos, created_at)')
      .eq('contrato_assinado', true),

    // ℹ️ Escolas que enviaram minuta (estágio avançado, próximas de assinar)
    supabase.from('contratos')
      .select('escola_id, escola:escolas(nome, cidade, estado, total_alunos)')
      .eq('minuta_enviada', true)
      .eq('contrato_assinado', false),

    // Propostas enviadas + funil de contratação (ver /comercial/funil-contratacao)
    getFunilContratacao(),
  ])

  // Nome do responsável vem de `usuarios` (tabela viva) — `profiles` fica
  // desatualizada desde que a criação de usuário passou a gravar só em
  // `usuarios` (ver actions.ts).
  const respIds = [...new Set((registrosRaw ?? []).map((r: any) => r.responsavel_id).filter(Boolean))]
  const { data: usuariosResp } = respIds.length > 0
    ? await supabase.from('usuarios').select('id, nome_completo').in('id', respIds)
    : { data: [] as { id: string; nome_completo: string }[] }
  const nomePorId = new Map((usuariosResp ?? []).map(u => [u.id, u.nome_completo]))
  const registros = (registrosRaw ?? []).map((r: any) => ({
    ...r,
    responsavel: r.responsavel_id && nomePorId.has(r.responsavel_id)
      ? { full_name: nomePorId.get(r.responsavel_id)! }
      : null,
  }))

  // ── Cálculos ──────────────────────────────────────────────────

  // Reuniões únicas = escolas distintas que tiveram ao menos 1 registro
  const escolasComContato = new Set(registros?.map(r => r.escola_id) ?? [])
  const totalReunioes = escolasComContato.size

  // Propostas enviadas ativas (não arquivadas) — do funil de contratação
  const propostasEnviadas = funil.linhas.filter(l => l.proposta_id !== null).length
  const valorPipelinePropostas = funil.kpis.valorPipelineTotal

  // Minutas contratuais enviadas — contagem cumulativa (independente de já ter
  // avançado pra assinatura), a partir do funil de contratação
  const minutasEnviadas = funil.linhas.filter(l => l.minuta_enviada).length

  // ✅ NOVAS ESCOLAS PARCEIRAS = contratos assinados (métrica principal)
  const qtdEscolasNovas = contratosAssinados?.length ?? 0

  // Escolas em minuta (pipeline avançado — próximas de virar parceiras)
  const qtdEscolasMinuta = contratosMinuta?.length ?? 0

  // Percentuais
  const pctReunioes  = Math.round((totalReunioes    / METAS.reunioes_meta)      * 100)
  const pctPropostas = Math.round((propostasEnviadas / METAS.propostas_meta)    * 100)
  const pctMinutas   = Math.round((minutasEnviadas  / METAS.minutas_meta)       * 100)
  const pctEscolas   = Math.round((qtdEscolasNovas  / METAS.escolas_novas_meta) * 100)
  const pctAlunos    = Math.round((ALUNOS_ATUAIS    / METAS.alunos_total_meta)  * 100)

  // Registros recentes para timeline
  const registrosRecentes = registros?.slice(0, 8) ?? []

  // Escolas novas recentes = as que assinaram contrato mais recentemente
  const escolasNovasRecentes = (contratosAssinados ?? []).slice(0, 8)

  return (
    <div>
      <PageHeader
        title="Metas Comerciais"
        subtitle={`Sprint até ${METAS.prazo} — acompanhamento em tempo real`}
      />
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── Hero de contexto ─────────────────────────────── */}
        <div className="mp-metas-hero" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          borderRadius: 18, padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: '2rem', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(15,23,42,.2)',
        }}>
          <div>
            <div style={{ fontSize: '.62rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#4A7FDB', marginBottom: '.5rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              ✦ Sprint Comercial
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '.6rem' }}>
              Metas até {METAS.prazo}
            </h2>
            <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 580, lineHeight: 1.6 }}>
              Acompanhamento em tempo real das reuniões, propostas, minutas e alunos rumo à meta.
              Os contadores atualizam automaticamente conforme as operações são registradas.
            </p>
          </div>
          <div style={{ minWidth: 200 }}>
            <ContadorRegressivo />
          </div>
        </div>

        {/* ── Meta de Alunos — widget principal ─────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #14532d 130%)',
          borderRadius: 18, padding: '1.75rem 2rem', marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(15,23,42,.18)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#86efac', marginBottom: '.6rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Meta vs. Realizado
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '3.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {ALUNOS_ATUAIS.toLocaleString('pt-BR')}
                </span>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  / {METAS.alunos_total_meta.toLocaleString('pt-BR')} alunos
                </span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginTop: '.4rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Número atualizado manualmente pelo time comercial
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2.4rem', fontWeight: 800, color: '#86efac', lineHeight: 1 }}>
                {pctAlunos}%
              </div>
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)' }}>da meta atingido</div>
            </div>
          </div>
          <div style={{ marginTop: '1.4rem' }}>
            <div style={{ height: 16, background: 'rgba(255,255,255,.12)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, Math.max(0, pctAlunos))}%`, borderRadius: 8,
                background: 'linear-gradient(90deg, #16a34a, #86efac)',
                transition: 'width .8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
              <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                Faltam <strong style={{ color: '#86efac' }}>{Math.max(0, METAS.alunos_total_meta - ALUNOS_ATUAIS).toLocaleString('pt-BR')}</strong> alunos para atingir a meta
              </span>
              <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-inter,sans-serif)' }}>Prazo: {METAS.prazo}</span>
            </div>
          </div>
        </div>

        {/* ── KPIs — sprint até 31/08/2026 ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.1rem', marginBottom: '2rem' }}>

          <KpiCard
            label="Reuniões com Escolas Únicas"
            valor={totalReunioes}
            meta={`${METAS.reunioes_meta} até ${METAS.prazo}`}
            pct={pctReunioes}
            cor="#2563eb"
            bg="#eff6ff"
            border="#bfdbfe"
            sub="escolas que receberam ao menos 1 contato registrado"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />

          <KpiCard
            label="Propostas Enviadas"
            valor={propostasEnviadas}
            meta={`${METAS.propostas_meta} até ${METAS.prazo}`}
            pct={pctPropostas}
            cor="#b45309"
            bg="#fffbeb"
            border="#fcd34d"
            sub={formatCurrency(valorPipelinePropostas) + ' em pipeline'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
          />

          <KpiCard
            label="Minutas Contratuais Enviadas"
            valor={minutasEnviadas}
            meta={`${METAS.minutas_meta} até ${METAS.prazo}`}
            pct={pctMinutas}
            cor="#7c3aed"
            bg="#f5f3ff"
            border="#c4b5fd"
            sub={`${qtdEscolasNovas} já assinaram · ${qtdEscolasMinuta} aguardando assinatura`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="10" y2="11"/></svg>}
          />
        </div>

        {/* ── Funil de conversão do sprint ──────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: '2rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
          <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>
              Funil de Conversão do Sprint
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <FunilBarras etapas={[
              { label: 'Reuniões com escolas únicas', valor: totalReunioes, cor: '#2563eb' },
              { label: 'Propostas enviadas',          valor: propostasEnviadas, cor: '#b45309' },
              { label: 'Minutas contratuais enviadas', valor: minutasEnviadas, cor: '#7c3aed' },
              { label: 'Contratos assinados',          valor: qtdEscolasNovas, cor: '#16a34a' },
            ]} />
          </div>
        </div>

        {/* ── Novas Escolas Parceiras — meta secundária ─────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.1rem', marginBottom: '2rem' }}>
          <KpiCard
            label="Novas Escolas Parceiras"
            valor={qtdEscolasNovas}
            meta={`${METAS.escolas_novas_meta} novas`}
            pct={pctEscolas}
            cor="#4A7FDB"
            bg="#fffbeb"
            border="#fde68a"
            sub={`Contratos assinados · ${qtdEscolasMinuta > 0 ? `+${qtdEscolasMinuta} em minuta (pipeline)` : 'nenhuma em minuta ainda'}`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-1.2rem', marginBottom: '2rem' }}>
          <Link href="/comercial/funil-contratacao" style={{ fontSize: '.75rem', fontWeight: 700, color: '#4A7FDB', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Ver funil de contratação completo →
          </Link>
        </div>

        {/* ── Linha do tempo + novas escolas ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* Prospecção — últimas reuniões */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
            <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>Últimas Reuniões Registradas</span>
              </div>
              <span style={{ fontSize: '.65rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '.15rem .55rem', borderRadius: 99, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {totalReunioes} / {METAS.reunioes_meta}
              </span>
            </div>
            <div style={{ padding: '1rem 1.4rem' }}>
              {registrosRecentes.length > 0 ? registrosRecentes.map((r: any, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem 0', borderBottom: i < registrosRecentes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: r.classificacao === 'quente' ? '#ef4444' : r.classificacao === 'morno' ? '#4A7FDB' : '#6366f1',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(r as any).escola?.nome ?? r.escola_id.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {r.responsavel?.full_name ?? '—'} · {new Date(r.data_contato + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: 99, flexShrink: 0,
                    background: r.classificacao === 'quente' ? '#fef2f2' : r.classificacao === 'morno' ? '#fffbeb' : '#eef2ff',
                    color: r.classificacao === 'quente' ? '#dc2626' : r.classificacao === 'morno' ? '#4A7FDB' : '#6366f1',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    {r.classificacao}
                  </span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Nenhum registro ainda
                </div>
              )}
            </div>
          </div>

          {/* Novas escolas */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
            <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#4A7FDB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>Novas Escolas Captadas</span>
              </div>
              <span style={{ fontSize: '.65rem', background: '#fffbeb', color: '#4A7FDB', border: '1px solid #fde68a', padding: '.15rem .55rem', borderRadius: 99, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {qtdEscolasNovas} / {METAS.escolas_novas_meta}
              </span>
            </div>
            <div style={{ padding: '1rem 1.4rem' }}>
              {escolasNovasRecentes.length > 0 ? escolasNovasRecentes.map((e: any, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem 0', borderBottom: i < escolasNovasRecentes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-cormorant,serif)', fontSize: '.9rem', fontWeight: 700, color: '#4A7FDB' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.nome}
                    </div>
                    <div style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {e.cidade}{e.estado ? `, ${e.estado}` : ''} · {e.total_alunos ?? 0} alunos
                    </div>
                  </div>
                  <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)', background: '#f1f5f9', padding: '.1rem .4rem', borderRadius: 99 }}>
                    {new Date(e.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                  </span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Nenhuma escola nova cadastrada ainda neste ciclo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Resumo de progresso geral ────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem 1.75rem', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a', marginBottom: '1.25rem' }}>
            Painel de Progresso Consolidado — Sprint até {METAS.prazo}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { label: 'Reuniões Únicas',      atual: totalReunioes,      meta: METAS.reunioes_meta,      cor: '#2563eb', unidade: 'reuniões', sub: '' },
              { label: 'Propostas Enviadas',   atual: propostasEnviadas,  meta: METAS.propostas_meta,     cor: '#b45309', unidade: 'escolas',   sub: '' },
              { label: 'Minutas Enviadas',     atual: minutasEnviadas,    meta: METAS.minutas_meta,       cor: '#7c3aed', unidade: 'escolas',   sub: '' },
              { label: 'Contratos Assinados',  atual: qtdEscolasNovas,    meta: METAS.escolas_novas_meta, cor: '#16a34a', unidade: 'escolas',   sub: `${qtdEscolasMinuta} em minuta` },
            ].map(m => {
              const p = Math.min(100, Math.round((m.atual / m.meta) * 100))
              const falta = Math.max(0, m.meta - m.atual)
              return (
                <div key={m.label} style={{ padding: '.85rem 1rem', background: '#f8fafc', border: `1px solid ${m.cor}20`, borderTop: `3px solid ${m.cor}`, borderRadius: 10 }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: m.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.4rem' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem', marginBottom: '.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{m.atual.toLocaleString('pt-BR')}</span>
                    <span style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>/ {m.meta.toLocaleString('pt-BR')}</span>
                  </div>
                  <BarraMeta pct={p} cor={m.cor} height={5} />
                  <div style={{ fontSize: '.62rem', color: '#475569', marginTop: '.3rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    Faltam {falta.toLocaleString('pt-BR')} {m.unidade} · <strong style={{ color: m.cor }}>{p}%</strong>
                    {(m as any).sub && <span style={{ color: '#94a3b8', marginLeft: '.3rem' }}>· {(m as any).sub}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

