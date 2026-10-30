import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_PORTAL, lerSessaoPortal } from '@/lib/diagnostico-portal-auth'
import LoginPortalForm from './LoginPortalForm'

export default async function MeuDiagnosticoPage() {
  const jar = await cookies()
  if (lerSessaoPortal(jar.get(COOKIE_PORTAL)?.value)) redirect('/meu-diagnostico/painel')
  return <LoginPortalForm />
}
