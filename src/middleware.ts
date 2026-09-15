import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — Hub é livre, login só protege módulos internos
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/hub') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/formulario') ||
    pathname.startsWith('/proposta') ||
    pathname.startsWith('/acesso-escola') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.png'

  // Rotas públicas (exceto /login, que precisa saber se o usuário já está
  // logado pra redirecionar pro Hub) não dependem do Supabase Auth — evita
  // que uma lentidão/timeout no Auth derrube até as páginas usadas por
  // escolas externas (formulário, proposta) junto com o painel interno.
  if (isPublic && pathname !== '/login') {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // supabase.auth.getUser() faz uma chamada de rede pro Supabase Auth — sem
  // limite de tempo, uma lentidão lá pendura o middleware até a Vercel matar
  // a execução (504 MIDDLEWARE_INVOCATION_TIMEOUT), derrubando o site
  // inteiro. Com o timeout, na pior hipótese o middleware trata como
  // "não autenticado" (nega rota protegida) mas SEMPRE responde rápido.
  const user = await Promise.race([
    supabase.auth.getUser().then(({ data }) => data.user).catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
  ])

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Usuário logado em /login → leva para o Hub (não mais /comercial direto)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
