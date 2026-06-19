import { createClient } from '@/lib/supabase/server'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'
import { upsertContrato } from '@/lib/actions'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { EscolaSelector } from '@/components/ui/EscolaSelector'
import { ContratoUpload } from '@/components/comercial/ContratoUpload'

interface Props { searchParams: Promise<{ escola?: string }> }

// Metas 2027 — alinhadas com o Plano Estratégico We Make
// 5.000 alunos = 2.000 base + 1.000 Fund.I + 2.000 novas escolas
const META_ALUNOS  = 5000
const META_RECEITA = 5000000

/* ── estilos locais ─────────────────────────────────────────────── */
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
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem 1.5rem' }

/* ── Checkbox de status ─────────────────────────────────────────── */
function StatusCheck({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '.85rem 1.1rem',
      background: checked ? '#f0fdf4' : '#fafafa',
      border: `1.5px solid ${checked ? '#86efac' : '#e2e8f0'}`,
      borderRadius: 10, transition: 'all .15s',
    }}>
      <span style={{ fontSize: '.82rem', fontWeight: 600, color: checked ? '#15803d' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
        {label}
      </span>
      <select name={name} defaultValue={checked ? 'true' : 'false'} style={{
        padding: '5px 10px', fontSize: '.78rem', fontWeight: 700,
        border: `1.5px solid ${checked ? '#86efac' : '#e2e8f0'}`, borderRadius: 7,
        background: checked ? '#dcfce7' : '#fff', color: checked ? '#15803d' : '#475569',
        outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
      }}>
        <option value="false">Não</option>
        <option value="true">Sim</option>
      </select>
    </div>
  )
}

export default async function ContratosPage({ searchParams }: Props) {
  const params    = await searchParams
  const escolaId  = params.escola ?? ''
  const supabase  = await createClient()

  const [escolas, { data: contratos_geral }] = await Promise.all([
    buscarEscolasUnificadas(supabase),
    supabase.from('contratos').select('*, escola:escolas(nome, estado, cidade)')
      .order('updated_at', { ascending: false }),
  ])

  let escola: any = null, contrato: any = null, ultimo_enc: string = ''
  let arquivosEscola: any[] = []

  if (escolaId) {
    const [{ data: e }, { data: c }, { data: reg }, { data: arqs }] = await Promise.all([
      supabase.from('escolas').select('*').eq('id', escolaId).single(),
      supabase.from('contratos').select('*').eq('escola_id', escolaId).single(),
      supabase.from('registros').select('encaminhamentos, prontidao')
        .eq('escola_id', escolaId).order('data_contato', { ascending: false }).limit(1).single(),
      supabase.from('contratos_arquivos').select('id, nome, path, created_at, tamanho')
        .eq('escola_id', escolaId).order('created_at', { ascending: false }),
    ])
    escola = e; contrato = c
    ultimo_enc = reg?.encaminhamentos?.join(', ') ?? reg?.prontidao ?? ''
    arquivosEscola = arqs ?? []
  }

  const c = contrato as any

  /* ── Metas ── */
  const total_alunos  = contratos_geral?.reduce((acc: number, x: any) =>
    acc + ((x.infantil2_qtd ?? 0) + (x.infantil3_qtd ?? 0) + (x.infantil4_qtd ?? 0) +
           (x.infantil5_qtd ?? 0) + (x.fund1_ano1_qtd ?? 0) + (x.fund1_ano2_qtd ?? 0) +
           (x.fund1_ano3_qtd ?? 0) + (x.fund1_ano4_qtd ?? 0) + (x.fund1_ano5_qtd ?? 0)), 0) ?? 0
  const total_receita = contratos_geral?.reduce((acc: number, x: any) =>
    acc + (x.valor_total_calculado ?? x.valor_total ?? 0), 0) ?? 0
  const pct_alunos   = Math.min(100, Math.round((total_alunos  / META_ALUNOS)  * 100))
  const pct_receita  = Math.min(100, Math.round((total_receita / META_RECEITA) * 100))

  const assinados = contratos_geral?.filter((x: any) => x.contrato_assinado)?.length ?? 0
  const enviados  = contratos_geral?.filter((x: any) => x.contrato_enviado && !x.contrato_assinado)?.length ?? 0

  return (
    <div>
      <PageHeader title="Jornada Contratual" subtitle="Gestão de contratos e fechamentos" />
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── KPIs de meta ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Contratos Assinados', value: assinados, sub: 'concluídos', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'Aguardando Assinatura', value: enviados, sub: 'enviados', color: '#4A7FDB', bg: '#fffbeb', border: '#fcd34d' },
            { label: 'Meta de Alunos', value: `${pct_alunos}%`, sub: `${total_alunos} / ${META_ALUNOS}`, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
            { label: 'Meta de Receita', value: `${pct_receita}%`, sub: formatCurrency(total_receita), color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 14, padding: '1.1rem 1.25rem', borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.color, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.35rem' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>{k.value}</div>
              <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Barras de Meta ────────────────────────────────── */}
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.25rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                { label: 'Meta de Alunos 2027', pct: pct_alunos, atual: total_alunos, meta: META_ALUNOS, unit: '', cor: '#16a34a' },
                { label: 'Meta de Receita 2027', pct: pct_receita, atual: formatCurrency(total_receita), meta: formatCurrency(META_RECEITA), unit: '', cor: '#7c3aed' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{m.label}</span>
                    <span style={{ fontSize: '.78rem', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, color: m.cor }}>{m.pct}%</span>
                  </div>
                  <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: '.35rem' }}>
                    <div style={{ height: '100%', borderRadius: 5, background: m.cor, width: `${m.pct}%`, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    {String(m.atual)} de {String(m.meta)} atingidos
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Seletor de Escola ─────────────────────────────── */}
        <div style={card}>
          <div style={secHdr()}>
            <div style={{ ...dot(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div style={secTitle}>Selecionar Escola para Editar Contrato</div>
          </div>
          <div style={{ padding: '1.25rem 1.75rem' }}>
            <EscolaSelector
              escolas={escolas ?? []}
              escolaId={escolaId}
              basePath="/comercial/contratos"
              placeholder="— Escolha uma escola para gerenciar seu contrato —"
              extraButton={escola ? (
                <Link href={`/comercial/escolas/${escolaId}`} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.8rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                  Ver Ficha
                </Link>
              ) : undefined}
            />
          </div>
        </div>

        {/* ── Formulário do Contrato ────────────────────────── */}
        {escola && (
          <form action={upsertContrato}>
            <input type="hidden" name="escola_id" value={escolaId} />

            {/* Escola selecionada — header informativo */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '.65rem', color: '#4A7FDB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.3rem' }}>
                  ✦ Editando Contrato
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700 }}>{escola.nome}</div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)' }}>{escola.cidade}{escola.estado ? `, ${escola.estado}` : ''}</div>
              </div>
              {c?.contrato_assinado && (
                <div style={{ background: '#16a34a', color: '#fff', padding: '.4rem 1rem', borderRadius: 9999, fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Contrato Assinado ✓
                </div>
              )}
            </div>

            {/* Checklist de Status */}
            <div style={card}>
              <div style={secHdr('#0f172a')}>
                <div style={{ ...dot('#0f172a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <div style={secTitle}>Checklist de Progresso Contratual</div>
                  <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>Marque cada etapa conforme avança no processo</div>
                </div>
              </div>
              <div style={body}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
                  {[
                    ['formulario_enviado',  'Formulário enviado à escola'],
                    ['formulario_recebido', 'Formulário recebido e conferido'],
                    ['minuta_enviada',      'Minuta do contrato enviada'],
                    ['retorno_minuta',      'Retorno da escola sobre a minuta'],
                    ['minuta_atualizada',   'Minuta atualizada conforme retorno'],
                    ['contrato_enviado',    'Contrato enviado para assinatura'],
                    ['contrato_assinado',   'Contrato assinado por ambas as partes'],
                    ['contrato_arquivado',  'Contrato arquivado no sistema'],
                  ].map(([name, label]) => (
                    <StatusCheck key={name} name={name} label={label} checked={!!c?.[name]} />
                  ))}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={lbl}>Observações sobre a minuta / pontos levantados pela escola</label>
                  <textarea name="observacao_minuta" rows={3} style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                    defaultValue={c?.observacao_minuta ?? ''}
                    placeholder="Descreva as principais observações, solicitações de alteração ou dúvidas levantadas pela escola..." />
                </div>

                <div>
                  <label style={lbl}>Encaminhamento Final</label>
                  <input name="encaminhamento_final" style={inp}
                    defaultValue={c?.encaminhamento_final ?? ultimo_enc ?? ''}
                    placeholder="Próximo passo previsto ou encaminhamento final..." />
                </div>
              </div>
            </div>

            {/* Alunos e Valores por segmento */}
            <div style={card}>
              <div style={secHdr('#16a34a')}>
                <div style={{ ...dot('#16a34a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <div>
                  <div style={secTitle}>Alunos e Valores por Segmento</div>
                  <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>Preencha a quantidade e o valor por aluno de cada segmento</div>
                </div>
              </div>
              <div style={body}>

                {/* Tabela de segmentos */}
                {[
                  { label: 'Infantil 2',    qtd: 'infantil2_qtd',  val: 'infantil2_valor' },
                  { label: 'Infantil 3',    qtd: 'infantil3_qtd',  val: 'infantil3_valor' },
                  { label: 'Infantil 4',    qtd: 'infantil4_qtd',  val: 'infantil4_valor' },
                  { label: 'Infantil 5',    qtd: 'infantil5_qtd',  val: 'infantil5_valor' },
                  { label: '1º Ano Fund I', qtd: 'fund1_ano1_qtd', val: 'fund1_ano1_valor' },
                  { label: '2º Ano Fund I', qtd: 'fund1_ano2_qtd', val: 'fund1_ano2_valor' },
                  { label: '3º Ano Fund I', qtd: 'fund1_ano3_qtd', val: 'fund1_ano3_valor' },
                  { label: '4º Ano Fund I', qtd: 'fund1_ano4_qtd', val: 'fund1_ano4_valor' },
                  { label: '5º Ano Fund I', qtd: 'fund1_ano5_qtd', val: 'fund1_ano5_valor' },
                ].map(seg => (
                  <div key={seg.qtd} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '1rem', alignItems: 'center', padding: '.65rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem', fontWeight: 600, color: '#0f172a' }}>{seg.label}</div>
                    <div>
                      <label style={{ ...lbl, marginBottom: '.25rem' }}>Qtd. Alunos</label>
                      <input name={seg.qtd} type="number" min="0" defaultValue={c?.[seg.qtd] ?? 0}
                        style={{ ...inp, padding: '.6rem .85rem', textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ ...lbl, marginBottom: '.25rem' }}>Valor por Aluno (R$)</label>
                      <input name={seg.val} type="number" min="0" step="0.01" defaultValue={c?.[seg.val] ?? 0}
                        style={{ ...inp, padding: '.6rem .85rem' }} />
                    </div>
                  </div>
                ))}

                {/* Tempo e Total */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '1rem', alignItems: 'center', padding: '.85rem 0', marginTop: '.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.82rem', fontWeight: 600, color: '#0f172a' }}>Tempo de Contrato</div>
                  <div>
                    <label style={{ ...lbl, marginBottom: '.25rem' }}>Anos</label>
                    <input name="tempo_contrato" type="number" min="1" defaultValue={c?.tempo_contrato ?? 1}
                      style={{ ...inp, padding: '.6rem .85rem', textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1rem', fontWeight: 700 }} />
                  </div>
                  {(c?.valor_total_calculado > 0 || c?.valor_total > 0) && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '.65rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>Valor Total Estimado</div>
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: '#4A7FDB' }}>
                        {formatCurrency(c.valor_total_calculado ?? c.valor_total ?? 0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: '2rem' }}>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: '#fff', padding: '.7rem 2rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 14px rgba(74,127,219,.35)' }}>
                Salvar Contrato
              </button>
              <Link href={`/comercial/escolas/${escolaId}`} style={{ padding: '.7rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Cancelar
              </Link>
            </div>
          </form>
        )}

        {/* ── Upload de Arquivos do Contrato ─────────────────── */}
        {escola && (
          <div style={card}>
            <div style={secHdr('#0f172a')}>
              <div style={{ ...dot('#0f172a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </div>
              <div>
                <div style={secTitle}>Arquivos do Contrato — {escola.nome}</div>
                <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>
                  Upload e gestão dos documentos contratuais desta escola
                </div>
              </div>
            </div>
            <div style={body}>
              <ContratoUpload
                escolaId={escolaId}
                escolaNome={escola.nome}
                arquivosExistentes={arquivosEscola.map((a: any) => ({
                  id:        a.id,
                  nome:      a.nome,
                  url:       `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos-oficiais/${a.path}`,
                  criado_em: a.created_at,
                  tamanho:   a.tamanho,
                }))}
              />
            </div>
          </div>
        )}

        {/* ── Acompanhamento Geral ──────────────────────────── */}
        <div style={card}>
          <div style={secHdr('#6366f1')}>
            <div style={{ ...dot('#6366f1'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <div style={secTitle}>Acompanhamento Geral de Contratos</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {contratos_geral && contratos_geral.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Escola','Estado','Encaminhamento','Form.','Minuta','Assinado','Arquivado','Valor Total'].map(col => (
                      <th key={col} style={{ padding: '.7rem 1rem', textAlign: 'left', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contratos_geral.map((ct: any, idx: number) => (
                    <tr key={ct.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                        <Link href={`/comercial/contratos?escola=${ct.escola_id}`} style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ct.escola?.nome ?? '—'}
                        </Link>
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#64748b' }}>{ct.escola?.estado ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.78rem', color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct.encaminhamento_final ?? '—'}</td>
                      {[
                        [ct.formulario_recebido, 'Recebido'],
                        [ct.minuta_enviada,       'Enviada'],
                        [ct.contrato_assinado,    'Assinado'],
                        [ct.contrato_arquivado,   'Arquivado'],
                      ].map(([ok, lbl], i) => (
                        <td key={i} style={{ padding: '.85rem 1rem', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                            background: ok ? '#f0fdf4' : '#fafafa',
                            color: ok ? '#16a34a' : '#94a3b8',
                            border: `1px solid ${ok ? '#86efac' : '#e2e8f0'}`,
                            padding: '.2rem .6rem', borderRadius: 99,
                            fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
                          }}>
                            {ok ? '✓' : '—'}
                          </span>
                        </td>
                      ))}
                      <td style={{ padding: '.85rem 1rem', fontFamily: 'var(--font-cormorant,serif)', fontSize: '.95rem', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {(ct.valor_total_calculado > 0 || ct.valor_total > 0) ? formatCurrency(ct.valor_total_calculado ?? ct.valor_total ?? 0) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                <div style={{ fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Nenhum contrato registrado ainda.</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

