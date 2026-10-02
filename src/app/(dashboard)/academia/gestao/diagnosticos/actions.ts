'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados, gerarPin, hashPin } from '@/lib/diagnostico-auth'
import { CHAVES_PARECER, STATUS_DIAGNOSTICO, limparPatch, type StatusDiagnostico } from '@/lib/diagnostico'

/** Só quem está na lista (Renato e Dênis, a princípio) mexe nos diagnósticos e vê as respostas. */
async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return emailsAutorizados().includes(user.email.toLowerCase()) ? user : null
}

const SEM_PERMISSAO = { ok: false as const, erro: 'Você não tem permissão para gerenciar diagnósticos.' }
const refresh = () => revalidatePath('/academia/gestao/diagnosticos', 'layout')

export type CriarResultado = { ok: true; id: string; pin: string } | { ok: false; erro: string }

/** Cria o diagnóstico e devolve o PIN em texto UMA vez: depois só existe o hash. */
export async function criarDiagnostico(fd: FormData): Promise<CriarResultado> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const implantacaoId = String(fd.get('implantacao_id') ?? '').trim() || null
  let nome = String(fd.get('escola_nome') ?? '').trim().slice(0, 160)

  const db = createAdminClient()
  if (implantacaoId) {
    const { data } = await db.from('academia_implantacoes').select('escola_nome').eq('id', implantacaoId).maybeSingle()
    if (!data) return { ok: false, erro: 'Escola do Painel não encontrada.' }
    nome = data.escola_nome
  }
  if (!nome) return { ok: false, erro: 'Escolha uma escola do Painel ou digite o nome.' }

  // PIN único: tenta de novo no raríssimo caso de colisão de hash
  for (let i = 0; i < 5; i++) {
    const pin = gerarPin()
    const { data, error } = await db
      .from('academia_diagnosticos')
      .insert({ implantacao_id: implantacaoId, escola_nome: nome, pin_hash: hashPin(pin), created_by: user.id })
      .select('id')
      .single()
    if (!error && data) { refresh(); return { ok: true, id: data.id, pin } }
    if (error && error.code !== '23505') return { ok: false, erro: error.message }
  }
  return { ok: false, erro: 'Não foi possível gerar um PIN único. Tente de novo.' }
}

export async function regenerarPin(id: string): Promise<CriarResultado> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const db = createAdminClient()
  for (let i = 0; i < 5; i++) {
    const pin = gerarPin()
    const { error } = await db.from('academia_diagnosticos')
      .update({ pin_hash: hashPin(pin), expira_em: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString() })
      .eq('id', id)
    if (!error) { refresh(); return { ok: true, id, pin } }
    if (error.code !== '23505') return { ok: false, erro: error.message }
  }
  return { ok: false, erro: 'Não foi possível gerar um PIN único. Tente de novo.' }
}

export async function salvarParecer(id: string, patch: Record<string, unknown>): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const limpo = limparPatch(patch, CHAVES_PARECER)
  if (!Object.keys(limpo).length) return { ok: true }
  const db = createAdminClient()
  const { data, error: e1 } = await db.from('academia_diagnosticos').select('parecer').eq('id', id).single()
  if (e1 || !data) return { ok: false, erro: 'Diagnóstico não encontrado.' }
  const { error } = await db.from('academia_diagnosticos').update({ parecer: { ...(data.parecer as object), ...limpo } }).eq('id', id)
  return error ? { ok: false, erro: error.message } : { ok: true }
}

export async function definirStatus(id: string, status: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  if (!(status in STATUS_DIAGNOSTICO)) return { ok: false, erro: 'Status inválido.' }
  const { error } = await createAdminClient().from('academia_diagnosticos').update({ status: status as StatusDiagnostico }).eq('id', id)
  if (error) return { ok: false, erro: error.message }
  refresh()
  return { ok: true }
}
