import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getFilaPriorizacao } from '@/lib/priorizacao'

export const dynamic = 'force-dynamic'

const STAGE_LABELS: Record<string, string> = {
  prospeccao:   'Prospecção',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  proposta:     'Proposta',
  negociacao:   'Negociação',
  fechamento:   'Fechamento',
  ganho:        'Ganho',
  perdido:      'Perdido',
}

export async function GET() {
  try {
    const {
      elegiveis, filaCompletarCadastro, clientesAtivos,
      distribuicaoPorEstado, distribuicaoPorEstagio,
      distribuicaoPorConfessionalidade, totalRespostasPesquisa,
      totalComAlunosCadastrados, totalSemAlunosCadastrados,
    } = await getFilaPriorizacao()

    const wb = XLSX.utils.book_new()

    // ── Aba 1: Fila de Abordagem ──────────────────────────────────────────
    const filaRows = elegiveis.map((e, idx) => ({
      '#': idx + 1,
      'Escola': e.nome,
      'Estado': e.estado ?? '',
      'Cidade': e.cidade ?? '',
      'Alunos': e.alunosEfetivo,
      'Origem do Porte': e.alunosEstimado ? 'Estimativa (pesquisa)' : 'Cadastro confirmado',
      'PIB per Capita (R$/hab.)': e.pibInfo?.pibPerCapita ?? '',
      '% do PIB do Estado': e.pibInfo?.pctPibEstado ?? '',
      'Posição do PIB per Capita no Estado': e.pibInfo ? `${e.pibInfo.posicaoNoEstado}º de ${e.pibInfo.totalCidadesNoEstado}` : '',
      'Proposta Enviada': e.propostaEnviada ? 'Sim' : 'Não',
      'Situação Comercial': e.negociacao_stage ? (STAGE_LABELS[e.negociacao_stage] ?? e.negociacao_stage) : 'Nunca contatada',
      'Ação Urgente': e.acaoUrgente ? 'Sim' : 'Não',
      'Confessionalidade': e.perfilPesquisa?.confessionalidade ?? '',
      'CSI (satisfação)': e.perfilPesquisa?.csi ?? '',
      'NPS': e.perfilPesquisa?.nps ?? '',
      'Interesse na Solução': e.perfilPesquisa?.interesseSolucao ?? '',
      'Responsável': e.responsavel_nome ?? '',
      'Telefone': e.telefone ?? '',
      'E-mail': e.email ?? '',
      'Origem do Lead': e.origem_lead ?? '',
    }))
    const wsFilas = XLSX.utils.json_to_sheet(filaRows)
    wsFilas['!cols'] = [
      { wch: 5 }, { wch: 40 }, { wch: 8 }, { wch: 24 },
      { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
      { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 8 },
      { wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 28 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, wsFilas, 'Fila de Abordagem')

    // ── Aba 2: Completar Cadastro ─────────────────────────────────────────
    const cadastroRows = filaCompletarCadastro.map(e => ({
      'Escola': e.nome,
      'Estado': e.estado ?? '',
      'Cidade': e.cidade ?? '',
      'Situação Comercial': e.negociacao_stage ? (STAGE_LABELS[e.negociacao_stage] ?? e.negociacao_stage) : 'Nunca contatada',
      'Responsável': e.responsavel_nome ?? '',
      'Telefone': e.telefone ?? '',
    }))
    const wsCadastro = XLSX.utils.json_to_sheet(cadastroRows.length > 0 ? cadastroRows : [{ Escola: 'Nenhuma escola nesta lista' }])
    wsCadastro['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsCadastro, 'Completar Cadastro')

    // ── Aba 3: Parceiras Ativas ───────────────────────────────────────────
    const ativasRows = clientesAtivos.map(e => ({
      'Escola': e.nome,
      'Estado': e.estado ?? '',
      'Cidade': e.cidade ?? '',
      'Total Alunos': e.total_alunos,
      'Responsável': e.responsavel_nome ?? '',
      'Telefone': e.telefone ?? '',
    }))
    const wsAtivas = XLSX.utils.json_to_sheet(ativasRows.length > 0 ? ativasRows : [{ Escola: 'Nenhuma escola nesta lista' }])
    wsAtivas['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 24 }, { wch: 14 }, { wch: 24 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsAtivas, 'Parceiras Ativas')

    // ── Aba 4: Resumo ─────────────────────────────────────────────────────
    const resumoRows = [
      { 'Indicador': 'Fila de Abordagem',     'Valor': elegiveis.length },
      { 'Indicador': 'Completar Cadastro',    'Valor': filaCompletarCadastro.length },
      { 'Indicador': 'Parceiras Ativas',       'Valor': clientesAtivos.length },
      { 'Indicador': '', 'Valor': '' },
      { 'Indicador': '--- QUALIDADE DO CADASTRO ---', 'Valor': '' },
      { 'Indicador': 'Escolas com alunos cadastrados', 'Valor': totalComAlunosCadastrados },
      { 'Indicador': 'Escolas sem alunos cadastrados',  'Valor': totalSemAlunosCadastrados },
      { 'Indicador': '', 'Valor': '' },
      { 'Indicador': '--- TOP ESTADOS ---', 'Valor': '' },
      ...distribuicaoPorEstado.map(d => ({ 'Indicador': d.estado, 'Valor': d.count })),
      { 'Indicador': '', 'Valor': '' },
      { 'Indicador': '--- SITUAÇÃO COMERCIAL ---', 'Valor': '' },
      ...distribuicaoPorEstagio.map(d => ({ 'Indicador': d.label, 'Valor': d.count })),
      { 'Indicador': '', 'Valor': '' },
      { 'Indicador': `--- CONFESSIONALIDADE (${totalRespostasPesquisa} respostas reais) ---`, 'Valor': '' },
      ...distribuicaoPorConfessionalidade.map(d => ({ 'Indicador': d.valor, 'Valor': d.count })),
    ]
    const wsResumo = XLSX.utils.json_to_sheet(resumoRows)
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    // Gerar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const filename = `priorizacao-comercial-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[priorizacao-export]', err)
    return NextResponse.json({ error: 'Erro ao gerar exportação' }, { status: 500 })
  }
}
