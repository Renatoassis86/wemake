'use server'

import { randomUUID } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  COOKIE_DIAGNOSTICO, SESSAO_HORAS, criarSessao, hashIp, hashPin, lerSessao, normalizarPin,
} from '@/lib/diagnostico-auth'
import {
  BUCKET, CHAVES_ANEXO, CHAVES_ESCOLA, limparPatch, mapaDeRespostas, patchParaLinhasEscola,
  type Respostas, type RespostaBanco, type StatusDiagnostico,
} from '@/lib/diagnostico'

/* Ações públicas do formulário externo. Toda ação (menos entrar) exige o cookie de sessão
   assinado, que só nasce depois de um PIN válido, e só enxerga o diagnóstico daquele PIN. */

const MAX_TAMANHO = 200 * 1024 * 1024
const MAX_POR_EVIDENCIA = 12
const MAX_TOTAL = 160

const TIPOS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'application/pdf': 'pdf',
}

export interface SessaoDiagnostico {
  id: string
  escola_nome: string
  status: StatusDiagnostico
  respostas: Respostas
  expira_em: string
}

export async function sessaoDiagnostico(): Promise<SessaoDiagnostico | null> {
  const jar = await cookies()
  const id = lerSessao(jar.get(COOKIE_DIAGNOSTICO)?.value)
  if (!id) return null
  const db = createAdminClient()
  const { data } = await db
    .from('academia_diagnosticos')
    .select('id, escola_nome, status, expira_em')
    .eq('id', id)
    .maybeSingle()
  if (!data || new Date(data.expira_em) < new Date() || data.status === 'concluido') return null
  const { data: linhas } = await db
    .from('academia_diag_respostas')
    .select('item_key, resposta, detalhe, anexo_link, observacao, possui, qtd_existente, marca_obs')
    .eq('diagnostico_id', id)
  return { ...(data as Omit<SessaoDiagnostico, 'respostas'>), respostas: mapaDeRespostas((linhas ?? []) as RespostaBanco[]) }
}

async function ipDoVisitante() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'desconhecido'
  return hashIp(ip)
}

/* ───────────────────────────────── Entrar com PIN ───────────────────────────────── */

export async function entrarComPin(_anterior: { erro?: string } | undefined, fd: FormData): Promise<{ erro?: string }> {
  const pin = normalizarPin(String(fd.get('pin') ?? ''))
  if (pin.length !== 8) return { erro: 'Digite o PIN completo, com 8 caracteres.' }

  const db = createAdminClient()
  const ip = await ipDoVisitante()

  const desde = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count } = await db
    .from('academia_pin_tentativas')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip).eq('sucesso', false).gte('criado_em', desde)
  if ((count ?? 0) >= 8) return { erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' }

  const { data } = await db.from('academia_diagnosticos').select('id, expira_em, status').eq('pin_hash', hashPin(pin)).maybeSingle()
  const ok = !!data && new Date(data.expira_em) > new Date() && data.status !== 'concluido'
  await db.from('academia_pin_tentativas').insert({ ip_hash: ip, sucesso: ok })
  if (!ok || !data) return { erro: 'PIN não encontrado ou vencido. Confira o código que a We Make enviou.' }

  const jar = await cookies()
  jar.set(COOKIE_DIAGNOSTICO, criarSessao(data.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/diagnostico',
    maxAge: SESSAO_HORAS * 3600,
  })
  redirect('/diagnostico/preencher')
}

export async function sair() {
  const jar = await cookies()
  jar.delete({ name: COOKIE_DIAGNOSTICO, path: '/diagnostico' })
  redirect('/diagnostico')
}

/* ─────────────────────────────────── Respostas ─────────────────────────────────── */

export async function salvarRespostas(patch: Record<string, unknown>): Promise<{ ok: boolean; erro?: string }> {
  const s = await sessaoDiagnostico()
  if (!s) return { ok: false, erro: 'Sessão encerrada. Entre de novo com o PIN.' }
  if (s.status === 'em_analise' || s.status === 'concluido') return { ok: false, erro: 'Este diagnóstico já está em análise pela We Make.' }
  const limpo = limparPatch(patch, CHAVES_ESCOLA)
  if (!Object.keys(limpo).length) return { ok: true }
  const { data, error } = await createAdminClient().rpc('academia_salvar_respostas', { p_id: s.id, p_rows: patchParaLinhasEscola(limpo) })
  if (error || !data) return { ok: false, erro: 'Não foi possível salvar agora. Tentaremos de novo.' }
  return { ok: true }
}

export async function enviarDiagnostico(): Promise<{ ok: boolean; erro?: string }> {
  const s = await sessaoDiagnostico()
  if (!s) return { ok: false, erro: 'Sessão encerrada. Entre de novo com o PIN.' }
  const { error } = await createAdminClient()
    .from('academia_diagnosticos')
    .update({ status: 'enviado', enviado_em: new Date().toISOString() })
    .eq('id', s.id).in('status', ['aberto', 'enviado'])
  return error ? { ok: false, erro: 'Não foi possível enviar agora.' } : { ok: true }
}

/* ─────────────────────────────────── Evidências ─────────────────────────────────── */

export interface ArquivoPublico { id: string; evidencia_key: string; nome: string; mime: string | null; tamanho: number | null }

export async function listarArquivosDaSessao(diagId: string): Promise<ArquivoPublico[]> {
  const { data } = await createAdminClient()
    .from('academia_diagnostico_arquivos')
    .select('id, evidencia_key, nome, mime, tamanho')
    .eq('diagnostico_id', diagId)
    .order('created_at')
  return (data ?? []) as ArquivoPublico[]
}

export async function pedirUpload(input: { evidencia: string; mime: string; tamanho: number }) {
  const s = await sessaoDiagnostico()
  if (!s) return { ok: false as const, erro: 'Sessão encerrada. Entre de novo com o PIN.' }
  if (s.status === 'em_analise' || s.status === 'concluido') return { ok: false as const, erro: 'Este diagnóstico já está em análise pela We Make.' }
  if (!CHAVES_ANEXO.has(input.evidencia)) return { ok: false as const, erro: 'Item inválido para anexo.' }
  const ext = TIPOS[input.mime]
  if (!ext) return { ok: false as const, erro: 'Tipo de arquivo não aceito. Envie foto (JPG, PNG, HEIC), vídeo (MP4, MOV) ou PDF.' }
  if (!(input.tamanho > 0) || input.tamanho > MAX_TAMANHO) return { ok: false as const, erro: 'O arquivo passa de 200 MB.' }

  const db = createAdminClient()
  const arquivos = await listarArquivosDaSessao(s.id)
  if (arquivos.length >= MAX_TOTAL) return { ok: false as const, erro: 'Limite de arquivos deste diagnóstico atingido.' }
  if (arquivos.filter(a => a.evidencia_key === input.evidencia).length >= MAX_POR_EVIDENCIA) {
    return { ok: false as const, erro: `Cada item aceita até ${MAX_POR_EVIDENCIA} arquivos.` }
  }

  const path = `${s.id}/${input.evidencia}/${randomUUID()}.${ext}`
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { ok: false as const, erro: 'Não foi possível preparar o envio. Tente de novo.' }
  return { ok: true as const, path, token: data.token }
}

export async function confirmarUpload(input: { path: string; evidencia: string; nome: string; mime: string }) {
  const s = await sessaoDiagnostico()
  if (!s) return { ok: false as const, erro: 'Sessão encerrada. Entre de novo com o PIN.' }
  if (!CHAVES_ANEXO.has(input.evidencia) || !input.path.startsWith(`${s.id}/${input.evidencia}/`)) return { ok: false as const, erro: 'Arquivo inválido.' }

  const db = createAdminClient()
  const pasta = input.path.split('/').slice(0, 2).join('/')
  const nomeNoStorage = input.path.split('/')[2]
  const { data: lista } = await db.storage.from(BUCKET).list(pasta, { limit: 100, search: nomeNoStorage })
  const objeto = (lista ?? []).find(o => o.name === nomeNoStorage)
  if (!objeto) return { ok: false as const, erro: 'O envio não foi concluído. Tente de novo.' }

  const nome = input.nome.replace(/[\u0000-\u001f]/g, '').slice(0, 120) || 'arquivo'
  const tamanho = Number((objeto.metadata as { size?: number } | null)?.size ?? 0) || null
  const { data, error } = await db
    .from('academia_diagnostico_arquivos')
    .insert({ diagnostico_id: s.id, evidencia_key: input.evidencia, path: input.path, nome, mime: input.mime, tamanho })
    .select('id, evidencia_key, nome, mime, tamanho')
    .single()
  if (error || !data) return { ok: false as const, erro: 'Não foi possível registrar o arquivo.' }
  await db.from('academia_diagnosticos').update({ ultima_atividade: new Date().toISOString() }).eq('id', s.id)
  return { ok: true as const, arquivo: data as ArquivoPublico }
}

export async function removerArquivo(id: string): Promise<{ ok: boolean; erro?: string }> {
  const s = await sessaoDiagnostico()
  if (!s) return { ok: false, erro: 'Sessão encerrada. Entre de novo com o PIN.' }
  if (s.status === 'em_analise' || s.status === 'concluido') return { ok: false, erro: 'Este diagnóstico já está em análise pela We Make.' }
  const db = createAdminClient()
  const { data } = await db.from('academia_diagnostico_arquivos').select('id, path').eq('id', id).eq('diagnostico_id', s.id).maybeSingle()
  if (!data) return { ok: false, erro: 'Arquivo não encontrado.' }
  await db.storage.from(BUCKET).remove([data.path])
  await db.from('academia_diagnostico_arquivos').delete().eq('id', id)
  return { ok: true }
}
