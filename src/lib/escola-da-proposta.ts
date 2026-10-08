import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarNomeEscola } from '@/lib/utils'
import { SEGMENTOS_CONTRATO, calcTotalAlunosContrato, calcValorTotalContrato } from '@/lib/contratos'

/**
 * Garante que a escola de uma proposta exista no cadastro (`escolas`). O Funil de Contratação lê as
 * escolas cadastradas e liga a proposta a elas por `escola_id`; proposta sem escola cadastrada nunca
 * aparece no funil. Se a escola veio do formulário público (pré-cadastro), os dados dele são reaproveitados.
 * Devolve o id da escola, existente ou recém-criada.
 */
export async function garantirEscolaDaProposta(
  admin: SupabaseClient,
  nome: string,
  opts: { responsavelId?: string | null; numAlunos?: number | null; cnpj?: string | null } = {},
): Promise<string | null> {
  const alvo = normalizarNomeEscola(nome)
  if (!alvo) return null

  const digitos = (t: string | null | undefined) => (t ?? '').replace(/\D/g, '')
  const { data: existentes } = await admin.from('escolas').select('id, nome, cnpj').eq('ativa', true)
  const achada = (existentes ?? []).find(e => normalizarNomeEscola(e.nome) === alvo)
    ?? (digitos(opts.cnpj).length >= 14 ? (existentes ?? []).find(e => digitos(e.cnpj) === digitos(opts.cnpj)) : undefined)
  if (achada) return achada.id

  const { data: pres } = await admin
    .from('form_precadastro_wemake')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  const p = (pres ?? []).find(x => normalizarNomeEscola(x.nome_fantasia ?? '') === alvo || normalizarNomeEscola(x.razao_social ?? '') === alvo)

  const linha: Record<string, unknown> = { nome: nome.trim(), ativa: true }
  if (opts.responsavelId) linha.responsavel_id = opts.responsavelId
  if (opts.numAlunos) linha.total_alunos = opts.numAlunos
  if (p) {
    Object.assign(linha, {
      cnpj: p.cnpj ?? null,
      rua: p.rua ?? null,
      numero: p.numero ?? null,
      bairro: p.bairro ?? null,
      cep: p.cep ?? null,
      cidade: p.cidade ?? null,
      estado: p.estado ?? null,
      email: p.email_institucional ?? null,
      telefone: p.telefone_institucional ?? null,
      site: p.site ?? null,
      contato_nome: p.legal_nome ?? null,
    })
  }
  const { data: nova, error } = await admin.from('escolas').insert(linha).select('id').single()
  if (error) {
    console.error('[garantirEscolaDaProposta]', error.message)
    return null
  }
  return nova.id
}

/**
 * Dados do formulário chegaram: cadastra a escola (se for nova) e marca "formulário recebido" no contrato,
 * o que coloca a escola no Funil de Contratação, no quadro "Dados para a Proposta". Só liga flags,
 * nunca desliga: uma escola mais adiantada no funil continua onde está.
 */
export async function registrarFormularioNoFunil(
  admin: SupabaseClient,
  nome: string,
  opts: { cnpj?: string | null; numAlunos?: number | null } = {},
): Promise<string | null> {
  const escolaId = await garantirEscolaDaProposta(admin, nome, opts)
  if (!escolaId) return null
  const { data: contrato } = await admin.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()
  const flags = { formulario_enviado: true, formulario_recebido: true }
  const { error } = contrato
    ? await admin.from('contratos').update(flags).eq('id', contrato.id)
    : await admin.from('contratos').insert({ escola_id: escolaId, ...flags })
  if (error) console.error('[registrarFormularioNoFunil]', error.message)
  return escolaId
}

/**
 * Contrato assinado sem valor: copia o valor por aluno/ano da proposta da escola para todas as séries.
 * Só age quando as propostas ativas da escola têm UM único valor (se houver mais de um, não dá para saber
 * qual foi aceita e a equipe comercial escolhe). Nunca sobrescreve um contrato que já tem valor.
 * Devolve o valor aplicado, ou null se nada foi feito.
 */
export async function preencherValorDaProposta(admin: SupabaseClient, escolaId: string): Promise<number | null> {
  const { data: contrato } = await admin.from('contratos').select('*').eq('escola_id', escolaId).maybeSingle()
  if (!contrato || calcValorTotalContrato(contrato) > 0 || calcTotalAlunosContrato(contrato) === 0) return null
  const { data: escola } = await admin.from('escolas').select('nome').eq('id', escolaId).maybeSingle()
  const alvo = normalizarNomeEscola(escola?.nome ?? '')
  const { data: props } = await admin.from('propostas').select('escola_id, escola_nome, valor_aluno_ano').is('arquivada_em', null)
  const valores = [...new Set(
    (props ?? [])
      .filter(p => p.escola_id === escolaId || (!p.escola_id && alvo && normalizarNomeEscola(p.escola_nome ?? '') === alvo))
      .map(p => Number(p.valor_aluno_ano))
      .filter(v => Number.isFinite(v) && v > 0),
  )]
  if (valores.length !== 1) return null
  const patch: Record<string, number> = {}
  for (const [, valKey] of SEGMENTOS_CONTRATO) patch[valKey] = valores[0]
  const { error } = await admin.from('contratos').update(patch).eq('id', contrato.id)
  if (error) {
    console.error('[preencherValorDaProposta]', error.message)
    return null
  }
  return valores[0]
}
