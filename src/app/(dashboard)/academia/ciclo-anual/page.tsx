import './ciclo-anual.css'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moduloPermitido } from '@/lib/modulos'
import { MARCOS } from '@/lib/academia'
import { CicloAnualBoard, type CronogramaCard, type KanbanData } from '@/components/academia/ciclo-anual/CicloAnualBoard'

export const dynamic = 'force-dynamic'

export default async function CicloAnualPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !moduloPermitido('academia', user.email)) redirect('/academia')

  const admin = createAdminClient()
  const [{ data: cards }, { data: implantacoes }] = await Promise.all([
    admin.from('academia_cronograma_cards').select('id, momento, ordem, titulo, data_label, status_tag, descricao, fonte, marco')
      .eq('ativo', true).order('momento').order('ordem'),
    admin.from('academia_implantacoes').select('escola_nome, marcos').eq('arquivada', false),
  ])

  // kanbanData['Handoff']['Concluído'] = ['Colégio X', ...] — alimenta o verso
  // de cada cartão ligado a um marco, com os nomes reais das escolas no Painel Mestre.
  const kanbanData: KanbanData = {}
  for (const impl of implantacoes ?? []) {
    const marcosEscola = (impl.marcos ?? {}) as Record<string, string>
    for (const [marco, status] of Object.entries(marcosEscola)) {
      kanbanData[marco] ??= {}
      kanbanData[marco][status] ??= []
      kanbanData[marco][status].push(impl.escola_nome)
    }
  }

  return (
    <CicloAnualBoard
      cards={(cards ?? []) as CronogramaCard[]}
      kanbanData={kanbanData}
      marcos={[...MARCOS]}
    />
  )
}
