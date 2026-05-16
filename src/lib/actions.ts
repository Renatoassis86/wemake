'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcPotencial, calcProbabilidade, calcClassificacao } from '@/types/database'
import type { StageNegociacao } from '@/types/database'

// ─── Tipos de retorno das actions (para uso em Client Components) ─────────────

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Audit Log Helper ─────────────────────────────────────────────────────────

async function createAuditLog(action: 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, recordId: string | null, newData: any = null, oldData: any = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action,
    table_name: tableName,
    record_id: recordId,
    new_data: newData,
    old_data: oldData,
  })
}

// ─── Escola ────────────────────────────────────────────────────────────────────

export async function upsertEscola(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string | null

  const payload = {
    nome:               formData.get('nome') as string,
    cnpj:               formData.get('cnpj') as string || null,
    perfil_pedagogico:  formData.get('perfil_pedagogico') as string || 'convencional',
    escola_paideia:     formData.get('escola_paideia') === 'true',
    rua:                formData.get('rua') as string || null,
    numero:             formData.get('numero') as string || null,
    complemento:        formData.get('complemento') as string || null,
    bairro:             formData.get('bairro') as string || null,
    cidade:             formData.get('cidade') as string || null,
    estado:             (formData.get('estado') as string || '').toUpperCase() || null,
    cep:                formData.get('cep') as string || null,
    telefone:           formData.get('telefone') as string || null,
    email:              formData.get('email') as string || null,
    site:               formData.get('site') as string || null,
    contato_nome:       formData.get('contato_nome') as string || null,
    contato_cargo:      formData.get('contato_cargo') as string || null,
    diretor_nome:       formData.get('diretor_nome') as string || null,
    qtd_infantil2: parseInt(formData.get('qtd_infantil2') as string) || 0,
    qtd_infantil3: parseInt(formData.get('qtd_infantil3') as string) || 0,
    qtd_infantil4: parseInt(formData.get('qtd_infantil4') as string) || 0,
    qtd_infantil5: parseInt(formData.get('qtd_infantil5') as string) || 0,

    qtd_fund1_ano1: parseInt(formData.get('qtd_fund1_ano1') as string) || 0,
    qtd_fund1_ano2: parseInt(formData.get('qtd_fund1_ano2') as string) || 0,
    qtd_fund1_ano3: parseInt(formData.get('qtd_fund1_ano3') as string) || 0,
    qtd_fund1_ano4: parseInt(formData.get('qtd_fund1_ano4') as string) || 0,
    qtd_fund1_ano5: parseInt(formData.get('qtd_fund1_ano5') as string) || 0,

    qtd_fund2_ano6: parseInt(formData.get('qtd_fund2_ano6') as string) || 0,
    qtd_fund2_ano7: parseInt(formData.get('qtd_fund2_ano7') as string) || 0,
    qtd_fund2_ano8: parseInt(formData.get('qtd_fund2_ano8') as string) || 0,
    qtd_fund2_ano9: parseInt(formData.get('qtd_fund2_ano9') as string) || 0,

    qtd_medio_1s: parseInt(formData.get('qtd_medio_1s') as string) || 0,
    qtd_medio_2s: parseInt(formData.get('qtd_medio_2s') as string) || 0,
    qtd_medio_3s: parseInt(formData.get('qtd_medio_3s') as string) || 0,

    // Totais por segmento: usa valor direto (formulário simplificado) ou soma das turmas
    get qtd_infantil() {
      const direto = parseInt(formData.get('qtd_infantil') as string) || 0
      const soma   = (parseInt(formData.get('qtd_infantil2') as string) || 0)
                   + (parseInt(formData.get('qtd_infantil3') as string) || 0)
                   + (parseInt(formData.get('qtd_infantil4') as string) || 0)
                   + (parseInt(formData.get('qtd_infantil5') as string) || 0)
      return soma > 0 ? soma : direto
    },
    get qtd_fund1() {
      const direto = parseInt(formData.get('qtd_fund1') as string) || 0
      const soma   = (parseInt(formData.get('qtd_fund1_ano1') as string) || 0)
                   + (parseInt(formData.get('qtd_fund1_ano2') as string) || 0)
                   + (parseInt(formData.get('qtd_fund1_ano3') as string) || 0)
                   + (parseInt(formData.get('qtd_fund1_ano4') as string) || 0)
                   + (parseInt(formData.get('qtd_fund1_ano5') as string) || 0)
      return soma > 0 ? soma : direto
    },
    get qtd_fund2() {
      const direto = parseInt(formData.get('qtd_fund2') as string) || 0
      const soma   = (parseInt(formData.get('qtd_fund2_ano6') as string) || 0)
                   + (parseInt(formData.get('qtd_fund2_ano7') as string) || 0)
                   + (parseInt(formData.get('qtd_fund2_ano8') as string) || 0)
                   + (parseInt(formData.get('qtd_fund2_ano9') as string) || 0)
      return soma > 0 ? soma : direto
    },
    get qtd_medio() {
      const direto = parseInt(formData.get('qtd_medio') as string) || 0
      const soma   = (parseInt(formData.get('qtd_medio_1s') as string) || 0)
                   + (parseInt(formData.get('qtd_medio_2s') as string) || 0)
                   + (parseInt(formData.get('qtd_medio_3s') as string) || 0)
      return soma > 0 ? soma : direto
    },
    // Apenas valores válidos no enum PostgreSQL — fallback para null se inválido
    origem_lead: (() => {
      const v = formData.get('origem_lead') as string
      const VALIDOS = ['feira','instagram','network','site','whatsapp','email','telefone','visita','evento','parceiro','outro']
      return v && VALIDOS.includes(v) ? v : null
    })(),
    responsavel_id:     formData.get('responsavel_id') as string || null,
    observacoes:        formData.get('observacoes') as string || null,
    updated_by:         user.id,
  }

  if (id) {
    // EDIÇÃO: atualiza escola existente
    const { error } = await supabase.from('escolas').update(payload).eq('id', id)
    if (error) throw new Error(error.message)

    await createAuditLog('UPDATE', 'escolas', id, payload)

    revalidatePath(`/comercial/escolas/${id}`, 'layout')
    revalidatePath('/comercial/escolas', 'layout')
    redirect(`/comercial/escolas/${id}?t=${Date.now()}`)
  } else {
    // NOVO CADASTRO: insere nova escola no CRM (tabela escolas)
    const { data, error } = await supabase
      .from('escolas')
      .insert({ ...payload, created_by: user.id, ativa: true })
      .select('id')
      .single()
    if (error) throw new Error(error.message)

    const newId = data.id

    await createAuditLog('INSERT', 'escolas', newId, payload)

    // Garante que a escola seja visível imediatamente (força refresh)
    revalidatePath('/comercial/escolas', 'layout')
    revalidatePath('/comercial', 'layout')
    revalidatePath('/', 'layout')

    redirect(`/comercial/escolas/${newId}?t=${Date.now()}`)
  }
}

// ─── Deletar Escola ────────────────────────────────────────────────────────────

export async function deletarEscola(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  try {
    // Soft delete: marca como inativa em vez de deletar (preserva histórico)
    const { error } = await supabase
      .from('escolas')
      .update({ ativa: false, updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await createAuditLog('DELETE', 'escolas', id, { ativa: false })

    // Revalida múltiplos paths para garantir dados frescos
    revalidatePath('/comercial/escolas', 'layout')
    revalidatePath('/comercial/escolas/[id]', 'layout')
    revalidatePath('/comercial/pipeline', 'layout')
    revalidatePath('/comercial/leads', 'layout')
    revalidatePath('/comercial', 'layout')

    return { success: true, id }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Erro ao excluir escola' }
  }
}

// ─── Registro ──────────────────────────────────────────────────────────────────

export async function upsertRegistro(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id         = formData.get('id') as string | null
  const escola_id  = formData.get('escola_id') as string
  const enc        = formData.getAll('encaminhamentos') as string[]
  
  // Granulares
  const q_i2 = parseInt(formData.get('qtd_infantil2') as string) || 0
  const q_i3 = parseInt(formData.get('qtd_infantil3') as string) || 0
  const q_i4 = parseInt(formData.get('qtd_infantil4') as string) || 0
  const q_i5 = parseInt(formData.get('qtd_infantil5') as string) || 0
  const q_f1_a1 = parseInt(formData.get('qtd_fund1_ano1') as string) || 0
  const q_f1_a2 = parseInt(formData.get('qtd_fund1_ano2') as string) || 0
  const q_f1_a3 = parseInt(formData.get('qtd_fund1_ano3') as string) || 0
  const q_f1_a4 = parseInt(formData.get('qtd_fund1_ano4') as string) || 0
  const q_f1_a5 = parseInt(formData.get('qtd_fund1_ano5') as string) || 0

  const qtd_inf    = q_i2 + q_i3 + q_i4 + q_i5
  const qtd_f1     = q_f1_a1 + q_f1_a2 + q_f1_a3 + q_f1_a4 + q_f1_a5
  const qtd_f2     = parseInt(formData.get('qtd_fund2') as string) || 0
  const qtd_med    = parseInt(formData.get('qtd_medio') as string) || 0
  
  const interesse  = formData.get('interesse') as string || 'medio'
  const prontidao  = formData.get('prontidao') as string || 'esperando_retorno'
  const abertura   = formData.get('abertura') as string || 'media'

  const pot  = calcPotencial(qtd_inf, qtd_f1, qtd_f2, qtd_med)
  const prob = calcProbabilidade(interesse, prontidao, abertura, enc)
  const cls  = calcClassificacao(prob, pot)

  const payload = {
    escola_id,
    negociacao_id:        formData.get('negociacao_id') as string || null,
    data_contato:         formData.get('data_contato') as string,
    hora_contato:         formData.get('hora_contato') as string || null,
    meio_contato:         formData.get('meio_contato') as string || 'whatsapp',
    resumo:               formData.get('resumo') as string,
    responsavel_id:       formData.get('responsavel_id') as string || user.id,
    contato_nome:         formData.get('contato_nome') as string || null,
    contato_cargo:        formData.get('contato_cargo') as string || null,
    interesse,
    prontidao,
    abertura,
    encaminhamentos:      enc,
    qtd_infantil:         qtd_inf,
    qtd_fund1:            qtd_f1,
    qtd_fund2:            qtd_f2,
    qtd_medio:            qtd_med,
    potencial_financeiro: pot,
    probabilidade:        prob,
    classificacao:        cls,
    proximo_contato:      formData.get('proximo_contato') as string || null,
    notas_internas:       formData.get('notas_internas') as string || null,
  }

  // 1. Salvar o registro
  let registroId = id
  if (id) {
    const { error } = await supabase.from('registros').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase
      .from('registros')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    registroId = data.id
  }

  // 2. Atualizar a escola com os novos dados (se houver alteração significativa ou for novo registro)
  // Sincronizamos os granulares também para manter a integridade
  if (qtd_inf > 0 || qtd_f1 > 0 || qtd_f2 > 0 || qtd_med > 0) {
    await supabase.from('escolas').update({
      qtd_infantil:   qtd_inf,
      qtd_infantil2:  q_i2,
      qtd_infantil3:  q_i3,
      qtd_infantil4:  q_i4,
      qtd_infantil5:  q_i5,
      qtd_fund1:      qtd_f1,
      qtd_fund1_ano1: q_f1_a1,
      qtd_fund1_ano2: q_f1_a2,
      qtd_fund1_ano3: q_f1_a3,
      qtd_fund1_ano4: q_f1_a4,
      qtd_fund1_ano5: q_f1_a5,
      qtd_fund2:      qtd_f2,
      qtd_medio:      qtd_med,
    }).eq('id', escola_id)
  }

  await createAuditLog(id ? 'UPDATE' : 'INSERT', 'registros', registroId, payload)

  // Revalida todos os paths que usam registros
  revalidatePath(`/comercial/escolas/${escola_id}`, 'layout')
  revalidatePath(`/comercial/escolas/${escola_id}/editar`, 'layout')
  revalidatePath('/comercial', 'layout')
  revalidatePath('/comercial/jornada', 'layout')
  revalidatePath('/comercial/jornada-visual', 'layout')
  revalidatePath('/comercial/registros', 'layout')
  revalidatePath('/comercial/registros/novo', 'layout')
  revalidatePath('/comercial/leads', 'layout')
  revalidatePath('/comercial/tabela', 'layout')
  revalidatePath('/comercial/pipeline', 'layout')

  redirect(`/comercial/escolas/${escola_id}?t=${Date.now()}`)
}

/**
 * Deleta um registro individual.
 * Apenas o criador ou supervisores podem deletar (verificado via RLS).
 * Retorna ActionResult para uso em Client Components (sem redirect).
 */
export async function deleteRegistro(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Busca o escola_id antes de deletar para revalidar o path correto
  const { data: registro, error: fetchError } = await supabase
    .from('registros')
    .select('id, escola_id')
    .eq('id', id)
    .single()

  if (fetchError || !registro) {
    return { success: false, error: 'Registro não encontrado' }
  }

  // RLS Policy no banco valida a permissão
  const { error: deleteError } = await supabase.from('registros').delete().eq('id', id)
  if (deleteError) return { success: false, error: deleteError.message }

  await createAuditLog('DELETE', 'registros', id, null, registro)

  // Revalida todos os paths que usam registros
  revalidatePath(`/comercial/escolas/${registro.escola_id}`, 'layout')
  revalidatePath(`/comercial/escolas/${registro.escola_id}/editar`, 'layout')
  revalidatePath('/comercial', 'layout')
  revalidatePath('/comercial/registros', 'layout')
  revalidatePath('/comercial/jornada', 'layout')
  revalidatePath('/comercial/jornada-visual', 'layout')
  revalidatePath('/comercial/leads', 'layout')
  revalidatePath('/comercial/tabela', 'layout')
  revalidatePath('/comercial/pipeline', 'layout')

  return { success: true, id }
}

// ─── Negociação ────────────────────────────────────────────────────────────────

/**
 * Cria ou edita uma negociação (upsert).
 *
 * Se `formData` contém `id`, faz UPDATE; caso contrário, INSERT.
 * Após salvar, redireciona para a escola vinculada.
 */
export async function upsertNegociacao(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id        = formData.get('id') as string | null
  const escola_id = formData.get('escola_id') as string

  if (!escola_id) throw new Error('escola_id é obrigatório')

  const valorRaw = parseFloat(formData.get('valor_estimado') as string)
  const probRaw  = parseInt(formData.get('probabilidade') as string)

  const payload = {
    escola_id,
    titulo:              formData.get('titulo') as string || null,
    stage:               (formData.get('stage') as StageNegociacao) || 'prospeccao',
    responsavel_id:      formData.get('responsavel_id') as string || user.id,
    valor_estimado:      isNaN(valorRaw) ? null : valorRaw,
    probabilidade:       isNaN(probRaw) ? 0 : Math.min(100, Math.max(0, probRaw)),
    previsao_fechamento: formData.get('previsao_fechamento') as string || null,
    motivo_perda:        formData.get('motivo_perda') as string || null,
    ativa:               formData.get('ativa') !== 'false',
    observacoes:         formData.get('observacoes') as string || null,
  }

  if (id) {
    const { error } = await supabase
      .from('negociacoes')
      .update(payload)
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('negociacoes')
      .insert({ ...payload, created_by: user.id })
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/comercial/escolas/${escola_id}`, 'layout')
  revalidatePath('/comercial/pipeline', 'layout')
  revalidatePath('/comercial', 'layout')
  redirect(`/comercial/escolas/${escola_id}?t=${Date.now()}`)
}

/**
 * Atualiza o stage de uma negociação.
 * Pensado para drag-and-drop no Kanban ou botões de stage rápidos.
 * Não redireciona — retorna ActionResult.
 */
export async function updateStageNegociacao(
  id: string,
  stage: StageNegociacao,
  options?: { motivo_perda?: string }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const updatePayload: Record<string, unknown> = { stage }

  // Se fechando como perdido, registra o motivo
  if (stage === 'perdido' && options?.motivo_perda) {
    updatePayload.motivo_perda = options.motivo_perda
  }

  // Ao marcar ganho ou perdido, desativa a negociação do pipeline ativo
  if (stage === 'ganho' || stage === 'perdido') {
    updatePayload.ativa = false
  }

  const { data: negociacao, error: fetchError } = await supabase
    .from('negociacoes')
    .select('id, escola_id')
    .eq('id', id)
    .single()

  if (fetchError || !negociacao) {
    return { success: false, error: 'Negociação não encontrada' }
  }

  const { error } = await supabase
    .from('negociacoes')
    .update(updatePayload)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/comercial/escolas/${negociacao.escola_id}`)
  revalidatePath('/comercial/pipeline')
  revalidatePath('/comercial')

  return { success: true, id }
}

/**
 * Deleta uma negociação (apenas gerente/supervisor ou dono).
 * Retorna ActionResult.
 */
export async function deleteNegociacao(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: negociacao, error: fetchError } = await supabase
    .from('negociacoes')
    .select('id, escola_id')
    .eq('id', id)
    .single()

  if (fetchError || !negociacao) {
    return { success: false, error: 'Negociação não encontrada' }
  }

  // RLS Policy no banco valida a permissão
  const { error } = await supabase.from('negociacoes').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/comercial/escolas/${negociacao.escola_id}`)
  revalidatePath('/comercial/pipeline')
  revalidatePath('/comercial')

  return { success: true, id }
}

// ─── Tarefa ────────────────────────────────────────────────────────────────────

export async function criarTarefa(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const escola_id = formData.get('escola_id') as string

  const { error } = await supabase.from('tarefas').insert({
    escola_id,
    negociacao_id:  formData.get('negociacao_id') as string || null,
    titulo:         formData.get('titulo') as string,
    descricao:      formData.get('descricao') as string || null,
    responsavel_id: formData.get('responsavel_id') as string || user.id,
    vencimento:     formData.get('vencimento') as string || null,
    prioridade:     formData.get('prioridade') as string || 'media',
    created_by:     user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/comercial/escolas/${escola_id}`)
  revalidatePath('/comercial')
}

/**
 * Conclui uma tarefa pendente.
 * Já existia — mantida com tratamento de erro melhorado.
 */
export async function concluirTarefa(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Busca escola_id para revalidar o path correto
  const { data: tarefa } = await supabase
    .from('tarefas')
    .select('id, escola_id, status')
    .eq('id', id)
    .single()

  if (!tarefa) return { success: false, error: 'Tarefa não encontrada' }
  if (tarefa.status === 'concluida') return { success: true, id } // idempotente

  const { error } = await supabase
    .from('tarefas')
    .update({ status: 'concluida', concluida_em: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/comercial/escolas/${tarefa.escola_id}`)
  revalidatePath('/comercial')

  return { success: true, id }
}

/**
 * Cancela uma tarefa (sem excluir — mantém histórico).
 */
export async function cancelarTarefa(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: tarefa } = await supabase
    .from('tarefas')
    .select('id, escola_id')
    .eq('id', id)
    .single()

  if (!tarefa) return { success: false, error: 'Tarefa não encontrada' }

  const { error } = await supabase
    .from('tarefas')
    .update({ status: 'cancelada' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/comercial/escolas/${tarefa.escola_id}`)
  revalidatePath('/comercial')

  return { success: true, id }
}

// ─── Nota ──────────────────────────────────────────────────────────────────────

export async function criarNota(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const escola_id = formData.get('escola_id') as string

  const { error } = await supabase.from('notas_escola').insert({
    escola_id,
    texto:      formData.get('texto') as string,
    fixada:     formData.get('fixada') === 'true',
    created_by: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/comercial/escolas/${escola_id}`)
}

export async function deletarNota(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: nota } = await supabase
    .from('notas_escola')
    .select('id, escola_id, created_by')
    .eq('id', id)
    .single()

  if (!nota) return { success: false, error: 'Nota não encontrada' }

  // Apenas o criador pode deletar notas
  if (nota.created_by !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Sem permissão para deletar esta nota' }
    }
  }

  const { error } = await supabase.from('notas_escola').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/comercial/escolas/${nota.escola_id}`)
  return { success: true, id }
}

// ─── Contrato ──────────────────────────────────────────────────────────────────

export async function upsertContrato(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const escola_id = formData.get('escola_id') as string

  const toNum = (k: string) => parseFloat(formData.get(k) as string) || 0

  const payload = {
    escola_id,
    formulario_enviado:   formData.get('formulario_enviado') === 'true',
    formulario_recebido:  formData.get('formulario_recebido') === 'true',
    minuta_enviada:       formData.get('minuta_enviada') === 'true',
    retorno_minuta:       formData.get('retorno_minuta') === 'true',
    observacao_minuta:    formData.get('observacao_minuta') as string || null,
    minuta_atualizada:    formData.get('minuta_atualizada') === 'true',
    contrato_enviado:     formData.get('contrato_enviado') === 'true',
    contrato_assinado:    formData.get('contrato_assinado') === 'true',
    contrato_arquivado:   formData.get('contrato_arquivado') === 'true',
    encaminhamento_final: formData.get('encaminhamento_final') as string || null,
    infantil2_qtd:    toNum('infantil2_qtd'),
    infantil2_valor:  toNum('infantil2_valor'),
    infantil3_qtd:    toNum('infantil3_qtd'),
    infantil3_valor:  toNum('infantil3_valor'),
    infantil4_qtd:    toNum('infantil4_qtd'),
    infantil4_valor:  toNum('infantil4_valor'),
    infantil5_qtd:    toNum('infantil5_qtd'),
    infantil5_valor:  toNum('infantil5_valor'),
    fund1_ano1_qtd:   toNum('fund1_ano1_qtd'),
    fund1_ano1_valor: toNum('fund1_ano1_valor'),
    fund1_ano2_qtd:   toNum('fund1_ano2_qtd'),
    fund1_ano2_valor: toNum('fund1_ano2_valor'),
    fund1_ano3_qtd:   toNum('fund1_ano3_qtd'),
    fund1_ano3_valor: toNum('fund1_ano3_valor'),
    fund1_ano4_qtd:   toNum('fund1_ano4_qtd'),
    fund1_ano4_valor: toNum('fund1_ano4_valor'),
    fund1_ano5_qtd:   toNum('fund1_ano5_qtd'),
    fund1_ano5_valor: toNum('fund1_ano5_valor'),
    tempo_contrato:   parseInt(formData.get('tempo_contrato') as string) || 1,
    created_by: user.id,
  }

  // UPSERT por escola_id
  const { data: existing } = await supabase
    .from('contratos')
    .select('id')
    .eq('escola_id', escola_id)
    .single()

  const { error } = existing
    ? await supabase.from('contratos').update(payload).eq('id', existing.id)
    : await supabase.from('contratos').insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath('/comercial/contratos')
  redirect(`/comercial/contratos?escola=${escola_id}`)
}

// ─── Formulário público We Make (sem auth) ────────────────────────────────────

/**
 * Envia formulário de pré-cadastro de escolas para We Make
 * Salva na tabela form_precadastro_wemake
 */
export async function enviarFormularioPublico(formData: FormData): Promise<ActionResult> {
  try {
    // Server-side action — usa service_role para gravar com seguranca
    // (bypassa RLS). Como roda no servidor, a chave nunca é exposta.
    const supabase = createAdminClient()
    console.log('[enviarFormularioPublico] using admin client (service_role)')

    const toNum = (k: string) => parseInt(formData.get(k) as string) || 0

    // Dados da seção 1: Responsável
    const resp_email = formData.get('resp_email') as string

    // Dados da seção 2: Escola
    const cnpj = formData.get('cnpj') as string || null
    const razao_social = formData.get('razao_social') as string
    const nome_fantasia = formData.get('nome_fantasia') as string
    const rua = formData.get('rua') as string
    const numero = formData.get('numero') as string
    const bairro = formData.get('bairro') as string
    const cep = formData.get('cep') as string || null
    const cidade = formData.get('cidade') as string
    const estado = formData.get('estado') as string
    const email_institucional = formData.get('email_institucional') as string

    // Dados da seção 3: Segmentos
    const seg_infantil = formData.get('seg_infantil') === 'on'
    const seg_fundamental_1 = formData.get('seg_fundamental_1') === 'on'
    const seg_fundamental_2 = formData.get('seg_fundamental_2') === 'on'
    const seg_ensino_medio = formData.get('seg_ensino_medio') === 'on'

    // Quantidade de alunos
    const alunos_infantil = toNum('alunos_infantil')
    const alunos_fundamental_1 = toNum('alunos_fundamental_1')
    const alunos_fundamental_2 = toNum('alunos_fundamental_2')
    const alunos_ensino_medio = toNum('alunos_ensino_medio')

    // Datas e formato
    const data_inicio_letivo = formData.get('data_inicio_letivo') as string || null
    const data_fim_letivo = formData.get('data_fim_letivo') as string || null
    const formato_ano_letivo = formData.get('formato_ano_letivo') as string || null
    const observacoes = formData.get('observacoes') as string || null

    // Dados da seção 4: Representante Legal
    const legal_nome = formData.get('legal_nome') as string
    const legal_cpf = formData.get('legal_cpf') as string || null
    const legal_email = formData.get('legal_email') as string
    const legal_whatsapp = formData.get('legal_whatsapp') as string || null
    const legal_rua = formData.get('legal_rua') as string
    const legal_numero = formData.get('legal_numero') as string
    const legal_complemento = formData.get('legal_complemento') as string || null
    const legal_bairro = formData.get('legal_bairro') as string
    const legal_cidade = formData.get('legal_cidade') as string
    const legal_estado = formData.get('legal_estado') as string
    const legal_cep = formData.get('legal_cep') as string || null

    // Dados da seção 5: Financeiro
    const fin_email_cobranca = formData.get('fin_email_cobranca') as string
    const ticket_medio = formData.get('ticket_medio') as string || null

    const payload = {
      resp_email,
      cnpj,
      razao_social,
      nome_fantasia,
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      email_institucional,
      seg_infantil,
      seg_fundamental_1,
      seg_fundamental_2,
      seg_ensino_medio,
      alunos_infantil,
      alunos_fundamental_1,
      alunos_fundamental_2,
      alunos_ensino_medio,
      data_inicio_letivo,
      data_fim_letivo,
      formato_ano_letivo,
      observacoes,
      legal_nome,
      legal_cpf,
      legal_email,
      legal_whatsapp,
      legal_rua,
      legal_numero,
      legal_complemento,
      legal_bairro,
      legal_cidade,
      legal_estado,
      legal_cep,
      fin_email_cobranca,
      ticket_medio,
      status: 'pendente',
    }

    const { data: inserted, error } = await supabase
      .from('form_precadastro_wemake')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('[enviarFormularioPublico] INSERT failed:', error)
      return { success: false, error: `Erro ao salvar: ${error.message}` }
    }
    if (!inserted?.id) {
      console.error('[enviarFormularioPublico] INSERT returned no id')
      return { success: false, error: 'Não foi possível confirmar o registro no banco.' }
    }

    return { success: true, id: String(inserted.id) }
  } catch (err: any) {
    console.error('[enviarFormularioPublico] Exception:', err)
    return { success: false, error: err?.message ?? 'Erro ao enviar formulário' }
  }
}

// ─── Usuários (gerente only) ─────────────────────────────────────────────────

/**
 * Cria um novo usuário no Supabase Auth + perfil no banco.
 * Usa a service role (admin client) para criar a conta.
 */
export async function criarUsuario(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'gerente') return { success: false, error: 'Apenas gerentes podem criar usuários' }

  const email    = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role     = formData.get('role') as string || 'consultor'
  const isActive = formData.get('is_active') !== 'false'
  const phone    = formData.get('phone') as string || null
  const password = formData.get('password') as string || 'Senha@2026'   // senha temporária

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // 1. Verificar se já existe no Auth
  const { data: lista } = await admin.auth.admin.listUsers()
  const jaExiste = lista?.users?.find(u => u.email === email)

  let userId: string

  if (jaExiste) {
    userId = jaExiste.id
    // Atualizar metadata se necessário
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: fullName },
    })
  } else {
    // Criar novo usuário no Auth
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (authErr) return { success: false, error: authErr.message }
    userId = authData.user.id
  }

  // 2. Criar/atualizar perfil
  const { error: profileErr } = await admin.from('profiles').upsert({
    id:        userId,
    email,
    full_name: fullName,
    role,
    is_active: isActive,
    phone,
  }, { onConflict: 'id' })

  if (profileErr) return { success: false, error: profileErr.message }

  revalidatePath('/adminpanel')
  return { success: true, id: userId }
}

/**
 * Atualiza perfil de usuário existente.
 */
export async function upsertProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'gerente') return { success: false, error: 'Sem permissão' }

  const email    = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role     = formData.get('role') as string
  const isActive = formData.get('is_active') === 'true'
  const phone    = formData.get('phone') as string || null

  // Verificar se o profile existe
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single()

  if (!existing) {
    // Profile não existe — redirecionar para criarUsuario
    return { success: false, error: `Usuário com e-mail "${email}" não existe. Use "Criar Novo Usuário".` }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, role, is_active: isActive, phone })
    .eq('email', email)

  if (error) return { success: false, error: error.message }
  revalidatePath('/adminpanel')
  return { success: true }
}
