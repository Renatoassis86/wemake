import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST — cria ou atualiza um usuário no sistema
export async function POST(req: Request) {
  // só um gerente logado cria ou altera usuários (a rota estava aberta a qualquer visitante)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const admin = createAdminClient()
  const { data: me } = await admin.from('usuarios').select('role').eq('id', user.id).single()
  if (me?.role !== 'gerente') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const body = await req.json()
  const { email, password, nome_completo, role = 'consultor', cargo = '' } = body

  if (!email || !password || !nome_completo) {
    return NextResponse.json({ error: 'email, password e nome_completo são obrigatórios' }, { status: 400 })
  }

  // Tenta criar via auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError && !authError.message.includes('already been registered')) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Se já existe, busca o user existente
  let userId = authData?.user?.id
  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users?.find((u: any) => u.email === email)
    if (!existing) return NextResponse.json({ error: 'Usuário não encontrado após tentativa de criação' }, { status: 500 })
    userId = existing.id
  }

  // Upsert na tabela usuarios
  const { error: dbError } = await admin.from('usuarios').upsert({
    id: userId,
    email,
    nome_completo,
    role,
    cargo,
    ativo: true,
  }, { onConflict: 'id' })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  return NextResponse.json({ success: true, id: userId, nome_completo })
}
