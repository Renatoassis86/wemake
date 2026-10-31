'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { emailsAutorizados, gerarPin, hashPin } from '@/lib/diagnostico-auth'
import { gerarSenhaNumerica, hashSenha } from '@/lib/diagnostico-portal-auth'
import { auditar } from '@/lib/auditoria'
import { BUCKET, CHAVES_COMPRAS, CHAVES_PARECER, STATUS_DIAGNOSTICO, limparPatch, patchParaLinhasCompras, patchParaLinhasParecer, type StatusDiagnostico } from '@/lib/diagnostico'

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

/** Cria o diagnóstico e devolve o PIN. Também fica salvo em texto puro (pin_atual),
 *  pra mensagem com link + PIN continuar visível na tela depois — já vai em texto
 *  puro pra escola mesmo, então não abre brecha nova guardar assim. */
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
      .insert({ implantacao_id: implId, escola_nome: nome, pin_hash: hashPin(pin), pin_atual: pin, created_by: user.id })
      .select('id, link_token')
      .single()
    if (!error && data) { await auditar(user, 'INSERT', 'academia_diagnosticos', data.id, { escola: nome }); refresh(); return { ok: true, id: data.id, pin, token: data.link_token } }
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
      .update({ pin_hash: hashPin(pin), pin_atual: pin, link_token: randomBytes(18).toString('hex'), expira_em: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString() })
      .eq('id', id)
      .select('link_token')
      .single()
    if (!error && data) { await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'novo PIN gerado' }); refresh(); return { ok: true, id, pin, token: data.link_token } }
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
  if (data) await auditar(user, 'UPDATE', 'academia_diag_pareceres', id, { campos: Object.keys(limpo) })
  return data ? { ok: true } : { ok: false, erro: 'Diagnóstico não encontrado.' }
}

export async function salvarCompras(id: string, patch: Record<string, unknown>): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const limpo = limparPatch(patch, CHAVES_COMPRAS)
  if (!Object.keys(limpo).length) return { ok: true }
  const { data, error } = await createAdminClient().rpc('academia_salvar_compras', { p_id: id, p_rows: patchParaLinhasCompras(limpo) })
  if (error) return { ok: false, erro: error.message }
  if (data) await auditar(user, 'UPDATE', 'academia_diag_compras', id, { campos: Object.keys(limpo) })
  return data ? { ok: true } : { ok: false, erro: 'Diagnóstico não encontrado.' }
}

export type SenhaPortalResultado = { ok: true; senha: string } | { ok: false; erro: string }

/** Gera uma nova senha numérica do portal da escola. Fica salva também em texto puro
 *  (portal_senha_atual), pelo mesmo motivo do pin_atual: já vai em texto puro pra
 *  escola, então reaparecer na tela do staff sem gerar outra não abre brecha nova. */
export async function definirSenhaPortal(id: string): Promise<SenhaPortalResultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: SEM_PERMISSAO.erro }
  const senha = gerarSenhaNumerica()
  const { error } = await createAdminClient()
    .from('academia_diagnosticos')
    .update({ portal_senha_hash: hashSenha(senha), portal_senha_atual: senha, portal_senha_definida_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'nova senha do portal gerada' })
  refresh()
  return { ok: true, senha }
}

/** Recalcula o hash da senha ATUAL (sem trocar a senha) a partir do segredo
 *  deste servidor — corrige acessos criados por um script local cuja chave
 *  de ambiente divergiu da de produção, sem precisar avisar a escola de novo. */
export async function corrigirHashPortal(id: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const db = createAdminClient()
  const { data, error: e0 } = await db.from('academia_diagnosticos').select('portal_senha_atual').eq('id', id).maybeSingle()
  if (e0) return { ok: false, erro: e0.message }
  if (!data?.portal_senha_atual) return { ok: false, erro: 'Nenhuma senha salva pra recalcular.' }
  const { error } = await db.from('academia_diagnosticos').update({ portal_senha_hash: hashSenha(data.portal_senha_atual) }).eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'hash da senha do portal recalculado' })
  refresh()
  return { ok: true }
}

export async function definirEmailPortal(id: string, email: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const limpo = email.trim().toLowerCase()
  if (limpo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) return { ok: false, erro: 'E-mail inválido.' }
  const { error } = await createAdminClient()
    .from('academia_diagnosticos')
    .update({ portal_email: limpo || null })
    .eq('id', id)
  if (error) return { ok: false, erro: error.code === '23505' ? 'Já existe um acesso com este e-mail.' : error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'e-mail do portal atualizado' })
  refresh()
  return { ok: true }
}

/** Nº de alunos da escola (matrícula total, do cadastro comercial) — só alimenta a
 *  sugestão de quantidade por item do modelo; nunca é inventado automaticamente. */
export async function definirNumAlunos(id: string, numAlunos: number | null): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const { error } = await createAdminClient().from('academia_diagnosticos').update({ num_alunos: numAlunos }).eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'número de alunos atualizado', num_alunos: numAlunos })
  refresh()
  return { ok: true }
}

export async function definirStatus(id: string, status: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  if (!(status in STATUS_DIAGNOSTICO)) return { ok: false, erro: 'Status inválido.' }
  const db = createAdminClient()
  const { data: antes } = await db.from('academia_diagnosticos').select('escola_nome, status').eq('id', id).maybeSingle()
  const { error } = await db.from('academia_diagnosticos').update({ status: status as StatusDiagnostico }).eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { escola: antes?.escola_nome, status }, { escola: antes?.escola_nome, status: antes?.status })
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
  const { data: antes } = await db.from('academia_diagnosticos').select('escola_nome, status').eq('id', id).maybeSingle()
  const { error } = await db.from('academia_diagnosticos').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'DELETE', 'academia_diagnosticos', id, null, { ...antes, arquivos_apagados: paths.length })
  refresh()
  return { ok: true }
}

/** Encerra o acesso da escola agora: o link e o PIN deixam de abrir e as sessões em andamento caem. */
export async function revogarAcesso(id: string): Promise<{ ok: boolean; erro?: string }> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const { error } = await createAdminClient()
    .from('academia_diagnosticos')
    .update({ expira_em: new Date().toISOString(), link_token: randomBytes(18).toString('hex'), pin_atual: null })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diagnosticos', id, { acao: 'acesso da escola encerrado' })
  refresh()
  return { ok: true }
}
