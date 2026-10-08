import schemaJson from '@/content/academia/diagnostico-schema.json'

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
  ;[...SCHEMA.reutilizaveis, ...SCHEMA.consumiveis].forEach(r => { k.add(r.key + '.pc'); k.add(r.key + '.qa'); k.add(r.key + '.ac') })
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

export function qtdAAdquirir(rec: Recurso, parecer: Respostas) {
  return Math.max(0, rec.qtd - num(parecer[rec.key + '.qa']))
}

export function resumoParecer(parecer: Respostas) {
  const calc = (itens: Recurso[]) => {
    let comAquisicao = 0
    let custo = 0
    for (const r of itens) {
      const q = qtdAAdquirir(r, parecer)
      if (q > 0) comAquisicao++
      custo += q * r.valor
    }
    return { cadastrados: itens.length, comAquisicao, custo }
  }
  const reu = calc(SCHEMA.reutilizaveis)
  const con = calc(INCLUI_CONSUMIVEIS ? SCHEMA.consumiveis : [])
  return { reu, con, total: reu.custo + con.custo }
}

/* ═══════════════ Ponte entre o formulário (mapa chave → texto) e as tabelas relacionais ═══════════════ */

export interface LinhaBanco { item_key: string; campo: string; valor: string }

const COLUNA_ESCOLA: Record<string, string> = { '': 'resposta', d: 'detalhe', l: 'anexo_link', o: 'observacao', p: 'possui', q: 'qtd_existente', m: 'marca_obs' }
const COLUNA_PARECER: Record<string, string> = { s: 'status_parecer', pc: 'status_parecer', o: 'observacao', qa: 'qtd_aproveitavel', ac: 'acao' }

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

export interface RespostaBanco {
  item_key: string
  resposta: string | null; detalhe: string | null; anexo_link: string | null; observacao: string | null
  possui: string | null; qtd_existente: number | null; marca_obs: string | null
}
export interface ParecerBanco {
  item_key: string
  status_parecer: string | null; observacao: string | null; qtd_aproveitavel: number | null; acao: string | null; texto: string | null
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
  }
  return m
}
