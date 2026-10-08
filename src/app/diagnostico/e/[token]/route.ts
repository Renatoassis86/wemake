import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COOKIE_DIAGNOSTICO, SESSAO_HORAS, criarSessao, hashIp } from '@/lib/diagnostico-auth'

export const dynamic = 'force-dynamic'

/**
 * Link que a We Make envia à escola: /diagnostico/e/<token>.
 * O token é longo e aleatório (144 bits). Se for válido, abre a sessão da escola e leva ao formulário.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const destino = (caminho: string) => new URL(caminho, request.url)

  if (!/^[0-9a-f]{36}$/i.test(token)) return NextResponse.redirect(destino('/diagnostico?erro=link'))

  const db = createAdminClient()
  const ip = hashIp((request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'desconhecido')

  const desde = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count } = await db.from('academia_pin_tentativas').select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip).eq('sucesso', false).gte('criado_em', desde)
  if ((count ?? 0) >= 8) return NextResponse.redirect(destino('/diagnostico?erro=tentativas'))

  const { data } = await db.from('academia_diagnosticos').select('id, expira_em, status').eq('link_token', token.toLowerCase()).maybeSingle()
  const ok = !!data && new Date(data.expira_em) > new Date() && data.status !== 'concluido'
  await db.from('academia_pin_tentativas').insert({ ip_hash: ip, sucesso: ok })
  if (!ok || !data) return NextResponse.redirect(destino('/diagnostico?erro=link'))

  const res = NextResponse.redirect(destino('/diagnostico/preencher'))
  res.cookies.set(COOKIE_DIAGNOSTICO, criarSessao(data.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/diagnostico',
    maxAge: SESSAO_HORAS * 3600,
  })
  return res
}
