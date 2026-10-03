'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados, gerarPin, hashPin } from '@/lib/diagnostico-auth'
import { BUCKET, CHAVES_PARECER, STATUS_DIAGNOSTICO, limparPatch, patchParaLinhasParecer, type StatusDiagnostico } from '@/lib/diagnostico'

/** Só quem está na lista (Renato e Dênis, a princípio) mexe nos diagnósticos e vê as respostas. */
async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return emailsAutorizados().includes(user.email.toLowerCase()) ? user : null
}

const SEM_PERMISSAO = { ok: false as const, erro: 'Você não tem permissão para gerenciar diagnósticos.' }
const refresh = () => revalidatePath('/academia/gestao/diagnosticos', 'layout')

export type CriarResultado = { ok: true; id: string; pin: string; token: string } | { ok: false; erro: string }

/** Cria o diagnóstico e devolve o PIN em texto UMA vez: depois só existe o hash. */
export async function criarDiagnostico(fd: FormData): Promise<CriarResultado> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const implantacaoId = String(fd.get('implantacao_id') ?? '').trim() || null
  let nome = String(fd.get('escola_nome') ?? '').trim().slice(0, 160)

  const db = createAdminClient()
  const escolaId = String(fd.get('escola_id') ?? '').trim()
  let implId = implantacaoId
  if (implantacaoId) {
    const { data } = await db.from('academia_implantacoes').select('escola_nome').eq('id', implantacaoId).maybeSingle()
    if (!data) return { ok: false, erro: 'Escola do Painel não encontrada.' }
    nome = data.escola_nome
  } else if (escolaId) {
    // escola com contrato assinado no Comercial: herda o nome e, se já houver implantação, o vínculo
    const { data } = await db.from('escolas').select('nome').eq('id', escolaId).maybeSingle()
    if (!data) return { ok: false, erro: 'Escola não encontrada no cadastro comercial.' }
    nome = data.nome
    const { data: impl } = await db.from('academia_implantacoes').select('id').eq('escola_id', escolaId).limit(1).maybeSingle()
    implId = impl?.id ?? null
  }
  if (!nome) return { ok: false, erro: 'Escolha uma escola do Painel ou digite o nome.' }

  // PIN único: tenta de novo no raríssimo caso de colisão de hash
  for (let i = 0; i < 5; i++) {
    const pin = gerarPin()
    const { data, error } = await db
      .from('academia_diagnosticos')
      .insert({ implantacao_id: implId, escola_nome: nome, pin_hash: hashPin(pin), created_by: user.id })
      .select('id, link_token')
      .single()
    if (!error && data) { refresh(); return { ok: true, id: data.id, pin, token: data.link_token } }
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
    const { data, error } = await db.from('academia_diagnosticos')
      .update({ pin_hash: hashPin(pin), expira_em: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString() })
      .eq('id', id)
      .select('link_token')
      .single()
    if (!error && data) { refresh(); return { ok: true, id, pin, token: data.link_token } }
    if (error.code !== '23505') return { ok: false, erro: error.message }
  }
  return { ok: false, erro: 'Não foi possível gerar um PIN único. Tente de novo.' }
}

export async function salvarParecer(id: string, patch: Record<string, unknown>): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const limpo = limparPatch(patch, CHAVES_PARECER)
  if (!Object.keys(limpo).length) return { ok: true }
  const { data, error } = await createAdminClient().rpc('academia_salvar_pareceres', { p_id: id, p_rows: patchParaLinhasParecer(limpo) })
  if (error) return { ok: false, erro: error.message }
  return data ? { ok: true } : { ok: false, erro: 'Diagnóstico não encontrado.' }
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

/** Exclui o diagnóstico, as respostas, os pareceres e os arquivos da escola (inclusive no storage). Não tem volta. */
export async function excluirDiagnostico(id: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const db = createAdminClient()
  const { data: arqs } = await db.from('academia_diagnostico_arquivos').select('path').eq('diagnostico_id', id)
  const paths = (arqs ?? []).map(a => a.path as string)
  if (paths.length) {
    const { error: e1 } = await db.storage.from(BUCKET).remove(paths)
    if (e1) return { ok: false, erro: `Não foi possível apagar os arquivos: ${e1.message}` }
  }
  const { error } = await db.from('academia_diagnosticos').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }
  refresh()
  return { ok: true }
}
