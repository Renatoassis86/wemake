'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { enviarConvitesEvento } from '@/lib/email'

export interface AgendaResult {
  success: boolean
  error?: string
  id?: string
}

export async function criarEvento(formData: FormData): Promise<AgendaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const diaInteiro = formData.get('dia_inteiro') === 'true'
  const dataInicio = formData.get('data_inicio') as string
  const dataFim    = formData.get('data_fim') as string
  const horaInicio = formData.get('hora_inicio') as string || '09:00'
  const horaFim    = formData.get('hora_fim') as string    || '10:00'

  const dtInicio = diaInteiro
    ? new Date(dataInicio + 'T00:00:00').toISOString()
    : new Date(dataInicio + 'T' + horaInicio + ':00').toISOString()

  const dtFim = diaInteiro
    ? new Date(dataFim + 'T23:59:59').toISOString()
    : new Date(dataFim + 'T' + horaFim + ':00').toISOString()

  const { data: evento, error } = await supabase
    .from('agenda_eventos')
    .insert({
      titulo:      formData.get('titulo') as string,
      descricao:   formData.get('descricao') as string || null,
      local:       formData.get('local') as string || null,
      tipo:        formData.get('tipo') as string || 'reuniao',
      cor:         formData.get('cor') as string || '#2563eb',
      data_inicio: dtInicio,
      data_fim:    dtFim,
      dia_inteiro: diaInteiro,
      escola_id:   formData.get('escola_id') as string || null,
      recorrencia: formData.get('recorrencia') as string || null,
      criado_por:  user.id,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Adicionar criador como participante aceito
  await supabase.from('agenda_participantes').insert({
    evento_id:  evento.id,
    profile_id: user.id,
    email:      user.email ?? '',
    status:     'aceito',
  })

  // Buscar nome do organizador
  const { data: orgProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const organizadorNome = orgProfile?.full_name ?? user.email ?? 'CVE Education'

  // Adicionar demais participantes e enviar convites
  const participantesRaw = formData.get('participantes') as string
  const titulo     = formData.get('titulo') as string
  const descricao  = formData.get('descricao') as string || null
  const local      = formData.get('local') as string || null

  const paraEnvioEmail: { email: string; nome: string | null; participanteId: string }[] = []

  if (participantesRaw) {
    const emails: string[] = JSON.parse(participantesRaw)
    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', emails)

      const profileMap = new Map(profiles?.map(p => [p.email, p]) ?? [])

      const inserts = emails
        .filter(e => e !== user.email)
        .map(email => ({
          evento_id:  evento.id,
          profile_id: profileMap.get(email)?.id ?? null,
          email,
          nome:       profileMap.get(email)?.full_name ?? null,
          status:     'pendente' as const,
        }))

      if (inserts.length > 0) {
        const { data: inseridos } = await supabase
          .from('agenda_participantes')
          .insert(inserts)
          .select('id, email, nome')

        inseridos?.forEach(p => {
          paraEnvioEmail.push({ email: p.email, nome: p.nome, participanteId: p.id })
        })
      }
    }
  }

  // Disparar e-mails de convite para todos os participantes (exceto organizador)
  if (paraEnvioEmail.length > 0) {
    const { enviados } = await enviarConvitesEvento({
      eventoId:        evento.id,
      titulo,
      dataInicio:      dtInicio,
      dataFim:         dtFim,
      local,
      descricao,
      diaInteiro,
      organizadorNome,
      participantes:   paraEnvioEmail,
    })

    // Marcar como notificado no banco
    if (enviados > 0) {
      await supabase
        .from('agenda_participantes')
        .update({ notificado: true })
        .eq('evento_id', evento.id)
        .neq('profile_id', user.id)
    }
  }

  revalidatePath('/agenda')
  return { success: true, id: evento.id }
}

export async function editarEvento(id: string, formData: FormData): Promise<AgendaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const diaInteiro = formData.get('dia_inteiro') === 'true'
  const dataInicio = formData.get('data_inicio') as string
  const dataFim    = formData.get('data_fim') as string
  const horaInicio = formData.get('hora_inicio') as string || '09:00'
  const horaFim    = formData.get('hora_fim') as string    || '10:00'

  const dtInicio = diaInteiro
    ? new Date(dataInicio + 'T00:00:00').toISOString()
    : new Date(dataInicio + 'T' + horaInicio + ':00').toISOString()

  const dtFim = diaInteiro
    ? new Date(dataFim + 'T23:59:59').toISOString()
    : new Date(dataFim + 'T' + horaFim + ':00').toISOString()

  const { error } = await supabase
    .from('agenda_eventos')
    .update({
      titulo:      formData.get('titulo') as string,
      descricao:   formData.get('descricao') as string || null,
      local:       formData.get('local') as string || null,
      tipo:        formData.get('tipo') as string || 'reuniao',
      cor:         formData.get('cor') as string || '#2563eb',
      data_inicio: dtInicio,
      data_fim:    dtFim,
      dia_inteiro: diaInteiro,
      escola_id:   formData.get('escola_id') as string || null,
      recorrencia: formData.get('recorrencia') as string || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/agenda')
  return { success: true, id }
}

export async function deletarEvento(id: string): Promise<AgendaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase.from('agenda_eventos').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/agenda')
  return { success: true }
}

export async function responderConvite(
  participanteId: string,
  status: 'aceito' | 'recusado' | 'talvez'
): Promise<AgendaResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('agenda_participantes')
    .update({ status })
    .eq('id', participanteId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/agenda')
  return { success: true }
}
