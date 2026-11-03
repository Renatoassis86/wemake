import schemaJson from '@/content/academia/diagnostico-schema.json'
import modeloQuantidadesJson from '@/content/academia/modelo-quantidades.json'

/* ═══════════════════ Estrutura do Diagnóstico (da planilha oficial) ═══════════════════ */

export interface PerguntaAmbiente { key: string; pergunta: string; tipo: 'texto' | 'numero' | 'opcao'; opcoes?: string[]; detalhe?: boolean }
export interface Briefing {
  key: string; grupo: string; pergunta: string; tipo: 'opcao' | 'multi' | 'longo'; opcoes?: string[]; dica?: string
  /** aceita fotos e arquivos anexados à própria pergunta */
  anexo?: boolean
  /** a pergunta só aparece quando a resposta de outra pergunta bate */
  se?: { key: string; igual?: string; contem?: string }
}
export interface Medida { key: string; categoria: string; info: string }
export interface Evidencia { key: string; nome: string }
export interface Recurso { key: string; categoria: string; item: string; spec: string; qtd: number; unid: string; ref: string; valor: number }
export interface ItemParecer { key: string; item: string }

export interface DiagnosticoSchema {
  ambiente: PerguntaAmbiente[]
  briefing: Briefing[]
  medidas: Medida[]
  evidencias: Evidencia[]
  reutilizaveis: Recurso[]
  consumiveis: Recurso[]
  parecerAmbiente: ItemParecer[]
  listas: { possui: string[]; parecer: string[]; acao: string[] }
}

export const SCHEMA = schemaJson as DiagnosticoSchema

/** Seção "Materiais de consumo" (item 5): fora do diagnóstico por decisão da We Make. Os dados continuam no catálogo, caso volte. */
export const INCLUI_CONSUMIVEIS = false

/* ═════════════ Modelo de quantidade recomendada por nº de alunos ═════════════
 * Treinado com as 6 escolas que já têm planilha de recursos real + nº de alunos
 * no contrato comercial (ver relatório de validação). Três grupos por item:
 *  - fixo: mesma quantidade em toda escola, independente do tamanho (ferramentas/
 *    máquinas — "um por sala"). Usa valor_fixo.
 *  - confiavel: quantidade escala com o nº de alunos, validado por leave-one-out
 *    com erro ≤ 50%. Usa razao_por_aluno (mediana) com piso minimo_observado.
 *  - incerto: variou entre as escolas sem acompanhar o nº de alunos de forma
 *    confiável — não tem fórmula; mantém a quantidade do catálogo. */
export interface ModeloItem {
  grupo: 'fixo' | 'confiavel' | 'incerto'
  valor_fixo?: number
  razao_por_aluno?: number
  minimo_observado?: number
  mape_validacao_pct?: number | null
}
export const MODELO_QUANTIDADES = modeloQuantidadesJson as Record<string, ModeloItem>

/** Quantidade sugerida pra um item, a partir do modelo e do nº de alunos da escola.
 *  Sem modelo pro item, ou sem nº de alunos informado pros itens que dependem dele,
 *  cai no valor fixo do catálogo (rec.qtd) — nunca inventa um número. */
export function qtdSugerida(rec: Recurso, numAlunos: number | null): number {
  const m = MODELO_QUANTIDADES[rec.key]
  if (!m) return rec.qtd
  if (m.grupo === 'fixo') return m.valor_fixo ?? rec.qtd
  if (m.grupo === 'confiavel' && numAlunos && numAlunos > 0 && m.razao_por_aluno !== undefined) {
    return Math.max(m.minimo_observado ?? 0, Math.ceil(m.razao_por_aluno * numAlunos))
  }
  return rec.qtd
}

/** Bucket privado (criado em academia_diagnostico.sql). */
export const BUCKET = 'academia-diagnosticos'

export type Respostas = Record<string, string>
export type StatusDiagnostico = 'aberto' | 'enviado' | 'em_analise' | 'concluido'

export const STATUS_DIAGNOSTICO: Record<StatusDiagnostico, string> = {
  aberto: 'Em preenchimento',
  enviado: 'Enviado pela escola',
  em_analise: 'Em análise pela We Make',
  concluido: 'Devolutiva concluída',
}

/* ═══════════════════════════ Chaves aceitas do lado da escola ═══════════════════════════ */

/** Toda chave que a escola pode gravar. Qualquer outra é descartada no servidor. */
export const CHAVES_ESCOLA: Set<string> = (() => {
  const k = new Set<string>()
  SCHEMA.ambiente.forEach(a => { k.add(a.key); if (a.detalhe) k.add(a.key + '.d') })
  SCHEMA.briefing.forEach(b => k.add(b.key))
  SCHEMA.medidas.forEach(m => { k.add(m.key); k.add(m.key + '.l') })
  SCHEMA.evidencias.forEach(e => k.add(e.key + '.o'))
  ;[...SCHEMA.reutilizaveis, ...SCHEMA.consumiveis].forEach(r => { k.add(r.key + '.p'); k.add(r.key + '.q'); k.add(r.key + '.m') })
  return k
})()

/** Campos do parecer que só a We Make preenche. */
export const CHAVES_PARECER: Set<string> = (() => {
  const k = new Set<string>()
  SCHEMA.parecerAmbiente.forEach(p => { k.add(p.key + '.s'); k.add(p.key + '.o') })
  ;[...SCHEMA.reutilizaveis, ...SCHEMA.consumiveis].forEach(r => { k.add(r.key + '.pc'); k.add(r.key + '.qa'); k.add(r.key + '.ac'); k.add(r.key + '.qr') })
  ;['geral.situacao', 'geral.reutilizaveis', 'geral.consumiveis', 'geral.memorial', 'geral.obs', 'geral.arquitetura'].forEach(x => k.add(x))
  return k
})()

/** Itens que aceitam anexo: as evidências obrigatórias e cada linha do checklist de medidas ("Anexo ou link"). */
export const CHAVES_ANEXO: Set<string> = new Set([...SCHEMA.evidencias.map(e => e.key), ...SCHEMA.medidas.map(m => m.key), ...SCHEMA.briefing.filter(b => b.anexo).map(b => b.key)])

export const MAX_TEXTO = 600
/** Respostas longas do briefing (equipamento de climatização, mobiliário) aceitam mais texto. */
export const MAX_TEXTO_LONGO = 4000
const CHAVES_LONGAS = new Set(SCHEMA.briefing.filter(b => b.tipo === 'longo').map(b => b.key))

/** Respostas de múltipla escolha ficam guardadas numa linha só, separadas por "; ". */
export const SEPARADOR_MULTI = '; '
export const valoresMulti = (v: string | undefined) => (v ? v.split(SEPARADOR_MULTI).filter(Boolean) : [])

/** A pergunta do briefing está visível com as respostas atuais? */
export function briefingVisivel(b: Briefing, r: Respostas) {
  if (!b.se) return true
  const base = r[b.se.key] ?? ''
  if (b.se.igual !== undefined) return base === b.se.igual
  if (b.se.contem !== undefined) return valoresMulti(base).includes(b.se.contem)
  return true
}

export function limparPatch(patch: Record<string, unknown>, permitidas: Set<string>): Respostas {
  const out: Respostas = {}
  for (const [k, v] of Object.entries(patch)) {
    if (!permitidas.has(k)) continue
    const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : ''
    out[k] = s.replace(/\u0000/g, '').slice(0, CHAVES_LONGAS.has(k) ? MAX_TEXTO_LONGO : MAX_TEXTO)
  }
  return out
}

/* ═══════════════════════════════════ Andamento ═══════════════════════════════════ */

export interface Andamento { secao: string; feitos: number; total: number }

const preenchido = (v: string | undefined) => !!v && v.trim() !== ''

/** Quanto a escola já respondeu em cada seção (para a barra de progresso). */
export function andamento(r: Respostas, evidenciasComArquivo: Set<string>): Andamento[] {
  const rec = (itens: Recurso[]) => itens.filter(i => preenchido(r[i.key + '.p'])).length
  return [
    { secao: 'Ambiente', feitos: SCHEMA.ambiente.filter(a => preenchido(r[a.key])).length, total: SCHEMA.ambiente.length },
    {
      secao: 'Medidas',
      feitos: SCHEMA.briefing.filter(b => briefingVisivel(b, r) && preenchido(r[b.key])).length,
      total: SCHEMA.briefing.filter(b => briefingVisivel(b, r)).length,
    },
    { secao: 'Evidências', feitos: SCHEMA.evidencias.filter(e => evidenciasComArquivo.has(e.key)).length, total: SCHEMA.evidencias.length },
    { secao: 'Recursos reutilizáveis', feitos: rec(SCHEMA.reutilizaveis), total: SCHEMA.reutilizaveis.length },
    ...(INCLUI_CONSUMIVEIS ? [{ secao: 'Consumíveis', feitos: rec(SCHEMA.consumiveis), total: SCHEMA.consumiveis.length }] : []),
  ]
}

/* ═════════════════════════════ Cálculos do parecer (We Make) ═════════════════════════════ */

const num = (v: string | undefined) => {
  const n = Number((v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Quantidade recomendada efetiva pra um item: o que a equipe ajustou manualmente
 *  (parecer['xxx.qr']), senão a sugestão do modelo. É o número que entra na conta
 *  de "quantidade a adquirir" — nunca o rec.qtd do catálogo direto. */
export function qtdRecomendada(rec: Recurso, parecer: Respostas, numAlunos: number | null) {
  const ajuste = parecer[rec.key + '.qr']
  return ajuste !== undefined && ajuste !== '' ? num(ajuste) : qtdSugerida(rec, numAlunos)
}

export function qtdAAdquirir(rec: Recurso, parecer: Respostas, numAlunos: number | null) {
  return Math.max(0, qtdRecomendada(rec, parecer, numAlunos) - num(parecer[rec.key + '.qa']))
}

export function resumoParecer(parecer: Respostas, numAlunos: number | null) {
  const calc = (itens: Recurso[]) => {
    let comAquisicao = 0
    let custo = 0
    for (const r of itens) {
      const q = qtdAAdquirir(r, parecer, numAlunos)
      if (q > 0) comAquisicao++
      custo += q * r.valor
    }
    return { cadastrados: itens.length, comAquisicao, custo }
  }
  const reu = calc(SCHEMA.reutilizaveis)
  const con = calc(SCHEMA.consumiveis)
  return { reu, con, total: reu.custo + con.custo }
}

/* ═══════════════ Ponte entre o formulário (mapa chave → texto) e as tabelas relacionais ═══════════════ */

export interface LinhaBanco { item_key: string; campo: string; valor: string }

const COLUNA_ESCOLA: Record<string, string> = { '': 'resposta', d: 'detalhe', l: 'anexo_link', o: 'observacao', p: 'possui', q: 'qtd_existente', m: 'marca_obs' }
const COLUNA_PARECER: Record<string, string> = { s: 'status_parecer', pc: 'status_parecer', o: 'observacao', qa: 'qtd_aproveitavel', ac: 'acao', qr: 'qtd_recomendada' }

/** 'reu-01.p' → { item_key: 'reu-01', campo: 'possui' } */
export function patchParaLinhasEscola(patch: Respostas): LinhaBanco[] {
  return Object.entries(patch).flatMap(([k, valor]) => {
    const [item_key, suf = ''] = k.split('.')
    const campo = COLUNA_ESCOLA[suf]
    return campo ? [{ item_key, campo, valor }] : []
  })
}

/** 'par-02.s' → status_parecer; 'reu-01.qa' → qtd_aproveitavel; 'geral.obs' → texto do item 'geral.obs' */
export function patchParaLinhasParecer(patch: Respostas): LinhaBanco[] {
  return Object.entries(patch).flatMap(([k, valor]) => {
    if (k.startsWith('geral.')) return [{ item_key: k, campo: 'texto', valor }]
    const [item_key, suf = ''] = k.split('.')
    const campo = COLUNA_PARECER[suf]
    return campo ? [{ item_key, campo, valor }] : []
  })
}

/* ═══════════════════════ Comparação de compras (por escola) ═══════════════════════ */

/** Campos editáveis de academia_diag_compras — mesma whitelist do RPC academia_salvar_compras. */
export const CAMPOS_COMPRAS = [
  'situacao', 'melhor_loja', 'melhor_produto', 'melhor_item_exato', 'melhor_preco', 'melhor_link',
  'ml_preco', 'ml_link', 'amazon_preco', 'amazon_link',
  'link_original_loja', 'link_original_situacao', 'link_original_preco', 'link_original_url',
] as const
export type CampoCompras = (typeof CAMPOS_COMPRAS)[number]
/** Só esses 4 são numéricos no banco — o resto (loja, situação, link) é texto puro
 * e não pode passar pela troca de ponto por vírgula feita pra exibir preço. */
const CAMPOS_COMPRAS_NUM = new Set<CampoCompras>(['melhor_preco', 'ml_preco', 'amazon_preco', 'link_original_preco'])

export const CHAVES_COMPRAS: Set<string> = (() => {
  const k = new Set<string>()
  ;[...SCHEMA.reutilizaveis, ...SCHEMA.consumiveis].forEach(r => CAMPOS_COMPRAS.forEach(c => k.add(r.key + '.' + c)))
  return k
})()

/** 'reu-01.melhor_link' → { item_key: 'reu-01', campo: 'melhor_link' } */
export function patchParaLinhasCompras(patch: Respostas): LinhaBanco[] {
  return Object.entries(patch).flatMap(([k, valor]) => {
    const i = k.lastIndexOf('.')
    if (i < 0) return []
    const item_key = k.slice(0, i)
    const campo = k.slice(i + 1)
    return (CAMPOS_COMPRAS as readonly string[]).includes(campo) ? [{ item_key, campo, valor }] : []
  })
}

export interface CompraBanco {
  item_key: string
  situacao: string | null; melhor_loja: string | null; melhor_produto: string | null; melhor_item_exato: string | null
  melhor_preco: number | null; melhor_link: string | null
  ml_preco: number | null; ml_link: string | null; amazon_preco: number | null; amazon_link: string | null
  link_original_loja: string | null; link_original_situacao: string | null; link_original_preco: number | null; link_original_url: string | null
}

export function mapaDeCompras(rows: CompraBanco[]): Respostas {
  const m: Respostas = {}
  for (const r of rows) {
    for (const campo of CAMPOS_COMPRAS) {
      const v = r[campo]
      if (v === null || v === undefined) continue
      m[r.item_key + '.' + campo] = CAMPOS_COMPRAS_NUM.has(campo) ? emTexto(v) ?? '' : String(v)
    }
  }
  return m
}

export interface RespostaBanco {
  item_key: string
  resposta: string | null; detalhe: string | null; anexo_link: string | null; observacao: string | null
  possui: string | null; qtd_existente: number | null; marca_obs: string | null
}
export interface ParecerBanco {
  item_key: string
  status_parecer: string | null; observacao: string | null; qtd_aproveitavel: number | null; acao: string | null; texto: string | null
  qtd_recomendada: number | null
}

const emTexto = (v: unknown) => (v === null || v === undefined ? null : String(v).replace('.', ','))

export function mapaDeRespostas(rows: RespostaBanco[]): Respostas {
  const m: Respostas = {}
  for (const r of rows) {
    const k = r.item_key
    if (r.resposta) m[k] = r.resposta
    if (r.detalhe) m[k + '.d'] = r.detalhe
    if (r.anexo_link) m[k + '.l'] = r.anexo_link
    if (r.observacao) m[k + '.o'] = r.observacao
    if (r.possui) m[k + '.p'] = r.possui
    if (r.qtd_existente !== null && r.qtd_existente !== undefined) m[k + '.q'] = emTexto(r.qtd_existente) ?? ''
    if (r.marca_obs) m[k + '.m'] = r.marca_obs
  }
  return m
}

export function mapaDePareceres(rows: ParecerBanco[]): Respostas {
  const m: Respostas = {}
  for (const r of rows) {
    const k = r.item_key
    if (k.startsWith('geral.')) { if (r.texto) m[k] = r.texto; continue }
    if (r.status_parecer) m[k + (k.startsWith('par-') ? '.s' : '.pc')] = r.status_parecer
    if (r.observacao) m[k + '.o'] = r.observacao
    if (r.qtd_aproveitavel !== null && r.qtd_aproveitavel !== undefined) m[k + '.qa'] = emTexto(r.qtd_aproveitavel) ?? ''
    if (r.acao) m[k + '.ac'] = r.acao
    if (r.qtd_recomendada !== null && r.qtd_recomendada !== undefined) m[k + '.qr'] = emTexto(r.qtd_recomendada) ?? ''
  }
  return m
}
