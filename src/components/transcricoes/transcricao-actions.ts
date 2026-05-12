'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface TranscricaoResult {
  success: boolean
  error?: string
  id?: string
}

export async function salvarTranscricao(formData: FormData): Promise<TranscricaoResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const escolaId    = formData.get('escola_id') as string
  const dataReuniao = formData.get('data_reuniao') as string
  const titulo      = formData.get('titulo') as string || null
  const participantes = formData.get('participantes') as string || null
  const plataforma  = formData.get('plataforma') as string || 'meet'
  const transcricao = formData.get('transcricao') as string || null

  if (!escolaId)    return { success: false, error: 'Escola é obrigatória' }
  if (!dataReuniao) return { success: false, error: 'Data da reunião é obrigatória' }

  const { data, error } = await supabase
    .from('transcricoes_reunioes')
    .insert({
      escola_id:    escolaId,
      data_reuniao: dataReuniao,
      titulo,
      participantes,
      plataforma,
      transcricao,
      created_by:   user.id,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/transcricoes')
  return { success: true, id: data.id }
}

export async function deletarTranscricao(id: string): Promise<TranscricaoResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('transcricoes_reunioes')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/transcricoes')
  return { success: true }
}
