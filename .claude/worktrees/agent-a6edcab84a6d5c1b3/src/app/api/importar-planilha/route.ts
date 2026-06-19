import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

// Campos default para o cadastro de Escolas no CRM
// Alinhado com os campos do formulário /comercial/escolas/nova
const CAMPOS_DEFAULT_ESCOLA = new Set([
  // ── CIECC (inscritos) ──
  'Inscrito', 'Nome', '👤 Nome',
  'Email', '📧 Email',
  'Tel. Celular', '📱 Tel', 'Tel. Fixo',
  'Cidade', 'UF', 'Endereço', 'Bairro', 'CEP',
  'Qual é o nome da sua instituição de ensino?',
  'Escola Declarada', 'Instituição',
  'CNPJ (Fórum)', 'CNPJ',
  'Qual é o tipo de sua inscrição?', 'Tipo', 'Cargo Original',
  'Qtd Alunos', 'Alunos',
  'Alunos Infantil', 'Alunos Fund. I', 'Alunos Fund. II', 'Alunos Ens. Médio',
  'Data Inscrição', '📅 Data', 'Lote', 'Participou I Congresso?',

  // ── CRM Education (Education_CRM_FINAL.xlsx) ──
  // Identificação da escola
  '🏫 Escola', 'Escola',
  // Localização
  // (Cidade e UF já mapeados acima)
  // Contatos (até 8 por escola — os mais importantes)
  '👤 Contato 1', 'Contato 1',
  '👤 Contato 2', 'Contato 2',
  'Cargo 1', 'Cargo 2',
  'Tel 1', 'Tel 2',
  'Email 1', 'Email 2',
  // Alunos
  // (Alunos já mapeado acima)
  // Status comercial
  '🔥 Status Lead', 'Status Lead',
  'Status 1º CIECC', 'Status 2026',
  'Origem', 'Fontes',
  // Representante Legal
  'Rep. Legal', 'Email Rep.', 'Tel Rep.',
  // Observações
  '📝 Observações', 'Observações',
])

// Mapeamento de nomes de colunas das planilhas → campos fixos do banco
const CAMPO_FIXO: Record<string, string> = {
  // Identificação
  'Inscrito': 'nome', 'Nome': 'nome', '👤 Nome': 'nome',
  'CPF': 'cpf',
  'RG': 'rg',
  'Sexo': 'sexo',
  'Data Nascimento': 'data_nascimento',

  // Contato
  'Email': 'email', '📧 Email': 'email', 'Email Original': 'email',
  'Tel. Celular': 'tel_celular', '📱 Tel': 'tel_celular', 'Tel Original': 'tel_celular',
  'Tel. Fixo': 'tel_fixo',
  'Tel. Comercial': 'tel_comercial',

  // Localização
  'Cidade': 'cidade',
  'UF': 'uf',
  'Endereço': 'endereco', 'Endereco': 'endereco',
  'Bairro': 'bairro',
  'CEP': 'cep',

  // Escola
  'Qual é o nome da sua instituição de ensino?': 'escola_nome',
  'Escola Declarada': 'escola_nome',
  'Instituição': 'escola_nome',
  '🏫 Escola': 'escola_nome', 'Escola': 'escola_nome',
  'CNPJ (Fórum)': 'escola_cnpj', 'CNPJ': 'escola_cnpj',

  // CRM — contato principal (usa Contato 1 como nome, Email 1 como email, Tel 1 como tel)
  '👤 Contato 1': 'nome', 'Contato 1': 'nome',
  'Email 1': 'email',
  'Tel 1': 'tel_celular',
  'Cargo 1': 'tipo_inscricao',
  // CRM — status e origem
  '🔥 Status Lead': 'cargo',  // reutiliza campo cargo para status do lead
  'Origem': 'lote',           // reutiliza lote como campo de origem/fonte da captação
  'Rep. Legal': 'nome',       // fallback se não tiver Contato 1
  'Email Rep.': 'email',
  'Tel Rep.': 'tel_celular',

  // Perfil
  'Qual é o tipo de sua inscrição?': 'tipo_inscricao',
  'Tipo': 'tipo_inscricao',
  'Cargo Original': 'cargo',

  // Evento
  'Lote': 'lote',
  'Data Inscrição': 'data_inscricao', '📅 Data': 'data_inscricao',
  'Forma de Pagamento': 'forma_pagamento',
  'Status Financeiro': 'status_financeiro',
  'Valor Total Inscrição': 'valor_total', 'Valor Total': 'valor_total', 'Valor': 'valor_total',

  // Alunos
  'Qtd Alunos': 'qtd_alunos_total', 'Alunos': 'qtd_alunos_total',
  'Alunos Infantil': 'qtd_infantil',
  'Alunos Fund. I': 'qtd_fund1',
  'Alunos Fund. II': 'qtd_fund2',
  'Alunos Ens. Médio': 'qtd_medio',
}

// Normaliza nome para deduplicação: minúsculo, sem acentos, sem pontuação
function normalizar(s: string): string {
  // Remove acentos via NFD + filtro de combining marks (U+0300–U+036F)
  const semAcento = s.normalize('NFD').split('').filter(c => {
    const cp = c.codePointAt(0) ?? 0
    return cp < 0x0300 || cp > 0x036F
  }).join('')
  return semAcento.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function limparValor(v: any): string | number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') {
    if (isNaN(v)) return null
    return v
  }
  const s = String(v).trim()
  if (!s || s === 'nan' || s === 'undefined' || s === 'NaN') return null
  return s
}

function limparTel(v: any): string | null {
  if (!v) return null
  const s = String(v).split('.')[0].replace(/\D/g, '')
  return s.length >= 8 ? s : null
}

function detectarModalidade(lote: string): string {
  return lote?.toUpperCase().includes('ONLINE') ? 'online' : 'presencial'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData      = await request.formData()
  const file          = formData.get('file') as File
  const acao          = formData.get('acao') as string
  const fonte         = formData.get('fonte') as string
  const abaIdx        = parseInt(formData.get('aba') as string ?? '0')
  const colsSel       = JSON.parse(formData.get('colunas_sel') as string ?? '[]') as string[]
  // filtrosTipo: array JSON de tipos exatos para filtrar (ex: ["Gestor de escola", "Mantenedor de escola"])
  // vazio [] = sem filtro = importa todos
  const filtrosTipoRaw = formData.get('filtros_tipo') as string ?? '[]'
  const filtrosTipo: string[] = JSON.parse(filtrosTipoRaw)

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  // Ler planilha completa
  const buffer    = await file.arrayBuffer()
  const wb        = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames[abaIdx] ?? wb.SheetNames[0]
  const sheet     = wb.Sheets[sheetName]

  // Detectar linha real de cabeçalho
  // CIECC: header na linha 0 direto
  // Education_CRM_FINAL: tem 3 linhas de título (linha 3 = headers reais)
  const rawArray = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null })

  // Detectar linha de header: a que tem MAIS células com texto descritivo (letras)
  // CRM linha 3 tem 69 textos; CIECC linha 0 tem ~40 textos
  function contarTextos(row: any[]): number {
    if (!row) return 0
    return row.filter((v: any) => {
      const s = String(v ?? '').trim()
      return s.length >= 2 && (s.match(/[a-zA-ZÀ-ú]/g) || []).length >= 2
    }).length
  }

  let headerRowIdx = 0
  let maxTextos = 0
  for (let i = 0; i < Math.min(8, rawArray.length); i++) {
    const n = contarTextos(rawArray[i] ?? [])
    if (n > maxTextos) { maxTextos = n; headerRowIdx = i }
  }

  // Montar headers: valores não-nulos da linha detectada; gaps recebem nome interno
  const headerRow = (rawArray[headerRowIdx] ?? []).map((v: any, ci: number) => {
    const s = String(v ?? '').trim()
    return s.length > 0 ? s : `__gap_${ci}`
  })

  // Montar registros: linhas seguintes, apenas não-vazias
  const todasRowsFull: Record<string, any>[] = []
  for (let i = headerRowIdx + 1; i < rawArray.length; i++) {
    const dataRow = rawArray[i] ?? []
    const temDado = dataRow.some((v: any) => String(v ?? '').trim() !== '')
    if (!temDado) continue
    const obj: Record<string, any> = {}
    headerRow.forEach((col: string, ci: number) => {
      if (!col.startsWith('__gap_')) {
        const v = dataRow[ci]
        const s = String(v ?? '').trim()
        obj[col] = s.length > 0 ? s : null
      }
    })
    todasRowsFull.push(obj)
  }

  // Coluna de tipo de inscrição (varia entre planilhas)
  const COL_TIPO = [
    'Qual é o tipo de sua inscrição?',
    'Tipo',
    'Cargo Original',
  ]

  // Detectar qual coluna de tipo existe nesta planilha
  const colTipoAtiva = todasRowsFull.length > 0
    ? COL_TIPO.find(c => todasRowsFull[0][c] !== undefined) ?? null
    : null

  // Contar todos os tipos únicos da planilha (para montar o seletor no frontend)
  const contagemTiposReais: Record<string, number> = {}
  todasRowsFull.forEach(row => {
    for (const col of COL_TIPO) {
      const v = String(row[col] ?? '').trim()
      if (v && v !== 'null') {
        contagemTiposReais[v] = (contagemTiposReais[v] ?? 0) + 1
        break
      }
    }
  })

  // Aplicar filtro de tipos selecionados (apenas se houver seleção)
  // Suporta dois formatos:
  //   1. Tipo exato: "Gestor de escola" → match exato (case-insensitive)
  //   2. Keyword: "__kw:gestor" → match parcial (contém "gestor")
  // Aplicar filtro apenas se a planilha TEM coluna de tipo (CIECC sim, CRM não)
  const planilhaTipoExiste = todasRowsFull.length > 0
    && COL_TIPO.some(c => todasRowsFull[0][c] !== undefined)
  let rawRows = todasRowsFull
  if (filtrosTipo.length > 0 && planilhaTipoExiste) {
    rawRows = todasRowsFull.filter(row => {
      for (const col of COL_TIPO) {
        const v = String(row[col] ?? '').trim().toLowerCase()
        if (!v || v === 'null') continue
        for (const filtro of filtrosTipo) {
          if (filtro.startsWith('__kw:')) {
            const kw = filtro.replace('__kw:', '').toLowerCase()
            if (v.includes(kw)) return true
          } else {
            if (v === filtro.toLowerCase()) return true
          }
        }
      }
      return false
    })
  }
  // CRM não tem tipo → filtros ignorados, todos os registros passam

  // Filtrar colunas reais
  const todasColunas = rawRows.length > 0
    ? Object.keys(rawRows[0]).filter(c => c && !c.startsWith('__EMPTY'))
    : []

  if (acao === 'preview') {
    // Identificar quais colunas têm mapeamento fixo e quais irão para dados_extras
    const mapeadas: Record<string, { campo: string; tipo: 'fixo' | 'extra' }> = {}
    todasColunas.forEach(col => {
      const campoFixo = CAMPO_FIXO[col]
      mapeadas[col] = campoFixo
        ? { campo: campoFixo, tipo: 'fixo' }
        : { campo: col, tipo: 'extra' }
    })

    // Colunas pré-selecionadas: apenas as relevantes para o cadastro de escola (default)
    const presel = todasColunas.filter(c => CAMPOS_DEFAULT_ESCOLA.has(c))

    const preview = rawRows.slice(0, 5).map(row =>
      Object.fromEntries(todasColunas.map(c => [c, row[c]]))
    )

    // Ordenar tipos por contagem (maior primeiro)
    const tiposOrdenados = Object.entries(contagemTiposReais)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, n]) => ({ tipo, n }))

    return NextResponse.json({
      abas: wb.SheetNames,
      colunas: todasColunas,
      mapeadas,
      presel,
      preview,
      total: rawRows.length,
      totalSemFiltro: todasRowsFull.length,
      filtrosAplicados: filtrosTipo,
      tiposDisponiveis: tiposOrdenados,  // todos os tipos reais da planilha com contagem
      colTipoAtiva,
    })
  }

  if (acao === 'importar') {
    if (colsSel.length === 0) return NextResponse.json({ error: 'Selecione ao menos uma coluna' }, { status: 400 })

    let inseridos = 0, atualizados = 0, erros = 0, ignorados = 0

    // ── Carregar todos os leads existentes para cruzamento ───────────
    // (carrega email + escola_nome + cnpj + fonte para deduplicar)
    const { data: existentes } = await supabase
      .from('leads_universal')
      .select('id, email, escola_nome, escola_cnpj, fonte, nome')
      .limit(50000)

    // Índices para busca rápida
    const idxEmail   = new Map<string, string>() // "email|fonte" → id
    const idxCNPJ    = new Map<string, string>() // "cnpj"        → id
    const idxEscola  = new Map<string, string>() // "escola_norm|fonte" → id

    ;(existentes ?? []).forEach((r: any) => {
      if (r.email)       idxEmail.set(`${r.email.toLowerCase()}|${r.fonte}`, r.id)
      if (r.escola_cnpj) idxCNPJ.set(r.escola_cnpj.replace(/\D/g,''), r.id)
      if (r.escola_nome) idxEscola.set(`${normalizar(r.escola_nome)}|${r.fonte}`, r.id)
    })

    const BATCH = 1  // processa um por um para cruzamento preciso (mais lento mas sem duplicatas)

    for (const row of rawRows) {
      const fixo: Record<string, any> = { fonte, importado_por: user.id }
      const extra: Record<string, any> = {}

      colsSel.forEach(col => {
        const val = row[col]
        const campoFixo = CAMPO_FIXO[col]
        if (campoFixo) {
          let v = limparValor(val)
          if (campoFixo === 'tel_celular' || campoFixo === 'tel_fixo' || campoFixo === 'tel_comercial') {
            v = limparTel(val)
          } else if (campoFixo === 'uf') {
            v = typeof v === 'string' ? v.toUpperCase().slice(0, 2) : null
          } else if (campoFixo === 'email') {
            v = typeof v === 'string' ? v.toLowerCase().trim() : null
          } else if (campoFixo === 'valor_total') {
            const n = parseFloat(String(val).replace(',', '.').replace('R$', ''))
            v = isNaN(n) ? null : Math.round(n * 100) / 100
          } else if (['qtd_alunos_total','qtd_infantil','qtd_fund1','qtd_fund2','qtd_medio'].includes(campoFixo)) {
            const n = parseInt(String(val).split('.')[0])
            v = isNaN(n) ? null : n
          }
          if (v !== null && v !== undefined) fixo[campoFixo] = v
        } else {
          const v = limparValor(val)
          if (v !== null) extra[col] = v
        }
      })

      if (fixo.lote) fixo.modalidade = detectarModalidade(fixo.lote)
      if (Object.keys(extra).length > 0) fixo.dados_extras = extra
      if (Object.keys(fixo).length <= 2) { ignorados++; continue }

      // ── Cruzamento: verificar se já existe ──────────────────────────
      let existeId: string | undefined

      // 1. Mesmo e-mail + mesma fonte
      if (fixo.email) {
        existeId = idxEmail.get(`${fixo.email}|${fonte}`)
      }

      // 2. Mesmo CNPJ (escola com certeza igual)
      if (!existeId && fixo.escola_cnpj) {
        const cnpjLimpo = String(fixo.escola_cnpj).replace(/\D/g,'')
        if (cnpjLimpo.length >= 8) existeId = idxCNPJ.get(cnpjLimpo)
      }

      // 3. Nome de escola normalizado + mesma fonte
      if (!existeId && fixo.escola_nome) {
        existeId = idxEscola.get(`${normalizar(fixo.escola_nome)}|${fonte}`)
      }

      if (existeId) {
        // ── ATUALIZA: apenas preenche campos que estavam nulos ───────
        // Não sobrescreve dados existentes — só completa lacunas
        const updatePayload: Record<string, any> = {}
        for (const [k, v] of Object.entries(fixo)) {
          if (['fonte','importado_por'].includes(k)) continue
          if (v !== null && v !== undefined) updatePayload[k] = v
        }
        // Mescla dados_extras com o existente (não substitui)
        if (fixo.dados_extras) {
          const { data: atual } = await supabase
            .from('leads_universal').select('dados_extras').eq('id', existeId).single()
          const extrasAtuais = (atual as any)?.dados_extras ?? {}
          updatePayload.dados_extras = { ...fixo.dados_extras, ...extrasAtuais } // existentes prevalecem
        }
        const { error } = await supabase
          .from('leads_universal').update(updatePayload).eq('id', existeId)
        if (error) erros++
        else {
          atualizados++
          // Atualiza índices em memória
          if (fixo.email)       idxEmail.set(`${fixo.email}|${fonte}`, existeId)
          if (fixo.escola_cnpj) idxCNPJ.set(String(fixo.escola_cnpj).replace(/\D/g,''), existeId)
          if (fixo.escola_nome) idxEscola.set(`${normalizar(fixo.escola_nome)}|${fonte}`, existeId)
        }
      } else {
        // ── INSERE: novo registro ─────────────────────────────────────
        const { data: novo, error } = await supabase
          .from('leads_universal').insert([fixo]).select('id').single()
        if (error) erros++
        else {
          inseridos++
          const novoId = (novo as any).id
          // Adiciona aos índices para deduplicar dentro do mesmo lote
          if (fixo.email)       idxEmail.set(`${fixo.email}|${fonte}`, novoId)
          if (fixo.escola_cnpj) idxCNPJ.set(String(fixo.escola_cnpj).replace(/\D/g,''), novoId)
          if (fixo.escola_nome) idxEscola.set(`${normalizar(fixo.escola_nome)}|${fonte}`, novoId)
        }
      }
    } // end for (const row of rawRows)

    return NextResponse.json({ inseridos, atualizados, erros, ignorados, total: rawRows.length })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
