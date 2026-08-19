import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarNomeEscola } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

/**
 * Devolve os dados de um envio do formulário público (/formulario) prontos
 * para pré-popular a Calculadora. Busca direto pelo id do pré-cadastro —
 * sem tentar casar por CNPJ/nome com a tabela `escolas`, que é frágil (CNPJ
 * digitado em formatos inconsistentes). "situacao" (Novo/Renovação) é a
 * única informação que depende de achar a escola correspondente no CRM;
 * quando não acha, assume 'Novo' sem bloquear o resto.
 */
export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: p } = await admin
    .from('form_precadastro_wemake')
    .select('*')
    .eq('id', id)
    .single()

  if (!p) return NextResponse.json({ error: 'Pré-cadastro não encontrado' }, { status: 404 })

  // Prioriza as séries granulares (formulário atualizado); cai para os
  // totais agregados quando o envio é anterior à migração de séries.
  const somaGranular =
    (p.infantil4_qtd ?? 0) + (p.infantil5_qtd ?? 0) +
    (p.fund1_ano1_qtd ?? 0) + (p.fund1_ano2_qtd ?? 0) + (p.fund1_ano3_qtd ?? 0) + (p.fund1_ano4_qtd ?? 0) + (p.fund1_ano5_qtd ?? 0) +
    (p.fund2_ano6_qtd ?? 0) + (p.fund2_ano7_qtd ?? 0) + (p.fund2_ano8_qtd ?? 0) + (p.fund2_ano9_qtd ?? 0) +
    (p.medio_1s_qtd ?? 0) + (p.medio_2s_qtd ?? 0) + (p.medio_3s_qtd ?? 0)

  const somaAgregada =
    (p.alunos_infantil ?? 0) + (p.alunos_fundamental_1 ?? 0) + (p.alunos_fundamental_2 ?? 0) + (p.alunos_ensino_medio ?? 0)

  const alunos = somaGranular > 0 ? somaGranular : somaAgregada

  const ticket = p.ticket_medio
    ? parseFloat(String(p.ticket_medio).replace(/[^\d,.-]/g, '').replace(',', '.')) || null
    : null

  // Melhor esforço: tenta achar a escola correspondente no CRM só para saber
  // se já é parceira (Renovação) — não bloqueia o restante se não achar.
  let situacao: 'Novo' | 'Renovação' = 'Novo'
  const nomeAlvo = normalizarNomeEscola(p.nome_fantasia || p.razao_social)
  const { data: candidatas } = await admin
    .from('escolas')
    .select('id, nome')
    .eq('ativa', true)
    .limit(500)
  const escolaEncontrada = (candidatas ?? []).find(e => normalizarNomeEscola(e.nome) === nomeAlvo)
  if (escolaEncontrada) {
    const { data: contrato } = await admin
      .from('contratos')
      .select('contrato_assinado')
      .eq('escola_id', escolaEncontrada.id)
      .maybeSingle()
    if (contrato?.contrato_assinado) situacao = 'Renovação'
  }

  return NextResponse.json({
    escolaNome: p.nome_fantasia || p.razao_social,
    escolaEmail: p.email_institucional ?? p.resp_email ?? null,
    alunos: alunos || null,
    ticket,
    maiorSala: p.maior_sala || null,
    situacao,
    segInfantil: !!p.seg_infantil,
    segFund1: !!p.seg_fundamental_1,
    segFund2: !!p.seg_fundamental_2,
    segMedio: !!p.seg_ensino_medio,
    // "Alta complexidade" (>1 segmento) é derivada no cliente a partir desses
    // 4 booleans, sempre que os segmentos mudam — ver handleToggleSegment em
    // calculadora/page.tsx. Não calculamos aqui pra não duplicar a regra.
  })
}
