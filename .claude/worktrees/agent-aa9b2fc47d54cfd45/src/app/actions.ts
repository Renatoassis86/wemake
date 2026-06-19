'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email e Senha são obrigatórios')}`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/')
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) throw err;
    redirect(`/login?error=${encodeURIComponent(err.message || 'Erro ao entrar')}`)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete('active_company_id')

  redirect('/login')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    redirect(`/login?error=${encodeURIComponent('Todos os campos são obrigatórios para cadastro')}`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome: name }
      }
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      await supabase.from('perfis').insert({
        id: data.user.id,
        nome: name,
      })
    }

    redirect('/')
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) throw err;
    redirect(`/login?error=${encodeURIComponent(err.message || 'Erro ao cadastrar')}`)
  }
}

export async function selectCompany(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_company_id', companyId, { secure: true, httpOnly: true })
}

export async function createCompany(formData: FormData) {
  const razaoSocial = formData.get('razao_social') as string
  const nomeFantasia = formData.get('nome_fantasia') as string
  const cnpj = formData.get('cnpj') as string

  if (!razaoSocial) throw new Error('Razão Social é obrigatória')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert({
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia || razaoSocial,
      cnpj: cnpj || null,
      status: 'ativo'
    })
    .select()
    .single()

  if (empresaError) return { error: empresaError.message }

  if (empresa) {
    await supabase
      .from('usuarios_empresas')
      .insert({
        perfil_id: user.id,
        empresa_id: empresa.id,
        cargo: 'admin'
      })
  }

  return { success: true }
}
