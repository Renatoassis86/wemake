import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

interface Props { params: Promise<{ id: string }> }

// Gera o PDF de verdade no servidor (Puppeteer + Chromium headless) e devolve
// como anexo — clicar no ícone baixa o arquivo direto, sem diálogo de
// impressão do navegador. Reaproveita a página /propostas-pdf/[id] já
// existente (mesma PropostaView, mesmo CSS de impressão) só que navegada por
// dentro do Chromium headless em vez do navegador do usuário; por isso
// encaminha os cookies de sessão (sb-*) pro Chromium reconhecer o usuário
// logado ao acessar essa rota interna.
export async function GET(request: NextRequest, { params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: proposta } = await admin.from('propostas').select('escola_nome').eq('id', id).single()
  if (!proposta) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })

  const targetUrl = `${request.nextUrl.origin}/propostas-pdf/${id}`

  let browser
  try {
    if (process.env.VERCEL) {
      const chromium = (await import('@sparticuz/chromium')).default
      const puppeteer = await import('puppeteer-core')
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1600, height: 1000 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      // Dev local — @sparticuz/chromium só traz binário Linux (Lambda), então
      // usa o Chrome/Edge já instalado na máquina. Ajuste PUPPETEER_EXECUTABLE_PATH
      // no .env.local se o caminho abaixo não bater no seu ambiente.
      const puppeteer = await import('puppeteer-core')
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
        || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      browser = await puppeteer.launch({
        executablePath,
        defaultViewport: { width: 1600, height: 1000 },
        headless: true,
      })
    }

    const page = await browser.newPage()

    const sessionCookies = request.cookies.getAll()
      .filter(c => c.name.startsWith('sb-'))
      .map(c => ({ name: c.name, value: c.value, domain: request.nextUrl.hostname, path: '/' }))
    if (sessionCookies.length) await page.setCookie(...sessionCookies)

    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 500))

    await page.emulateMediaType('print')
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true })

    const nomeArquivo = (proposta.escola_nome || 'proposta')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${nomeArquivo || 'we-make'}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar PDF'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
