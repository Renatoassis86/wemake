import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarEscolasUnificadas } from '@/lib/escolas-unificadas'

export const dynamic = 'force-dynamic'

// Lista leve de escolas (id, nome, cidade, estado) para alimentar o
// EscolaSelector em páginas client component (ex: /calculadora), que não
// podem buscar isso diretamente via Server Component.
export async function GET() {
  const supabase = await createClient()
  const escolas = await buscarEscolasUnificadas(supabase)
  return NextResponse.json(escolas)
}
