import type { SupabaseClient } from '@supabase/supabase-js'

export const PRIORIDADES = ['baixa', 'media', 'alta', 'urgente'] as const
export type Prioridade = (typeof PRIORIDADES)[number]

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
}
export const PRIORIDADE_COR: Record<Prioridade, string> = {
  baixa: '#64748b', media: '#2563eb', alta: '#d97706', urgente: '#dc2626',
}

export interface Tag { id: string; nome: string; cor: string }
export interface Subtarefa { id: string; titulo: string; concluida: boolean; ordem: number }
export interface Tarefa {
  id: string
  colunaId: string
  titulo: string
  descricao: string | null
  responsavel: string | null
  prioridade: Prioridade | null
  dataVencimento: string | null
  ordem: number
  concluida: boolean
  tags: Tag[]
  subtarefas: Subtarefa[]
}
export interface Coluna { id: string; nome: string; cor: string; ordem: number; fechaTarefa: boolean; tarefas: Tarefa[] }
export interface Quadro { id: string; nome: string; colunas: Coluna[]; tags: Tag[] }

const COLUNAS_PADRAO = [
  { nome: 'A Fazer', cor: '#64748b', ordem: 0, fecha_tarefa: false },
  { nome: 'Em Andamento', cor: '#2563eb', ordem: 1, fecha_tarefa: false },
  { nome: 'Concluído', cor: '#16a34a', ordem: 2, fecha_tarefa: true },
]

/** Garante que exista o quadro único da v1, com as colunas padrão na primeira vez. */
export async function obterQuadroIdPadrao(db: SupabaseClient): Promise<string> {
  const { data: existente } = await db.from('quadros').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (existente) return existente.id

  const { data: novo, error } = await db.from('quadros').insert({ nome: 'Gestão de Projetos' }).select('id').single()
  if (error || !novo) throw new Error(error?.message ?? 'Erro ao criar o quadro padrão.')
  await db.from('colunas').insert(COLUNAS_PADRAO.map(c => ({ ...c, quadro_id: novo.id })))
  return novo.id
}

/** Carrega o quadro inteiro (colunas, tarefas, subtarefas, tags) com poucas idas ao banco. */
export async function carregarQuadro(db: SupabaseClient, quadroId: string): Promise<Quadro> {
  const [{ data: quadroRow }, { data: colunasRaw }, { data: tagsRaw }] = await Promise.all([
    db.from('quadros').select('id, nome').eq('id', quadroId).single(),
    db.from('colunas').select('*').eq('quadro_id', quadroId).order('ordem', { ascending: true }),
    db.from('tags').select('*').eq('quadro_id', quadroId).order('nome', { ascending: true }),
  ])

  const colunaIds = (colunasRaw ?? []).map(c => c.id)
  const { data: tarefasRaw } = colunaIds.length
    ? await db.from('projetos_tarefas').select('*').in('coluna_id', colunaIds).eq('arquivada', false).order('ordem', { ascending: true })
    : { data: [] as any[] }

  const tarefaIds = (tarefasRaw ?? []).map(t => t.id)
  const [{ data: subRaw }, { data: tarefasTagsRaw }] = await Promise.all([
    tarefaIds.length ? db.from('subtarefas').select('*').in('tarefa_id', tarefaIds).order('ordem', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    tarefaIds.length ? db.from('tarefas_tags').select('tarefa_id, tag_id').in('tarefa_id', tarefaIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const tagsPorId = new Map((tagsRaw ?? []).map(t => [t.id, { id: t.id, nome: t.nome, cor: t.cor }]))
  const tagsPorTarefa = new Map<string, Tag[]>()
  for (const tt of tarefasTagsRaw ?? []) {
    const tag = tagsPorId.get(tt.tag_id)
    if (!tag) continue
    const lista = tagsPorTarefa.get(tt.tarefa_id) ?? []
    lista.push(tag)
    tagsPorTarefa.set(tt.tarefa_id, lista)
  }
  const subPorTarefa = new Map<string, Subtarefa[]>()
  for (const s of subRaw ?? []) {
    const lista = subPorTarefa.get(s.tarefa_id) ?? []
    lista.push({ id: s.id, titulo: s.titulo, concluida: s.concluida, ordem: s.ordem })
    subPorTarefa.set(s.tarefa_id, lista)
  }

  const tarefasPorColuna = new Map<string, Tarefa[]>()
  for (const t of tarefasRaw ?? []) {
    const lista = tarefasPorColuna.get(t.coluna_id) ?? []
    lista.push({
      id: t.id, colunaId: t.coluna_id, titulo: t.titulo, descricao: t.descricao,
      responsavel: t.responsavel, prioridade: t.prioridade, dataVencimento: t.data_vencimento,
      ordem: t.ordem, concluida: t.concluida,
      tags: tagsPorTarefa.get(t.id) ?? [], subtarefas: subPorTarefa.get(t.id) ?? [],
    })
    tarefasPorColuna.set(t.coluna_id, lista)
  }

  const colunas: Coluna[] = (colunasRaw ?? []).map(c => ({
    id: c.id, nome: c.nome, cor: c.cor, ordem: c.ordem, fechaTarefa: c.fecha_tarefa,
    tarefas: tarefasPorColuna.get(c.id) ?? [],
  }))

  return { id: quadroId, nome: quadroRow?.nome ?? 'Gestão de Projetos', colunas, tags: [...tagsPorId.values()] }
}
