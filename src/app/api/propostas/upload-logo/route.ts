import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 400 * 1024 // 400 KB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Imagem muito grande. Use um arquivo menor que 400 KB.' },
        { status: 400 },
      )
    }

    const buf    = await file.arrayBuffer()
    const base64 = Buffer.from(buf).toString('base64')
    const url    = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
