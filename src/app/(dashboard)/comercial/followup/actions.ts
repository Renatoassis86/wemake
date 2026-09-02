'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Mesma tabela notas_escola já usada em EscolaDetailClient (ver
// escola-actions.ts) — aqui só muda o path revalidado.
export async function salvarNotaFollowup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const escola_id = formData.get('escola_id') as string
  const texto = (formData.get('texto') as string || '').trim()
  if (!escola_id || !texto) return

  await supabase.from('notas_escola').insert({
    escola_id,
    texto,
    fixada: false,
    created_by: user.id,
  })

  revalidatePath('/comercial/followup')
}
