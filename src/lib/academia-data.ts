import { createAdminClient } from '@/lib/supabase/admin'
import type { Evento, Implantacao, Tarefa } from '@/lib/academia-gestao'

export interface GestaoData {
  /** true quando as tabelas ainda não existem (academia_gestao.sql não foi aplicado) */
  setup: boolean
  erro?: string
  implantacoes: Implantacao[]
  tarefas: Tarefa[]
  eventos: Evento[]
  pessoas: { id: string; nome: string }[]
  escolas: { id: string; nome: string }[]
}

const FALTA_TABELA = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST205' || e.code === '42P01' || /does not exist|schema cache|Could not find the table/i.test(e.message ?? ''))

export async function carregarGestao(opts: { escolas?: boolean } = {}): Promise<GestaoData> {
  const db = createAdminClient()
  const vazio: GestaoData = { setup: false, implantacoes: [], tarefas: [], eventos: [], pessoas: [], escolas: [] }

  const [impl, tar, eve, usu] = await Promise.all([
    db.from('academia_implantacoes').select('*').order('created_at', { ascending: true }),
    db.from('academia_tarefas').select('*').order('ordem', { ascending: true }),
    db.from('academia_eventos').select('*').order('inicio', { ascending: true }),
    db.from('usuarios').select('id, nome_completo').eq('ativo', true).order('nome_completo'),
  ])

  if (FALTA_TABELA(impl.error) || FALTA_TABELA(tar.error) || FALTA_TABELA(eve.error)) return { ...vazio, setup: true }
  const erro = impl.error?.message ?? tar.error?.message ?? eve.error?.message
  if (erro) return { ...vazio, erro }

  let escolas: GestaoData['escolas'] = []
  if (opts.escolas) {
    const { data } = await db.from('escolas').select('id, nome').order('nome')
    escolas = (data ?? []) as GestaoData['escolas']
  }

  return {
    setup: false,
    implantacoes: (impl.data ?? []) as Implantacao[],
    tarefas: (tar.data ?? []) as Tarefa[],
    eventos: (eve.data ?? []) as Evento[],
    pessoas: ((usu.data ?? []) as { id: string; nome_completo: string | null }[])
      .filter(u => u.nome_completo)
      .map(u => ({ id: u.id, nome: u.nome_completo as string })),
    escolas,
  }
}
