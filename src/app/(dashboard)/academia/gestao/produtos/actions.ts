'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados } from '@/lib/diagnostico-auth'
import { auditar } from '@/lib/auditoria'

/** Mesma lista de quem mexe nos diagnósticos — o catálogo é a "tabela mãe" deles. */
async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  return emailsAutorizados().includes(user.email.toLowerCase()) ? user : null
}

const SEM_PERMISSAO = { ok: false as const, erro: 'Você não tem permissão para gerenciar a lista de produtos.' }

function refresh() {
  revalidatePath('/academia/gestao/produtos', 'layout')
  revalidatePath('/academia/gestao/diagnosticos', 'layout')
  revalidatePath('/diagnostico/preencher', 'layout')
  revalidatePath('/meu-diagnostico/painel', 'layout')
}

type ActionResult = { ok: true } | { ok: false; erro: string }

const SECOES = ['reutilizavel', 'consumivel'] as const
type Secao = (typeof SECOES)[number]

function numOuNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Edita um item existente — nome, descrição, categoria, link, preço e quantidade-base,
 *  os campos "iguais pra toda escola". Nunca mexe em item_key (é a FK de respostas,
 *  pareceres e compras de todas as escolas já diagnosticadas). */
export async function atualizarProduto(key: string, fd: FormData): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const categoria = String(fd.get('categoria') ?? '').trim().slice(0, 120) || null
  const titulo = String(fd.get('titulo') ?? '').trim().slice(0, 200)
  const especificacao = String(fd.get('especificacao') ?? '').trim().slice(0, 600) || null
  const unidade = String(fd.get('unidade') ?? '').trim().slice(0, 40) || null
  const referencia = String(fd.get('referencia') ?? '').trim().slice(0, 500) || null
  const qtd_recomendada = numOuNull(fd.get('qtd_recomendada'))
  const valor_ref = numOuNull(fd.get('valor_ref'))
  if (!titulo) return { ok: false, erro: 'Informe o nome do produto.' }

  const db = createAdminClient()
  const { error } = await db.from('academia_diag_itens')
    .update({ categoria, titulo, especificacao, unidade, referencia, qtd_recomendada, valor_ref })
    .eq('item_key', key)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diag_itens', key, { titulo })
  refresh()
  return { ok: true }
}

export type CriarProdutoResultado = { ok: true; key: string } | { ok: false; erro: string }

/** Cria um produto novo no catálogo mestre, com uma item_key gerada (reu-NN/con-NN).
 *  Some automaticamente em toda escola a partir daqui — sem precisar de deploy. */
export async function criarProduto(fd: FormData): Promise<CriarProdutoResultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: SEM_PERMISSAO.erro }
  const secao = String(fd.get('secao') ?? '') as Secao
  if (!SECOES.includes(secao)) return { ok: false, erro: 'Seção inválida.' }
  const titulo = String(fd.get('titulo') ?? '').trim().slice(0, 200)
  if (!titulo) return { ok: false, erro: 'Informe o nome do produto.' }
  const categoria = String(fd.get('categoria') ?? '').trim().slice(0, 120) || null
  const especificacao = String(fd.get('especificacao') ?? '').trim().slice(0, 600) || null
  const unidade = String(fd.get('unidade') ?? '').trim().slice(0, 40) || null
  const referencia = String(fd.get('referencia') ?? '').trim().slice(0, 500) || null
  const qtd_recomendada = numOuNull(fd.get('qtd_recomendada'))
  const valor_ref = numOuNull(fd.get('valor_ref'))

  const db = createAdminClient()
  const prefixo = secao === 'reutilizavel' ? 'reu-' : 'con-'
  const { data: existentes } = await db.from('academia_diag_itens').select('item_key, ordem').eq('secao', secao)
  const maiorSufixo = (existentes ?? []).reduce((m, r) => {
    const n = Number(String(r.item_key).slice(prefixo.length))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  const maiorOrdem = (existentes ?? []).reduce((m, r) => Math.max(m, r.ordem ?? 0), 0)
  const key = `${prefixo}${String(maiorSufixo + 1).padStart(2, '0')}`

  const { error } = await db.from('academia_diag_itens').insert({
    item_key: key, secao, categoria, titulo, especificacao, unidade, referencia, qtd_recomendada, valor_ref,
    ordem: maiorOrdem + 1, ativo: true,
  })
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'INSERT', 'academia_diag_itens', key, { titulo, secao })
  refresh()
  return { ok: true, key }
}

/** Arquivar = some das telas de preenchimento/análise, sem apagar — respostas, pareceres
 *  e compras já gravados por qualquer escola continuam intactos (FK em item_key). */
export async function arquivarProduto(key: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const { error } = await createAdminClient().from('academia_diag_itens').update({ ativo: false }).eq('item_key', key)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diag_itens', key, { acao: 'arquivado' })
  refresh()
  return { ok: true }
}

export async function restaurarProduto(key: string): Promise<ActionResult> {
  const user = await autorizado()
  if (!user) return SEM_PERMISSAO
  const { error } = await createAdminClient().from('academia_diag_itens').update({ ativo: true }).eq('item_key', key)
  if (error) return { ok: false, erro: error.message }
  await auditar(user, 'UPDATE', 'academia_diag_itens', key, { acao: 'restaurado' })
  refresh()
  return { ok: true }
}
