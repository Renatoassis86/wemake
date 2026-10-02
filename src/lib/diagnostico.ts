import schemaJson from '@/content/academia/diagnostico-schema.json'

/* ═══════════════════ Estrutura do Diagnóstico (da planilha oficial) ═══════════════════ */

export interface PerguntaAmbiente { key: string; pergunta: string; tipo: 'texto' | 'numero' | 'opcao'; opcoes?: string[]; detalhe?: boolean }
export interface Medida { key: string; categoria: string; info: string }
export interface Evidencia { key: string; nome: string }
export interface Recurso { key: string; categoria: string; item: string; spec: string; qtd: number; unid: string; ref: string; valor: number }
export interface ItemParecer { key: string; item: string }

export interface DiagnosticoSchema {
  ambiente: PerguntaAmbiente[]
  medidas: Medida[]
  evidencias: Evidencia[]
  reutilizaveis: Recurso[]
  consumiveis: Recurso[]
  parecerAmbiente: ItemParecer[]
  listas: { possui: string[]; parecer: string[]; acao: string[] }
}

export const SCHEMA = schemaJson as DiagnosticoSchema

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

export const MAX_TEXTO = 600

export function limparPatch(patch: Record<string, unknown>, permitidas: Set<string>): Respostas {
  const out: Respostas = {}
  for (const [k, v] of Object.entries(patch)) {
    if (!permitidas.has(k)) continue
    const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : ''
    out[k] = s.replace(/\u0000/g, '').slice(0, MAX_TEXTO)
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
    { secao: 'Medidas', feitos: SCHEMA.medidas.filter(m => preenchido(r[m.key])).length, total: SCHEMA.medidas.length },
    { secao: 'Evidências', feitos: SCHEMA.evidencias.filter(e => evidenciasComArquivo.has(e.key)).length, total: SCHEMA.evidencias.length },
    { secao: 'Recursos reutilizáveis', feitos: rec(SCHEMA.reutilizaveis), total: SCHEMA.reutilizaveis.length },
    { secao: 'Consumíveis', feitos: rec(SCHEMA.consumiveis), total: SCHEMA.consumiveis.length },
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
  const con = calc(SCHEMA.consumiveis)
  return { reu, con, total: reu.custo + con.custo }
}
