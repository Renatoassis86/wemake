'use server'

import { createClient } from '@/lib/supabase/server'

export async function moverNegociacao(id: string, novoStage: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('negociacoes')
    .update({ stage: novoStage })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removerDoQuadro(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('negociacoes')
    .update({ ativa: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
