import { createAdminClient } from '@/lib/supabase/admin'
import { ContratosDashboardClient, type DashboardData } from '@/components/contratos/ContratosDashboardClient'
import { calcTotalAlunosContrato, calcValorTotalContrato, SERIES_CONTRATO } from '@/lib/contratos'
// BrasilMapa lê um geojson do disco (fs) — só pode rodar no servidor, por
// isso é montado aqui (Server Component) e passado pronto como children pro
// componente client, em vez de ser importado lá dentro.
import { BrasilMapa } from '@/components/comercial/BrasilMapa'

export const dynamic = 'force-dynamic'

const MODELO_LABEL: Record<string, string> = {
  mensalidade: 'Mensalidade',
  kit_we_make: 'Kit We Make',
}

export default async function ContratosPage() {
  const admin = createAdminClient()

  const [{ data: contratos }, { data: aditivos }] = await Promise.all([
    admin.from('contratos').select('*'),
    admin.from('contratos_aditivos').select('id, assinado'),
  ])

  const escolaIds = (contratos ?? []).map(c => c.escola_id)
  const { data: escolasRaw } = escolaIds.length
    ? await admin.from('escolas').select('id, nome, estado').in('id', escolaIds)
    : { data: [] as any[] }
  const escolasPorId = new Map((escolasRaw ?? []).map(e => [e.id, e]))

  const ativos = (contratos ?? []).filter(c => c.contrato_assinado && !c.declinou)

  // ── KPIs ──────────────────────────────────────────────────────────────
  const valorTotalDe = (c: any) => (c.valor_total ?? calcValorTotalContrato(c)) || 0
  const valorAnualDe = (c: any) => c.valor_anual ?? 0
  const receitaTotal = ativos.reduce((acc, c) => acc + valorTotalDe(c), 0)
  const receitaAnual = ativos.reduce((acc, c) => acc + valorAnualDe(c), 0)
  const alunosAtendidos = ativos.reduce((acc, c) => acc + calcTotalAlunosContrato(c), 0)
  const comValor = ativos.filter(c => valorTotalDe(c) > 0)
  const ticketMedio = comValor.length ? comValor.reduce((acc, c) => acc + valorTotalDe(c), 0) / comValor.length : 0
  const aditivosPendentes = (aditivos ?? []).filter(a => !a.assinado).length
  const comClausulaEspecial = ativos.filter(c => c.clausulas_especiais).length

  const kpis: DashboardData['kpis'] = {
    contratosAtivos: ativos.length,
    receitaTotal,
    receitaAnual,
    alunosAtendidos,
    ticketMedio,
    aditivosPendentes,
    comClausulaEspecial,
  }

  // ── Mapa: escolas ativas por estado ──────────────────────────────────
  const porEstado: Record<string, number> = {}
  for (const c of ativos) {
    const uf = escolasPorId.get(c.escola_id)?.estado
    if (uf) porEstado[uf] = (porEstado[uf] ?? 0) + 1
  }

  // ── Modelo comercial: mensalidade (contratos antigos) vs Kit We Make
  // (contratos novos 2027) — campo explícito, não mais adivinhado por texto.
  const grupos = new Map<string, { contratos: number; receita: number }>()
  for (const c of ativos) {
    const modelo = MODELO_LABEL[c.modelo_comercial as string] ?? 'Sem modelo definido'
    const g = grupos.get(modelo) ?? { contratos: 0, receita: 0 }
    g.contratos += 1
    g.receita += valorTotalDe(c)
    grupos.set(modelo, g)
  }
  const modeloComercial: DashboardData['modeloComercial'] = Array.from(grupos.entries())
    .map(([modelo, v]) => ({ modelo, ...v }))
    .sort((a, b) => b.contratos - a.contratos)

  // ── Alunos por segmento (Infantil / Fund. I / Fund. II / Médio) ────────
  const segmentos = new Map<string, number>()
  for (const c of ativos) {
    for (const s of SERIES_CONTRATO) {
      segmentos.set(s.segmento, (segmentos.get(s.segmento) ?? 0) + (c[s.campo] ?? 0))
    }
  }
  const ordemSegmentos = ['Infantil', 'Fund. I', 'Fund. II', 'Médio']
  const alunosPorSegmento: DashboardData['alunosPorSegmento'] = ordemSegmentos
    .map(segmento => ({ segmento, alunos: segmentos.get(segmento) ?? 0 }))
    .filter(s => s.alunos > 0)

  // ── Renovações: contratos por ano de término de vigência ───────────────
  const anoAtual = new Date().getFullYear()
  const porAno = new Map<number, number>()
  for (const c of ativos) {
    if (!c.vigencia_fim) continue
    const ano = new Date(c.vigencia_fim + 'T00:00:00').getFullYear()
    porAno.set(ano, (porAno.get(ano) ?? 0) + 1)
  }
  const renovacoes: DashboardData['renovacoes'] = Array.from(porAno.entries())
    .sort(([a], [b]) => a - b)
    .map(([ano, quantidade]) => ({
      ano, quantidade,
      status: ano - anoAtual <= 1 ? 'critico' : ano - anoAtual === 2 ? 'atencao' : 'ok',
    }))

  // ── Tabela de contratos: valor anual, valor total e progresso de
  // vigência (quantos anos já passaram vs quantos restam) por escola ─────
  const hoje = new Date()
  const contratosResumo: DashboardData['contratosResumo'] = ativos
    .map(c => {
      const ini = c.vigencia_inicio ? new Date(c.vigencia_inicio + 'T00:00:00') : null
      const fim = c.vigencia_fim ? new Date(c.vigencia_fim + 'T00:00:00') : null
      const duracaoMeses = ini && fim ? (fim.getFullYear() - ini.getFullYear()) * 12 + (fim.getMonth() - ini.getMonth()) + 1 : null
      const decorridoMeses = ini ? Math.min(
        duracaoMeses ?? Infinity,
        Math.max(0, (hoje.getFullYear() - ini.getFullYear()) * 12 + (hoje.getMonth() - ini.getMonth())),
      ) : null
      return {
        nome: escolasPorId.get(c.escola_id)?.nome ?? '—',
        modelo: MODELO_LABEL[c.modelo_comercial as string] ?? 'Sem modelo definido',
        valorAnual: valorAnualDe(c),
        valorTotal: valorTotalDe(c),
        duracaoMeses, decorridoMeses,
        veterana: !!c.marcado_veterana,
        vigenciaInicio: c.vigencia_inicio as string | null,
        vigenciaFim: c.vigencia_fim as string | null,
      }
    })
    .sort((a, b) => b.valorTotal - a.valorTotal)

  // ── Cláusulas especiais (lista de referência rápida) ───────────────────
  const clausulasEspeciais: DashboardData['clausulasEspeciais'] = ativos
    .filter(c => c.clausulas_especiais)
    .map(c => ({ nome: escolasPorId.get(c.escola_id)?.nome ?? '—', clausula: c.clausulas_especiais as string }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const data: DashboardData = { kpis, modeloComercial, alunosPorSegmento, renovacoes, contratosResumo, clausulasEspeciais }

  return <ContratosDashboardClient data={data} mapa={<BrasilMapa porEstado={porEstado} width={360} height={360} />} />
}
