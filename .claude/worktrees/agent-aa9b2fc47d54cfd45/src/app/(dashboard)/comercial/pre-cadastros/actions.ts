'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  success: boolean
  error?: string
}

export async function excluirPreCadastro(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const admin = createAdminClient()
  const { error } = await admin.from('form_precadastro_wemake').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/comercial/pre-cadastros')
  return { success: true }
}

export interface PreCadastroEditPayload {
  id: string
  status?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  cnpj?: string | null
  email_institucional?: string | null
  cidade?: string | null
  estado?: string | null
  legal_nome?: string | null
  legal_email?: string | null
  legal_whatsapp?: string | null
  fin_email_cobranca?: string | null
  ticket_medio?: string | null
  observacoes?: string | null
}

export async function atualizarPreCadastro(payload: PreCadastroEditPayload): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { id, ...patch } = payload
  if (!id) return { success: false, error: 'ID ausente' }

  const admin = createAdminClient()
  const { error } = await admin.from('form_precadastro_wemake').update(patch).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/comercial/pre-cadastros')
  return { success: true }
}
