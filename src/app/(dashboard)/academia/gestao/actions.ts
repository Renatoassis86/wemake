'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARCOS } from '@/lib/academia'
import { PRIORIDADES, RISCOS, STATUS, type Implantacao, type Status } from '@/lib/academia-gestao'
import { LISTAS, getLista, prazoDoModelo } from '@/lib/academia-workspace'
import { moduloPermitido } from '@/lib/modulos'
import { carregarAssinadas } from '@/lib/academia-comercial'
import { equipeComNomes } from '@/lib/academia-equipe'

export type Resultado = { ok: true; msg?: string } | { ok: false; erro: string }

/** Só usuários logados mexem na gestão; a gravação usa o service role, como o resto da plataforma. */
async function autorizado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && moduloPermitido('academia', user.email) ? user : null
}

const txt = (v: unknown, max = 600) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s ? s.slice(0, max) : null
}
const data = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
const dentro = <T extends readonly string[]>(lista: T, v: unknown): T[number] | null =>
  typeof v === 'string' && (lista as readonly string[]).includes(v) ? (v as T[number]) : null

function refresh() {
  revalidatePath('/academia/gestao', 'layout')
}

const msgErro = (e: { message?: string } | null) => e?.message ?? 'Não foi possível salvar.'

/* ─────────────────────────────── Implantações ─────────────────────────────── */

export async function criarImplantacao(fd: FormData): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const escola_nome = txt(fd.get('escola_nome'), 160)
  if (!escola_nome) return { ok: false, erro: 'Informe o nome da escola.' }

  const db = createAdminClient()
  const { data: nova, error } = await db
    .from('academia_implantacoes')
    .insert({
      escola_id: txt(fd.get('escola_id'), 60),
      escola_nome,
      cidade_uf: txt(fd.get('cidade_uf'), 80),
      responsavel: txt(fd.get('responsavel'), 120),
      prioridade: dentro(PRIORIDADES, fd.get('prioridade')) ?? 'Normal',
      data_assinatura: data(fd.get('data_assinatura')),
      data_onboarding: data(fd.get('data_onboarding')),
      data_inicio_aulas: data(fd.get('data_inicio_aulas')),
      proxima_acao: 'Preencher a Ficha de Handoff Comercial → Implantação',
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error || !nova) return { ok: false, erro: msgErro(error) }

  if (fd.get('gerar_tarefas') === 'on') await gerarTarefasPara(nova.id)
  refresh()
  return { ok: true, msg: 'Escola cadastrada no Painel Mestre.' }
}

const CAMPOS_IMPL = new Set([
  'escola_nome', 'cidade_uf', 'responsavel', 'prioridade', 'proxima_acao', 'responsavel_acao', 'prazo',
  'risco', 'motivo_bloqueio', 'data_assinatura', 'data_onboarding', 'data_inicio_aulas', 'arquivada',
])

export async function atualizarImplantacao(id: string, patch: Record<string, unknown>): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const upd: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (!CAMPOS_IMPL.has(k)) continue
    if (k === 'prioridade') { const x = dentro(PRIORIDADES, v); if (x) upd[k] = x }
    else if (k === 'risco') { const x = dentro(RISCOS, v); if (x) upd[k] = x }
    else if (k === 'arquivada') upd[k] = v === true
    else if (k === 'prazo' || k.startsWith('data_')) upd[k] = data(v)
    else upd[k] = txt(v, k === 'motivo_bloqueio' || k === 'proxima_acao' ? 1000 : 160)
  }
  if (!Object.keys(upd).length) return { ok: true }
  const { error } = await createAdminClient().from('academia_implantacoes').update(upd).eq('id', id)
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true }
}

export async function definirMarco(id: string, marco: string, status: string): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const st = dentro(STATUS, status)
  if (!(MARCOS as readonly string[]).includes(marco) || !st) return { ok: false, erro: 'Marco ou status inválido.' }
  const db = createAdminClient()
  const { data: atual, error: e1 } = await db.from('academia_implantacoes').select('marcos').eq('id', id).single()
  if (e1 || !atual) return { ok: false, erro: msgErro(e1) }
  const marcos = { ...(atual.marcos as Record<string, Status>), [marco]: st }
  const { error } = await db.from('academia_implantacoes').update({ marcos }).eq('id', id)
  if (error) return { ok: false, erro: msgErro(error) }
  await sincronizarComercial(id, marcos)
  refresh()
  return { ok: true }
}

/**
 * A Academia é a fonte do andamento da implantação; o status do contrato no Comercial acompanha.
 * Nenhuma etapa iniciada = não iniciada · todas concluídas = concluída · o resto = em andamento.
 * Só mexe em contrato assinado e não declinado da mesma escola, e só quando o status muda.
 */
async function sincronizarComercial(implId: string, marcos: Record<string, Status>) {
  try {
    const db = createAdminClient()
    const { data: impl } = await db.from('academia_implantacoes').select('escola_id').eq('id', implId).maybeSingle()
    if (!impl?.escola_id) return
    const valores = MARCOS.map(m => marcos[m] ?? 'Não iniciado')
    const novo = valores.every(v => v === 'Concluído') ? 'concluida' : valores.every(v => v === 'Não iniciado') ? 'nao_iniciada' : 'em_andamento'
    const { data: contratos } = await db.from('contratos')
      .select('id, implantacao_status, implantacao_iniciada_em')
      .eq('escola_id', impl.escola_id).eq('contrato_assinado', true).or('declinou.is.null,declinou.eq.false')
    const agora = new Date().toISOString()
    for (const c of contratos ?? []) {
      if (c.implantacao_status === novo) continue
      const patch: Record<string, unknown> = { implantacao_status: novo }
      if (novo === 'em_andamento' && !c.implantacao_iniciada_em) patch.implantacao_iniciada_em = agora
      if (novo === 'concluida') patch.implantacao_concluida_em = agora
      else patch.implantacao_concluida_em = null
      await db.from('contratos').update(patch).eq('id', c.id)
    }
  } catch { /* a sincronização nunca deve impedir o registro do marco */ }
}

/* ─────────────────────────────────── Tarefas ──────────────────────────────── */

async function gerarTarefasPara(implId: string): Promise<number> {
  const db = createAdminClient()
  const { data: impl } = await db.from('academia_implantacoes').select('*').eq('id', implId).single()
  if (!impl) return 0
  const i = impl as Implantacao
  const { data: existentes } = await db.from('academia_tarefas').select('lista, titulo').eq('implantacao_id', implId)
  const ja = new Set((existentes ?? []).map(t => `${t.lista}::${t.titulo}`))

  const linhas: Record<string, unknown>[] = []
  let ordem = 0
  for (const l of LISTAS) {
    for (const t of l.tarefas) {
      ordem++
      if (ja.has(`${l.slug}::${t.titulo}`)) continue
      linhas.push({
        implantacao_id: implId,
        lista: l.slug,
        marco: l.marco,
        titulo: t.titulo,
        descricao: [t.descricao, `Origem: ${t.origem}.`, t.quando?.nota ? `Prazo do documento: ${t.quando.nota}.` : null].filter(Boolean).join(' '),
        prioridade: t.prioridade ?? 'Normal',
        prazo: prazoDoModelo(t, i),
        ordem,
      })
    }
  }
  if (!linhas.length) return 0
  const { error } = await db.from('academia_tarefas').insert(linhas)
  return error ? 0 : linhas.length
}

export async function gerarTarefas(implId: string): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const n = await gerarTarefasPara(implId)
  refresh()
  return { ok: true, msg: n ? `${n} tarefas criadas a partir dos documentos.` : 'Nenhuma tarefa nova: as tarefas-modelo já existem para esta escola.' }
}

export async function criarTarefa(fd: FormData): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const titulo = txt(fd.get('titulo'), 300)
  const lista = getLista(String(fd.get('lista') ?? ''))
  if (!titulo || !lista) return { ok: false, erro: 'Informe o título e a lista.' }
  const { error } = await createAdminClient().from('academia_tarefas').insert({
    implantacao_id: txt(fd.get('implantacao_id'), 60),
    lista: lista.slug,
    marco: lista.marco,
    titulo,
    descricao: txt(fd.get('descricao'), 2000),
    status: dentro(STATUS, fd.get('status')) ?? 'Não iniciado',
    prioridade: dentro(PRIORIDADES, fd.get('prioridade')) ?? 'Normal',
    responsavel: txt(fd.get('responsavel'), 120),
    prazo: data(fd.get('prazo')),
    ordem: 9999,
    created_by: user.id,
  })
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true }
}

const CAMPOS_TAREFA = new Set(['titulo', 'descricao', 'status', 'prioridade', 'responsavel', 'prazo'])

export async function atualizarTarefa(id: string, patch: Record<string, unknown>): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const upd: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (!CAMPOS_TAREFA.has(k)) continue
    if (k === 'status') {
      const x = dentro(STATUS, v)
      if (x) { upd.status = x; upd.concluida_em = x === 'Concluído' ? new Date().toISOString() : null }
    } else if (k === 'prioridade') { const x = dentro(PRIORIDADES, v); if (x) upd[k] = x }
    else if (k === 'prazo') upd[k] = data(v)
    else upd[k] = txt(v, k === 'descricao' ? 2000 : 300)
  }
  if (!Object.keys(upd).length) return { ok: true }
  const { error } = await createAdminClient().from('academia_tarefas').update(upd).eq('id', id)
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true }
}

export async function excluirTarefa(id: string): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const { error } = await createAdminClient().from('academia_tarefas').delete().eq('id', id)
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true }
}

/* ─────────────────────────────────── Agenda ───────────────────────────────── */

export async function criarEvento(fd: FormData): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const titulo = txt(fd.get('titulo'), 200)
  const dia = data(fd.get('dia'))
  if (!titulo || !dia) return { ok: false, erro: 'Informe o título e o dia.' }
  const hi = txt(fd.get('hora_inicio'), 5) ?? '09:00'
  const hf = txt(fd.get('hora_fim'), 5)
  // horário de Brasília (UTC-3)
  const inicio = new Date(`${dia}T${hi}:00-03:00`)
  const fim = hf ? new Date(`${dia}T${hf}:00-03:00`) : null
  if (Number.isNaN(inicio.getTime())) return { ok: false, erro: 'Horário inválido.' }
  const db = createAdminClient()
  const implId = txt(fd.get('implantacao_id'), 60)
  const { error } = await db.from('academia_eventos').insert({
    titulo,
    tipo: txt(fd.get('tipo'), 40) ?? 'Reunião',
    inicio: inicio.toISOString(),
    fim: fim && !Number.isNaN(fim.getTime()) ? fim.toISOString() : null,
    local: txt(fd.get('local'), 160),
    responsavel: txt(fd.get('responsavel'), 120),
    notas: txt(fd.get('notas'), 1500),
    implantacao_id: implId,
    created_by: user.id,
  })
  if (error) return { ok: false, erro: msgErro(error) }

  // espelha na Agenda geral da plataforma, ligada à escola quando ela existe no cadastro comercial
  let escolaId: string | null = null
  if (implId) {
    const { data: impl } = await db.from('academia_implantacoes').select('escola_id').eq('id', implId).maybeSingle()
    escolaId = impl?.escola_id ?? null
  }
  const resp = txt(fd.get('responsavel'), 120)
  await db.from('agenda_eventos').insert({
    titulo: `Academia · ${titulo}`,
    descricao: [txt(fd.get('notas'), 1500), resp ? `Responsável: ${resp}` : null].filter(Boolean).join(' · ') || null,
    local: txt(fd.get('local'), 160),
    tipo: 'reuniao',
    cor: '#00c8ff',
    data_inicio: inicio.toISOString(),
    data_fim: (fim && !Number.isNaN(fim.getTime()) ? fim : new Date(inicio.getTime() + 3600_000)).toISOString(),
    dia_inteiro: false,
    escola_id: escolaId,
    criado_por: user.id,
  })
  refresh()
  return { ok: true }
}

/** Traz para o Painel Mestre as escolas com contrato assinado no Comercial que ainda não estão nele. */
export async function trazerAssinadas(escolaIds?: string[]): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const db = createAdminClient()
  const [assinadas, { data: existentes }, { data: usuarios }] = await Promise.all([
    carregarAssinadas(),
    db.from('academia_implantacoes').select('escola_id'),
    db.from('usuarios').select('email, nome_completo').eq('ativo', true),
  ])
  const equipe = new Set(equipeComNomes(usuarios ?? []).map(p => p.nome))
  const jaTem = new Set((existentes ?? []).map((e: { escola_id: string | null }) => e.escola_id).filter(Boolean))
  const novas = assinadas.filter(a => !jaTem.has(a.id) && (!escolaIds || escolaIds.includes(a.id)))
  if (!novas.length) return { ok: true, msg: 'Nenhuma escola nova para trazer.' }
  const { error } = await db.from('academia_implantacoes').insert(novas.map(a => ({
    escola_id: a.id,
    escola_nome: a.nome,
    cidade_uf: a.cidade_uf || null,
    responsavel: equipe.has(a.responsavel_comercial) ? a.responsavel_comercial : null,
    proxima_acao: 'Preencher a Ficha de Handoff Comercial → Implantação',
    created_by: user.id,
  })))
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true, msg: novas.length === 1 ? '1 escola trazida para o Painel.' : `${novas.length} escolas trazidas para o Painel.` }
}

export async function excluirEvento(id: string): Promise<Resultado> {
  const user = await autorizado()
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre novamente.' }
  const { error } = await createAdminClient().from('academia_eventos').delete().eq('id', id)
  if (error) return { ok: false, erro: msgErro(error) }
  refresh()
  return { ok: true }
}
