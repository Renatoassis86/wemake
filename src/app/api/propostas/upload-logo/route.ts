import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'png'
    const fileName = `logo-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const admin = createAdminClient()
    const { error } = await admin.storage
      .from('proposta-logos')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = admin.storage.from('proposta-logos').getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
