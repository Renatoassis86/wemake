import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createAdminClient()

  // Fetch all records ordered by created_at DESC (newest first)
  const { data: all, error } = await supabase
    .from('form_precadastro_wemake')
    .select('id, cnpj, email_institucional, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!all?.length) return NextResponse.json({ removed: 0 })

  // Group by CNPJ (or email_institucional if no CNPJ), keep first (newest), mark rest as duplicates
  const seen = new Map<string, boolean>()
  const toDelete: string[] = []

  for (const r of all) {
    const key = r.cnpj?.trim() || r.email_institucional?.trim() || null
    if (!key) continue  // no key to deduplicate on — skip

    if (seen.has(key)) {
      toDelete.push(r.id)
    } else {
      seen.set(key, true)
    }
  }

  if (!toDelete.length) return NextResponse.json({ removed: 0 })

  const { error: delErr } = await supabase
    .from('form_precadastro_wemake')
    .delete()
    .in('id', toDelete)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ removed: toDelete.length })
}
