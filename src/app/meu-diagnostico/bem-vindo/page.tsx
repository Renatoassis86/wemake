import { redirect } from 'next/navigation'
import { sessaoPortal } from '../actions'
import BemVindo from './BemVindo'

export default async function BemVindoPage() {
  const sessao = await sessaoPortal()
  if (!sessao) redirect('/meu-diagnostico')
  return <BemVindo escola={sessao.escola_nome} />
}
