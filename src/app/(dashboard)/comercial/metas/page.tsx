import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import { formatCurrency } from '@/lib/utils'
import { ContadorRegressivo } from '@/components/metas/ContadorRegressivo'

// ══════════════════════════════════════════════════
// METAS 2027 — Plano Estratégico We Make
// ══════════════════════════════════════════════════
const METAS = {
  // Prospecção
  reunioes_meta:      80,    // reuniões com escolas únicas até agosto/2027
  reunioes_prazo:     'agosto/2027',

  // Escolas
  escolas_atuais:     25,    // escolas hoje
  escolas_novas_meta: 26,    // novas parcerias a conquistar
  escolas_total_meta: 51,    // 25 + 26

  // Alunos — detalhamento
  alunos_atuais:      2000,  // alunos nas escolas atuais hoje
  alunos_fund1_meta:  1000,  // crescimento Fund I nas escolas atuais (adesão material)
  alunos_novas_meta:  2000,  // alunos vindos das 26 novas escolas
  alunos_total_meta:  5000,  // 2000 + 1000 + 2000

  // Data
  ano: 2027,
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
    { data: escolas },
    { data: registros },
    { data: contratosAssinados },
    { data: contratosMinuta },
  ] = await Promise.all([
    supabase.from('escolas')
      .select('id, nome, cidade, estado, total_alunos, qtd_fund1, responsavel_id, created_at')
      .eq('ativa', true)
      .order('created_at', { ascending: false }),

    supabase.from('registros')
      .select('escola_id, data_contato, classificacao, responsavel:profiles(full_name), escola:escolas(nome)')
      .order('data_contato', { ascending: false }),

    // ✅ NOVAS ESCOLAS PARCEIRAS = contrato assinado por ambas as partes
    // Cresce conforme "Contrato assinado por ambas as partes" = Sim na Jornada Contratual
    supabase.from('contratos')
      .select(`
        escola_id, contrato_assinado,
        infantil2_qtd, infantil3_qtd, infantil4_qtd, infantil5_qtd,
        fund1_ano1_qtd, fund1_ano2_qtd, fund1_ano3_qtd, fund1_ano4_qtd, fund1_ano5_qtd,
        escola:escolas(id, nome, cidade, estado, total_alunos, created_at)
      `)
      .eq('contrato_assinado', true),

    // ℹ️ Escolas que enviaram minuta (estágio avançado, próximas de assinar)
    supabase.from('contratos')
      .select('escola_id, escola:escolas(nome, cidade, estado, total_alunos)')
      .eq('minuta_enviada', true)
      .eq('contrato_assinado', false),
  ])

  // ── Cálculos ──────────────────────────────────────────────────

  // Reuniões únicas = escolas distintas que tiveram ao menos 1 registro
  const escolasComContato = new Set(registros?.map(r => r.escola_id) ?? [])
  const totalReunioes = escolasComContato.size

  // ✅ NOVAS ESCOLAS PARCEIRAS = contratos assinados (métrica principal)
  const qtdEscolasNovas = contratosAssinados?.length ?? 0

  // Escolas em minuta (pipeline avançado — próximas de virar parceiras)
  const qtdEscolasMinuta = contratosMinuta?.length ?? 0

  // ✅ ALUNOS DAS NOVAS PARCERIAS
  // Prioridade: se tem alunos no contrato (formulário preenchido), usa esses dados
  // Senão, usa total_alunos da escola cadastrada
  const alunosNovasEscolas = (contratosAssinados ?? []).reduce((acc: number, c: any) => {
    const alunosContrato = (c.infantil2_qtd ?? 0) + (c.infantil3_qtd ?? 0) +
      (c.infantil4_qtd ?? 0) + (c.infantil5_qtd ?? 0) + (c.fund1_ano1_qtd ?? 0) +
      (c.fund1_ano2_qtd ?? 0) + (c.fund1_ano3_qtd ?? 0) + (c.fund1_ano4_qtd ?? 0) +
      (c.fund1_ano5_qtd ?? 0)
    const alunosEscola = (c.escola as any)?.total_alunos ?? 0
    return acc + (alunosContrato > 0 ? alunosContrato : alunosEscola)
  }, 0)

  // Escolas anteriores ao sistema (base histórica — 25 escolas parceiras pré-existentes)
  const corteData = new Date('2026-01-01')
  const escolasAnteriores = escolas?.filter((e: any) => new Date(e.created_at) < corteData) ?? []
  const qtdEscolasAnteriores = escolasAnteriores.length

  // BASE ATUAL: 2.000 fixos — baseline confirmada das 25 escolas parceiras históricas
  const BASELINE_ALUNOS = 2000

  // CRESCIMENTO FUND. I: alunos de Fund. I nas escolas já parceiras que aderirem ao material
  const alunosFund1Anteriores = escolasAnteriores.reduce((acc: number, e: any) =>
    acc + (e.qtd_fund1 ?? 0), 0)

  // Total projetado = base + Fund.I das escolas antigas + alunos das novas (contratos assinados)
  const totalProjetado = BASELINE_ALUNOS + alunosFund1Anteriores + alunosNovasEscolas

  // Percentuais
  const pctReunioes = Math.round((totalReunioes    / METAS.reunioes_meta)      * 100)
  const pctEscolas  = Math.round((qtdEscolasNovas  / METAS.escolas_novas_meta) * 100)
  const pctAlunos   = Math.round((totalProjetado   / METAS.alunos_total_meta)  * 100)

  // Registros recentes para timeline
  const registrosRecentes = registros?.slice(0, 8) ?? []

  // Escolas novas recentes = as que assinaram contrato mais recentemente
  const escolasNovasRecentes = (contratosAssinados ?? []).slice(0, 8)

  return (
    <div>
      <PageHeader
        title="Metas 2027"
        subtitle="Plano estratégico de crescimento We Make Education"
      />
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── Hero de contexto ─────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          borderRadius: 18, padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: '2rem', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(15,23,42,.2)',
        }}>
          <div>
            <div style={{ fontSize: '.62rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#d97706', marginBottom: '.5rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              ✦ Planejamento Estratégico
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '.6rem' }}>
              Crescimento 2027 — Parceria Educacional
            </h2>
            <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 580, lineHeight: 1.6 }}>
              Acompanhamento em tempo real das metas de prospecção, parcerias e expansão de alunos.
              Os contadores atualizam automaticamente conforme as operações são registradas.
            </p>
          </div>
          <div style={{ minWidth: 200 }}>
            <ContadorRegressivo />
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.1rem', marginBottom: '2rem' }}>

          <KpiCard
            label="Reuniões com Escolas Únicas"
            valor={totalReunioes}
            meta={`${METAS.reunioes_meta} até ${METAS.reunioes_prazo}`}
            pct={pctReunioes}
            cor="#2563eb"
            bg="#eff6ff"
            border="#bfdbfe"
            sub="escolas que receberam ao menos 1 contato registrado"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />

          <KpiCard
            label="Novas Escolas Parceiras"
            valor={qtdEscolasNovas}
            meta={`${METAS.escolas_novas_meta} novas (total: ${METAS.escolas_total_meta})`}
            pct={pctEscolas}
            cor="#d97706"
            bg="#fffbeb"
            border="#fde68a"
            sub={`Contratos assinados · ${qtdEscolasMinuta > 0 ? `+${qtdEscolasMinuta} em minuta (pipeline)` : 'nenhuma em minuta ainda'}`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
          />

          <KpiCard
            label="Total de Alunos (Projetado)"
            valor={(METAS.alunos_atuais + alunosFund1Anteriores + alunosNovasEscolas).toLocaleString('pt-BR')}
            meta={`${METAS.alunos_total_meta.toLocaleString('pt-BR')} alunos`}
            pct={pctAlunos}
            cor="#7c3aed"
            bg="#f5f3ff"
            border="#ddd6fe"
            sub={`2.000 base + ${alunosFund1Anteriores} Fund.I + ${alunosNovasEscolas} contratos assinados`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
          />
        </div>

        {/* ── Detalhamento das metas de alunos ─────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: '2rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
          <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>
              Composição da Meta de 5.000 Alunos
            </div>
          </div>
          <div style={{ padding: '1.5rem 1.75rem' }}>
            {/* Equação visual 2.000 + 1.000 + 2.000 = 5.000 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              {[
                { n: '2.000', label: 'Base atual\n(25 escolas parceiras)', cor: '#64748b', bg: '#f1f5f9' },
                { n: '+1.000', label: 'Crescimento Fund. I\n(escolas já parceiras)', cor: '#d97706', bg: '#fffbeb' },
                { n: '+2.000', label: 'Novas parcerias\n(infantil + fundamental)', cor: '#7c3aed', bg: '#f5f3ff' },
                { n: '= 5.000', label: 'Meta total\nalunos 2027', cor: '#16a34a', bg: '#f0fdf4' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 10, padding: '.8rem 1rem', textAlign: 'center', border: `1px solid ${item.cor}30` }}>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.5rem', fontWeight: 800, color: item.cor, lineHeight: 1, marginBottom: '.3rem' }}>{item.n}</div>
                  <div style={{ fontSize: '.62rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {[
                {
                  label: 'Base Atual — 25 Escolas',
                  atual: METAS.alunos_atuais,   // 2.000 fixos — declarado pelo usuário
                  meta:  METAS.alunos_atuais,
                  progAtual: METAS.alunos_atuais, // 100% — já temos esses alunos
                  desc: 'Alunos confirmados nas 25 escolas parceiras atuais',
                  cor: '#64748b',
                  bg: '#f8fafc',
                  nota: 'Base consolidada — não faz parte da meta de captação',
                  badge: 'Confirmado',
                  badgeCor: '#16a34a',
                },
                {
                  label: 'Crescimento Fund. I',
                  atual: alunosFund1Anteriores,  // alunos fund1 que as escolas antigas já registraram
                  meta:  METAS.alunos_fund1_meta, // meta: +1.000
                  progAtual: alunosFund1Anteriores,
                  desc: '+1.000 alunos do 1º ao 5º Ano nas escolas já parceiras',
                  cor: '#d97706',
                  bg: '#fffbeb',
                  nota: 'Adesão ao material Fund. I (1º ao 5º ano) pelas escolas atuais',
                  badge: null,
                  badgeCor: '',
                },
                {
                  label: 'Novas Parcerias — 26 Escolas',
                  atual: alunosNovasEscolas,      // alunos (infantil + fund) das escolas novas captadas
                  meta:  METAS.alunos_novas_meta, // meta: +2.000
                  progAtual: alunosNovasEscolas,
                  desc: `+2.000 alunos das 26 novas escolas — ${alunosNovasEscolas} confirmados via contrato assinado`,
                  cor: '#7c3aed',
                  bg: '#f5f3ff',
                  nota: `${qtdEscolasNovas} contratos assinados · ${qtdEscolasMinuta} em minuta`,
                  badge: null,
                  badgeCor: '',
                },
              ].map(m => {
                const p = m.meta > 0 ? Math.min(100, Math.round((m.progAtual / m.meta) * 100)) : 100
                return (
                  <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.cor}30`, borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: m.cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {m.label}
                      </div>
                      {m.badge && (
                        <span style={{ fontSize: '.58rem', fontWeight: 700, background: '#f0fdf4', color: m.badgeCor, border: `1px solid ${m.badgeCor}40`, padding: '.1rem .4rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        {m.atual.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '.78rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {m.label.startsWith('Base') ? 'alunos confirmados' : `/ ${m.meta.toLocaleString('pt-BR')} meta`}
                      </span>
                    </div>
                    <div style={{ fontSize: '.7rem', color: '#64748b', marginBottom: '.65rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{m.desc}</div>
                    <BarraMeta pct={p} cor={m.cor} height={7} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem' }}>
                      <span style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{m.nota}</span>
                      <span style={{ fontSize: '.68rem', fontWeight: 700, color: p >= 100 ? '#16a34a' : m.cor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{p}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Barra total consolidada */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #f8fafc)', border: '1px solid #86efac', borderRadius: 12, padding: '1.1rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.65rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.75rem', fontWeight: 700, color: '#0f172a' }}>Progresso Rumo à Meta de 5.000 Alunos</div>
                  <div style={{ fontSize: '.7rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                    Base confirmada: <strong style={{ color: '#16a34a' }}>2.000</strong> +
                    Fund.I crescimento: <strong style={{ color: '#d97706' }}>{alunosFund1Anteriores}</strong> +
                    Novas parcerias: <strong style={{ color: '#7c3aed' }}>{alunosNovasEscolas}</strong> =
                    <strong style={{ color: '#0f172a' }}> {(METAS.alunos_atuais + alunosFund1Anteriores + alunosNovasEscolas).toLocaleString('pt-BR')}</strong> alunos
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, color: pctAlunos >= 100 ? '#16a34a' : '#16a34a', lineHeight: 1 }}>
                    {pctAlunos}%
                  </div>
                  <div style={{ fontSize: '.62rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>da meta</div>
                </div>
              </div>
              <BarraMeta pct={pctAlunos} cor="#16a34a" height={14} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
                <span style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Faltam <strong style={{ color: '#d97706' }}>{Math.max(0, METAS.alunos_total_meta - (METAS.alunos_atuais + alunosFund1Anteriores + alunosNovasEscolas)).toLocaleString('pt-BR')}</strong> alunos novos para atingir a meta
                </span>
                <span style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>Meta: {METAS.alunos_total_meta.toLocaleString('pt-BR')} alunos</span>
              </div>
            </div>
          </div>
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
                    background: r.classificacao === 'quente' ? '#ef4444' : r.classificacao === 'morno' ? '#d97706' : '#6366f1',
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
                    color: r.classificacao === 'quente' ? '#dc2626' : r.classificacao === 'morno' ? '#d97706' : '#6366f1',
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
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a' }}>Novas Escolas Captadas</span>
              </div>
              <span style={{ fontSize: '.65rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '.15rem .55rem', borderRadius: 99, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {qtdEscolasNovas} / {METAS.escolas_novas_meta}
              </span>
            </div>
            <div style={{ padding: '1rem 1.4rem' }}>
              {escolasNovasRecentes.length > 0 ? escolasNovasRecentes.map((e: any, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem 0', borderBottom: i < escolasNovasRecentes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-cormorant,serif)', fontSize: '.9rem', fontWeight: 700, color: '#d97706' }}>
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
            Painel de Progresso Consolidado — Plano 2027
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { label: 'Reuniões Únicas',         atual: totalReunioes,         meta: METAS.reunioes_meta,        cor: '#2563eb', unidade: 'reuniões',  sub: '' },
              { label: 'Contratos Assinados',     atual: qtdEscolasNovas,       meta: METAS.escolas_novas_meta,   cor: '#d97706', unidade: 'escolas',   sub: `${qtdEscolasMinuta} em minuta` },
              { label: 'Crescimento Fund.I',       atual: alunosFund1Anteriores, meta: METAS.alunos_fund1_meta,    cor: '#0d9488', unidade: 'alunos',    sub: 'escolas parceiras atuais' },
              { label: 'Alunos via Contratos',    atual: alunosNovasEscolas,    meta: METAS.alunos_novas_meta,    cor: '#7c3aed', unidade: 'alunos',    sub: `${qtdEscolasNovas} contratos` },
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

