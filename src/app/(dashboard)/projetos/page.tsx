import { createAdminClient } from '@/lib/supabase/admin'
import { obterQuadroIdPadrao, carregarQuadro } from '@/lib/projetos'
import { QuadroKanban } from './QuadroKanban'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestão de Projetos · We Make' }

export default async function ProjetosPage() {
  const admin = createAdminClient()
  const quadroId = await obterQuadroIdPadrao(admin)
  const quadro = await carregarQuadro(admin, quadroId)

  return (
    <section aria-label="Quadro de projetos" style={{ height: '100%' }}>
      <QuadroKanban quadroInicial={quadro} />
    </section>
  )
}
