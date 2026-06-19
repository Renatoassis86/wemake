"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function criarTarefaEscola(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const escola_id = formData.get('escola_id') as string
  await supabase.from('tarefas').insert({
    escola_id,
    titulo:     formData.get('titulo') as string,
    vencimento: formData.get('vencimento') as string || null,
    prioridade: formData.get('prioridade') as string || 'media',
    responsavel_id: user.id,
    created_by: user.id,
  })
  revalidatePath(`/comercial/escolas/${escola_id}`)
}

export async function criarNotaEscola(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const escola_id = formData.get('escola_id') as string
  await supabase.from('notas_escola').insert({
    escola_id,
    texto:  formData.get('texto') as string,
    fixada: formData.get('fixada') === 'true',
    created_by: user.id,
  })
  revalidatePath(`/comercial/escolas/${escola_id}`)
}

export async function concluirTarefaEscola(id: string) {
  const supabase = await createClient()
  await supabase.from('tarefas').update({
    status: 'concluida',
    concluida_em: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/comercial')
}
