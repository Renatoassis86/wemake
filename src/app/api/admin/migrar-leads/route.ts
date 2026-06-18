import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Require authenticated session
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createAdminClient()

  // 1. Fetch all pre-cadastros
  const { data: precads, error: fetchErr } = await supabase
    .from('form_precadastro_wemake')
    .select('*')
    .order('created_at', { ascending: true })

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!precads?.length) return NextResponse.json({ migrated: 0, skipped: 0 })

  // 2. Find which precadastro_ids are already in leads_universal
  const { data: existing } = await supabase
    .from('leads_universal')
    .select('dados_extras')
    .eq('fonte', 'formulario_wemake')

  const existingIds = new Set<string>(
    (existing ?? [])
      .map((r: any) => r.dados_extras?.precadastro_id)
      .filter(Boolean)
  )

  // 3. Insert missing ones
  let migrated = 0
  let skipped = 0

  for (const r of precads) {
    if (existingIds.has(r.id)) { skipped++; continue }

    const qtdTotal =
      (r.alunos_infantil ?? 0) +
      (r.alunos_fundamental_1 ?? 0) +
      (r.alunos_fundamental_2 ?? 0) +
      (r.alunos_ensino_medio ?? 0)

    const { error: insertErr } = await supabase.from('leads_universal').insert({
      fonte: 'formulario_wemake',
      nome: r.legal_nome ?? r.resp_email ?? null,
      email: r.legal_email ?? r.email_institucional ?? null,
      tel_celular: r.legal_whatsapp ?? null,
      cidade: r.cidade ?? null,
      uf: r.estado ?? null,
      endereco: r.rua ?? null,
      bairro: r.bairro ?? null,
      cep: r.cep ?? null,
      escola_nome: r.nome_fantasia ?? r.razao_social ?? null,
      escola_cnpj: r.cnpj ?? null,
      qtd_infantil: r.alunos_infantil ?? null,
      qtd_fund1: r.alunos_fundamental_1 ?? null,
      qtd_fund2: r.alunos_fundamental_2 ?? null,
      qtd_medio: r.alunos_ensino_medio ?? null,
      qtd_alunos_total: qtdTotal || null,
      data_inscricao: r.created_at,
      dados_extras: {
        razao_social: r.razao_social,
        email_institucional: r.email_institucional,
        ticket_medio: r.ticket_medio ?? null,
        fin_email_cobranca: r.fin_email_cobranca ?? null,
        legal_cpf: r.legal_cpf ?? null,
        formato_ano_letivo: r.formato_ano_letivo ?? null,
        data_inicio_letivo: r.data_inicio_letivo ?? null,
        data_fim_letivo: r.data_fim_letivo ?? null,
        precadastro_id: r.id,
      },
    })

    if (insertErr) {
      console.error('[migrar-leads] erro ao inserir', r.id, insertErr.message)
    } else {
      migrated++
    }
  }

  return NextResponse.json({ migrated, skipped, total: precads.length })
}
