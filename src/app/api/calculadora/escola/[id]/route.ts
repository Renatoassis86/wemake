import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarNomeEscola } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

/**
 * Devolve os melhores dados disponíveis para pré-popular a Calculadora a
 * partir de uma escola já cadastrada — form_precadastro_wemake (mais preciso,
 * vem do formulário oficial) > propostas mais recente > cadastro da escola.
 */
export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: escola } = await supabase
    .from('escolas')
    .select('id, nome, email, cnpj, qtd_infantil, qtd_fund1, qtd_fund2, qtd_medio, total_alunos')
    .eq('id', id)
    .single()

  if (!escola) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

  // form_precadastro_wemake não tem escola_id — casa por CNPJ (preferencial)
  // ou por nome normalizado (fallback, mesmo padrão de priorizacao.ts/funil-contratacao.ts)
  let precadastro: any = null
  if (escola.cnpj) {
    const { data } = await admin
      .from('form_precadastro_wemake')
      .select('*')
      .eq('cnpj', escola.cnpj)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    precadastro = data
  }
  if (!precadastro) {
    const { data: candidatos } = await admin
      .from('form_precadastro_wemake')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    precadastro = (candidatos ?? []).find(
      (p: any) => normalizarNomeEscola(p.nome_fantasia ?? p.razao_social) === normalizarNomeEscola(escola.nome)
    ) ?? null
  }

  const { data: propostaRecente } = await supabase
    .from('propostas')
    .select('num_alunos, valor_aluno_ano')
    .eq('escola_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: contrato } = await admin
    .from('contratos')
    .select('contrato_assinado')
    .eq('escola_id', id)
    .maybeSingle()

  const alunos =
    (precadastro
      ? (precadastro.alunos_infantil ?? 0) + (precadastro.alunos_fundamental_1 ?? 0) + (precadastro.alunos_fundamental_2 ?? 0) + (precadastro.alunos_ensino_medio ?? 0)
      : 0) || propostaRecente?.num_alunos || escola.total_alunos || null

  const ticket = precadastro?.ticket_medio
    ? parseFloat(String(precadastro.ticket_medio).replace(/[^\d,.-]/g, '').replace(',', '.')) || null
    : null

  const segInfantil = precadastro ? !!precadastro.seg_infantil : escola.qtd_infantil > 0
  const segFund1    = precadastro ? !!precadastro.seg_fundamental_1 : escola.qtd_fund1 > 0
  const segFund2    = precadastro ? !!precadastro.seg_fundamental_2 : escola.qtd_fund2 > 0
  const segMedio    = precadastro ? !!precadastro.seg_ensino_medio : escola.qtd_medio > 0

  return NextResponse.json({
    escolaNome: escola.nome,
    escolaEmail: escola.email ?? precadastro?.email_institucional ?? null,
    alunos,
    ticket,
    maiorSala: precadastro?.maior_sala ?? null,
    situacao: contrato?.contrato_assinado ? 'Renovação' : 'Novo',
    segInfantil,
    segFund1,
    segFund2,
    segMedio,
    fonte: precadastro ? 'form_precadastro' : propostaRecente ? 'proposta' : 'cadastro',
  })
}
