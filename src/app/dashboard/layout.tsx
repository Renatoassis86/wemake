import { Sidebar } from '@/components/layout/Sidebar'
import { CompanySwitcher } from '@/components/layout/CompanySwitcher'
import { cookies } from 'next/headers'
import styles from './dashboard.module.css'
import { BuildingIcon } from 'lucide-react'
import Link from 'next/link'
import { selectCompany } from '../actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/server'


import { DashboardLayoutClient } from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Verificar Autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obter Detalhes do Perfil
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Obter Empresas (Bypass para admin)
  const isAdmin = user.email === 'renato@arkosintelligence.com';
  let empresas: any[] = []

  if (isAdmin) {
    const { data: todasEmpresas } = await supabase.from('empresas').select('id, razao_social, nome_fantasia')
    empresas = todasEmpresas?.map((e: any) => ({
      id: e.id,
      razaoSocial: e.razao_social,
      nomeFantasia: e.nome_fantasia
    })) || []
  } else {
    const { data: usuariosEmpresas } = await supabase
      .from('usuarios_empresas')
      .select('empresa_id, empresas(razao_social, nome_fantasia)')
      .eq('perfil_id', user.id)

    empresas = usuariosEmpresas?.map((ue: any) => ({
      id: ue.empresa_id,
      razaoSocial: ue.empresas.razao_social,
      nomeFantasia: ue.empresas.nome_fantasia
    })) || []
  }

  // 4. Resolver Empresa Ativa de Cookie
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('active_company_id')?.value
  const activeCompany = empresas.find(e => e.id === activeCompanyId) || empresas[0]

  return (
    <DashboardLayoutClient 
      activeCompany={activeCompany} 
      empresas={empresas}
      isAdmin={isAdmin} 
      perfilName={perfil?.nome || user.email}
    >
      {children}
    </DashboardLayoutClient>
  )
}
