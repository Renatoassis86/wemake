import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext  = file.name.split('.').pop() ?? 'png'
    const name = `logo-${Date.now()}.${ext}`
    const buf  = await file.arrayBuffer()

    // Use Storage REST API directly — service_role bypasses RLS via HTTP Authorization header
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/proposta-logos/${name}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey':        SERVICE_KEY,
          'Content-Type':  file.type,
          'x-upsert':      'true',
        },
        body: buf,
      },
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      return NextResponse.json({ error: errText }, { status: 500 })
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/proposta-logos/${name}`
    return NextResponse.json({ url: publicUrl })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
