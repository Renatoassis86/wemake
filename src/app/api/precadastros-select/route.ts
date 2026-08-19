import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Lista leve de escolas que JÁ enviaram o formulário público de pré-cadastro
// (/formulario), para alimentar o seletor "herdar dados" da Calculadora.
// Diferente de /api/escolas-select (que lista TODAS as escolas do CRM,
// a maioria sem nenhum dado de pré-cadastro para herdar).
export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('form_precadastro_wemake')
    .select('id, nome_fantasia, razao_social, cidade, estado')
    .order('created_at', { ascending: false })

  const escolas = (data ?? []).map(p => ({
    id: p.id,
    nome: p.nome_fantasia || p.razao_social || '(sem nome)',
    cidade: p.cidade,
    estado: p.estado,
  }))

  return NextResponse.json(escolas)
}
