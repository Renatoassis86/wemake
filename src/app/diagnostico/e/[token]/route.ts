import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashIp } from '@/lib/diagnostico-auth'

export const dynamic = 'force-dynamic'

/**
 * Link que a We Make envia à escola: /diagnostico/e/<token>.
 * O token só confirma que o link ainda é válido (não vencido, diagnóstico não
 * concluído) — não abre sessão sozinho. O acesso de verdade exige o PIN,
 * sempre, mesmo para quem clicou no link: evita que abrir o link baste para
 * entrar, caso ele seja encaminhado ou aberto por outra pessoa.
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

  return NextResponse.redirect(destino('/diagnostico'))
}
