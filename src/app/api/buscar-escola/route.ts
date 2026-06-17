import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ escolas: [], leads: [] })

  const pattern = `%${q}%`

  // Search escolas table (CRM schools) — compute qtd_alunos from individual fields
  const { data: escolasRaw } = await supabase
    .from('escolas')
    .select('id, nome, cidade, estado, cnpj, contato_nome, contato_cargo, qtd_infantil, qtd_fund1, qtd_fund2, qtd_medio, classificacao_atual')
    .or(`nome.ilike.${pattern},contato_nome.ilike.${pattern}`)
    .limit(10)

  const escolas = (escolasRaw ?? []).map(e => ({
    ...e,
    qtd_alunos: (e.qtd_infantil ?? 0) + (e.qtd_fund1 ?? 0) + (e.qtd_fund2 ?? 0) + (e.qtd_medio ?? 0) || undefined,
  }))

  // Search leads_universal by escola_nome OR nome (person name)
  const { data: leads } = await supabase
    .from('leads_universal')
    .select('id, nome, escola_nome, cargo, email, tel_celular, cidade, uf, tipo_inscricao, qtd_alunos_total')
    .or(`escola_nome.ilike.${pattern},nome.ilike.${pattern}`)
    .limit(20)

  return NextResponse.json({
    escolas,
    leads: leads ?? [],
  })
}
