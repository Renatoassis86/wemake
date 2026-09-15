import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Edge Runtime — mesmo caminho de rede que o middleware já usa pra falar
// com o Supabase (provado confiável). Login roda aqui, no servidor, em
// vez do navegador do usuário: evita depender do navegador conseguir
// resolver o domínio do Supabase via DNS.
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const { email: rawEmail, password } = await request.json()

  if (!rawEmail || !password) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos.' })
  }

  const email = String(rawEmail).includes('@') ? rawEmail : `${rawEmail}@wemake.tec.br`

  const response = NextResponse.json({ error: null })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const credenciaisInvalidas = /invalid|credentials/i.test(error.message)
    return NextResponse.json({
      error: credenciaisInvalidas
        ? 'Usuário ou senha inválidos.'
        : `Não foi possível entrar agora (erro do servidor): ${error.message}`,
    })
  }

  return response
}
