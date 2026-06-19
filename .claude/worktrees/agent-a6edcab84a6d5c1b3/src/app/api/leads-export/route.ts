import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q     = searchParams.get('q')     ?? ''
  const fonte = searchParams.get('fonte') ?? ''
  const tipo  = searchParams.get('tipo')  ?? ''
  const uf    = searchParams.get('uf')    ?? ''

  // Buscar todos os registros (sem paginação) com os filtros aplicados
  let query = supabase
    .from('leads_universal')
    .select('nome,email,tel_celular,tel_fixo,tipo_inscricao,cargo,escola_nome,escola_cnpj,cidade,uf,lote,data_inscricao,fonte,dados_extras')
    .order('nome')
    .limit(10000)

  if (q)     query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,escola_nome.ilike.%${q}%`)
  if (fonte) query = query.eq('fonte', fonte)
  if (uf)    query = query.eq('uf', uf.toUpperCase())

  // Filtro por tipo só se a fonte NÃO for crm
  // (CRM não tem tipo_inscricao — todos são representantes de escolas)
  const isCRM = fonte === 'crm'
  if (!isCRM) {
    if (tipo === 'decisores')    query = query.or('tipo_inscricao.ilike.%gestor%,tipo_inscricao.ilike.%diretor%,tipo_inscricao.ilike.%mantenedor%,tipo_inscricao.ilike.%coordenador%')
    else if (tipo === 'gestores')     query = query.ilike('tipo_inscricao', '%gestor%')
    else if (tipo === 'diretores')    query = query.ilike('tipo_inscricao', '%diretor%')
    else if (tipo === 'mantenedores') query = query.ilike('tipo_inscricao', '%mantenedor%')
  }

  const { data: leads } = await query

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'Nenhum dado para exportar' }, { status: 404 })
  }

  // Montar label da fonte
  const FONTE_LABEL: Record<string, string> = {
    ciecc_2025: '1º CIECC 2025',
    ciecc_2026: '2º CIECC 2026',
    crm: 'CRM Education',
    oikos: 'Oikos Live',
    outro: 'Outro',
  }

  // Construir linhas da planilha
  const rows = leads.map((l: any) => {
    const extras = l.dados_extras ?? {}
    return {
      'Nome':           l.nome ?? '',
      'E-mail':         l.email ?? '',
      'Telefone':       l.tel_celular ?? '',
      'Tel. Fixo':      l.tel_fixo ?? '',
      'Tipo/Cargo':     l.tipo_inscricao ?? '',
      'Cargo Original': l.cargo ?? '',
      'Escola':         l.escola_nome ?? '',
      'CNPJ Escola':    l.escola_cnpj ?? '',
      'Cidade':         l.cidade ?? '',
      'UF':             l.uf ?? '',
      'Lote':           l.lote ?? '',
      'Data Inscrição': l.data_inscricao ?? '',
      'Fonte':          FONTE_LABEL[l.fonte] ?? l.fonte ?? '',
      // Campos extras do JSONB — expande dinamicamente
      ...Object.fromEntries(
        Object.entries(extras).map(([k, v]) => [k, String(v ?? '')])
      ),
    }
  })

  // Criar workbook
  const wb  = XLSX.utils.book_new()
  const ws  = XLSX.utils.json_to_sheet(rows)

  // Larguras automáticas das colunas
  const colWidths = Object.keys(rows[0]).map(key => ({
    wch: Math.max(key.length, ...rows.slice(0, 50).map(r => String((r as any)[key] ?? '').length), 10)
  }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Leads')

  // Aba de resumo
  const dataExport = new Date().toLocaleDateString('pt-BR')
  const resumo = [
    ['CVE Gestão Comercial — Exportação de Leads'],
    ['Data de exportação:', dataExport],
    ['Total de registros:', leads.length.toString()],
    ['Filtros aplicados:'],
    ['Fonte:', FONTE_LABEL[fonte] || 'Todas'],
    ['Tipo:', tipo || 'Todos'],
    ['UF:', uf || 'Todos'],
    ['Busca:', q || '—'],
  ]
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

  // Gerar buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // Montar nome do arquivo
  const now   = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  const label = fonte ? `_${FONTE_LABEL[fonte]?.replace(/\s+/g,'-') ?? fonte}` : ''
  const filename = `CVE_Leads${label}_${stamp}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
