import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarDiagnostico, podeVerDiagnosticos } from '@/lib/diagnostico-staff'
import AnaliseDiagnostico from '@/components/academia/gestao/AnaliseDiagnostico'

export const dynamic = 'force-dynamic'

export default async function DiagnosticoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await podeVerDiagnosticos())) {
    return (
      <section className="ac-setup">
        <p className="ac-kicker">Acesso restrito</p>
        <h2>Os diagnósticos das escolas são vistos só por quem a We Make autorizou</h2>
      </section>
    )
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const r = await carregarDiagnostico(id)
  if (!r) notFound()

  return (
    <>
      <p className="ac-nota" style={{ marginTop: 0 }}><Link href="/academia/gestao/diagnosticos">← Todos os diagnósticos</Link></p>
      <AnaliseDiagnostico diagnostico={r.diagnostico} arquivos={r.arquivos} />
    </>
  )
}
