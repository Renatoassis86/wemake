import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Verificar se é gerente
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'gerente') {
    return NextResponse.json({ error: 'Apenas gerentes podem fazer upload de documentos' }, { status: 403 })
  }

  const formData = await request.formData()
  const file     = formData.get('file') as File
  const tipo     = formData.get('tipo') as string   // 'ficha_cadastral' | 'minuta_contrato'

  if (!file || !tipo) return NextResponse.json({ error: 'Arquivo e tipo são obrigatórios' }, { status: 400 })

  const ext       = file.name.split('.').pop()?.toLowerCase()
  const fileName  = `${tipo}_cvE.${ext}`
  const bucket    = 'documentos-oficiais'

  const sb = createAdminClient()

  // Criar bucket se não existir
  await sb.storage.createBucket(bucket, { public: true }).catch(() => null)

  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await sb.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,   // sobrescreve se já existir
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(fileName)

  // Salvar referência no banco
  await sb.from('documentos_oficiais').upsert({
    tipo,
    nome_arquivo: file.name,
    url: publicUrl,
    storage_path: fileName,
    tamanho: file.size,
    mime_type: file.type,
    atualizado_por: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tipo' })

  return NextResponse.json({ url: publicUrl, path: fileName })
}
