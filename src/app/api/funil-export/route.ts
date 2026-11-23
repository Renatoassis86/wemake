import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { getFunilContratacao, FASE_LABELS } from '@/lib/funil-contratacao'
import { acessoRestritoDoUsuario, caminhoPermitido } from '@/lib/acesso-restrito'

export const dynamic = 'force-dynamic'

const TEMPERATURA_LABELS: Record<string, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const restricao = acessoRestritoDoUsuario(user.email)
  if (restricao && !caminhoPermitido(restricao, '/comercial/funil-contratacao')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { linhas, kpis } = await getFunilContratacao()

    const wb = XLSX.utils.book_new()

    // ── Aba 1: Funil de Contratação ───────────────────────────────────────
    const linhaRows = linhas.map(e => ({
      'Escola': e.escola_nome,
      'Estado': e.estado ?? '',
      'Cidade': e.cidade ?? '',
      'Fase do Funil': FASE_LABELS[e.fase_funil],
      'Temperatura': TEMPERATURA_LABELS[e.lead_temperatura] ?? e.lead_temperatura,
      'Declinou': e.declinou ? 'Sim' : 'Não',
      'Veterana (já atendida)': e.marcado_veterana ? 'Sim' : 'Não',
      'Responsável': e.responsavel_nome ?? '',
      'Telefone': e.telefone ?? '',
      'E-mail': e.email ?? '',
      'Alunos (cadastro)': e.alunos_cadastro,
      'Alunos (proposta)': e.alunos_proposta ?? '',
      'Valor Proposta (aluno/ano)': e.proposta_valor_aluno_ano ?? '',
      'Desconto Proposta (%)': e.proposta_desconto_pct ?? '',
      'Valor Contrato Total': e.contrato_valor_total || '',
      'Reuniões': e.reunioes_total,
      'Primeiro Contato': e.primeiro_contato ? new Date(e.primeiro_contato).toLocaleDateString('pt-BR') : '',
      'Última Interação': e.ultima_interacao ? new Date(e.ultima_interacao).toLocaleDateString('pt-BR') : '',
      'Formulário Recebido': e.formulario_recebido ? 'Sim' : 'Não',
      'Minuta Enviada': e.minuta_enviada ? 'Sim' : 'Não',
      'Contrato Enviado': e.contrato_enviado ? 'Sim' : 'Não',
      'Contrato Assinado': e.contrato_assinado ? 'Sim' : 'Não',
      'Status Implantação': e.implantacao_status ?? '',
      'Origem do Lead': e.origem_lead ?? '',
    }))
    const wsLinhas = XLSX.utils.json_to_sheet(linhaRows.length > 0 ? linhaRows : [{ Escola: 'Nenhuma escola no funil' }])
    wsLinhas['!cols'] = [
      { wch: 36 }, { wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
      { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 26 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 16 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, wsLinhas, 'Funil de Contratação')

    // ── Aba 2: Resumo ──────────────────────────────────────────────────────
    const resumoRows = [
      { 'Indicador': 'Escolas em Funil', 'Valor': kpis.totalEscolasEmFunil },
      { 'Indicador': 'Base de Leads — Total', 'Valor': kpis.baseDeLeads.total },
      { 'Indicador': 'Base de Leads — Quente', 'Valor': kpis.baseDeLeads.quente },
      { 'Indicador': 'Base de Leads — Morno', 'Valor': kpis.baseDeLeads.morno },
      { 'Indicador': 'Base de Leads — Frio', 'Valor': kpis.baseDeLeads.frio },
      { 'Indicador': 'Leads sem Interação', 'Valor': kpis.leadsSemInteracao },
      { 'Indicador': 'Total de Reuniões', 'Valor': kpis.totalReunioes },
      { 'Indicador': 'Valor em Pipeline (R$)', 'Valor': kpis.valorPipelineTotal },
      { 'Indicador': 'Valor Contratado (R$)', 'Valor': kpis.valorContratadoTotal },
      { 'Indicador': 'Em Implantação', 'Valor': kpis.emImplantacao },
      { 'Indicador': '', 'Valor': '' },
      { 'Indicador': '--- POR FASE ---', 'Valor': '' },
      ...Object.entries(kpis.porFase).map(([fase, count]) => ({
        'Indicador': FASE_LABELS[fase as keyof typeof FASE_LABELS] ?? fase,
        'Valor': count,
      })),
    ]
    const wsResumo = XLSX.utils.json_to_sheet(resumoRows)
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `funil-contratacao-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[funil-export]', err)
    return NextResponse.json({ error: 'Erro ao gerar exportação' }, { status: 500 })
  }
}
