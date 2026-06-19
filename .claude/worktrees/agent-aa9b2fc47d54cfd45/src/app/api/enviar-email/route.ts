import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const FROM = 'CVE Education <agenda@gestaoeducation.arkosintelligence.com>'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { destinatarios, assunto, corpo, isHtml = false } = await request.json()

  if (!destinatarios?.length) return NextResponse.json({ error: 'Sem destinatários' }, { status: 400 })
  if (!assunto?.trim())       return NextResponse.json({ error: 'Assunto obrigatório' }, { status: 400 })
  if (!corpo?.trim())         return NextResponse.json({ error: 'Corpo obrigatório' }, { status: 400 })

  // Buscar nome do remetente
  const { data: profile } = await supabase
    .from('profiles').select('full_name, email').eq('id', user.id).single()

  const nomeRemetente = profile?.full_name ?? 'CVE Education'

  let enviados = 0
  let erros: string[] = []

  // Enviar em lotes de 10 (limite do Resend no plano gratuito)
  const LOTE = 10
  for (let i = 0; i < destinatarios.length; i += LOTE) {
    const lote = destinatarios.slice(i, i + LOTE)

    await Promise.all(lote.map(async (dest: { email: string; nome?: string }) => {
      // Personalizar o corpo com o nome do destinatário se fornecido
      const corpoPersonalizado = corpo
        .replace(/\{\{nome\}\}/gi, dest.nome ?? 'Prezado(a)')
        .replace(/\{\{email\}\}/gi, dest.email)

      try {
        const { error } = await resend.emails.send({
          from:    FROM,
          to:      [dest.email],
          subject: assunto,
          ...(isHtml
            ? { html: corpoPersonalizado }
            : { text: corpoPersonalizado }
          ),
          replyTo: profile?.email ?? undefined,
        })
        if (error) erros.push(`${dest.email}: ${error.message}`)
        else enviados++
      } catch (e: any) {
        erros.push(`${dest.email}: ${e?.message ?? 'Erro desconhecido'}`)
      }
    }))

    // Pequeno delay entre lotes para não sobrecarregar
    if (i + LOTE < destinatarios.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return NextResponse.json({ enviados, erros, total: destinatarios.length })
}
