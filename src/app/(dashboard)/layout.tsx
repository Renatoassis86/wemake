import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Le da tabela `usuarios` (We Make) usando admin client para evitar
  // problemas de RLS na leitura do proprio perfil.
  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('id, email, nome_completo, foto_perfil, role, ativo, cargo')
    .eq('id', user.id)
    .single()

  // Mapeia para o shape Profile que a Sidebar espera
  const profile: Profile | null = usuario ? {
    id: usuario.id,
    email: usuario.email,
    full_name: usuario.nome_completo ?? usuario.email,
    role: (usuario.role ?? 'consultor') as Profile['role'],
    phone: null,
    region: null,
    avatar_url: usuario.foto_perfil ?? null,
    is_active: usuario.ativo ?? true,
    created_at: '',
    updated_at: '',
  } : null

  if (profile && !profile.is_active) redirect('/login?error=inactive')

  return (
    <div className="flex">
      <Sidebar profile={profile} />
      <div
        className="dashboard-content"
        style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
    </div>
  )
}
