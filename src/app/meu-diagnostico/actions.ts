'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashIp } from '@/lib/diagnostico-auth'
import {
  COOKIE_PORTAL, SESSAO_PORTAL_HORAS, criarSessaoPortal, hashSenha, lerSessaoPortal, normalizarSenha,
} from '@/lib/diagnostico-portal-auth'
import { mapaDePareceres, mapaDeRespostas, type ParecerBanco, type Respostas, type RespostaBanco, type StatusDiagnostico } from '@/lib/diagnostico'

export interface SessaoPortal {
  id: string
  escola_nome: string
  status: StatusDiagnostico
  respostas: Respostas
  parecer: Respostas
}

async function ipDoVisitante() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'desconhecido'
  return hashIp(ip)
}

export async function sessaoPortal(): Promise<SessaoPortal | null> {
  const jar = await cookies()
  const id = lerSessaoPortal(jar.get(COOKIE_PORTAL)?.value)
  if (!id) return null
  const db = createAdminClient()
  const { data } = await db.from('academia_diagnosticos').select('id, escola_nome, status').eq('id', id).maybeSingle()
  if (!data) return null
  const [{ data: resp }, { data: par }] = await Promise.all([
    db.from('academia_diag_respostas').select('item_key, resposta, detalhe, anexo_link, observacao, possui, qtd_existente, marca_obs').eq('diagnostico_id', id),
    db.from('academia_diag_pareceres').select('item_key, status_parecer, observacao, qtd_aproveitavel, acao, texto').eq('diagnostico_id', id),
  ])
  return {
    ...(data as Omit<SessaoPortal, 'respostas' | 'parecer'>),
    respostas: mapaDeRespostas((resp ?? []) as RespostaBanco[]),
    parecer: mapaDePareceres((par ?? []) as ParecerBanco[]),
  }
}

export async function entrarComPortal(_anterior: { erro?: string } | undefined, fd: FormData): Promise<{ erro?: string }> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const senha = normalizarSenha(String(fd.get('senha') ?? ''))
  if (!email || !email.includes('@')) return { erro: 'Digite o e-mail cadastrado.' }
  if (senha.length !== 6) return { erro: 'Digite a senha completa, com 6 números.' }

  const db = createAdminClient()
  const ip = await ipDoVisitante()

  const desde = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count } = await db
    .from('academia_pin_tentativas')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip).eq('sucesso', false).gte('criado_em', desde)
  if ((count ?? 0) >= 8) return { erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' }

  const { data } = await db
    .from('academia_diagnosticos')
    .select('id')
    .eq('portal_email', email)
    .eq('portal_senha_hash', hashSenha(senha))
    .maybeSingle()
  await db.from('academia_pin_tentativas').insert({ ip_hash: ip, sucesso: !!data })
  if (!data) return { erro: 'E-mail ou senha incorretos.' }

  const jar = await cookies()
  jar.set(COOKIE_PORTAL, criarSessaoPortal(data.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/meu-diagnostico',
    maxAge: SESSAO_PORTAL_HORAS * 3600,
  })
  redirect('/meu-diagnostico/bem-vindo')
}

export async function sairDoPortal() {
  const jar = await cookies()
  jar.delete({ name: COOKIE_PORTAL, path: '/meu-diagnostico' })
  redirect('/meu-diagnostico')
}
