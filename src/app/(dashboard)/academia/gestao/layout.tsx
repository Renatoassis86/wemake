import DocHero from '@/components/academia/DocHero'
import GestaoNav from '@/components/academia/gestao/GestaoNav'
import { podeVerDiagnosticos } from '@/lib/diagnostico-staff'

export const metadata = { title: 'Gestão da implantação · Academia We Make' }

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  const verDiagnosticos = await podeVerDiagnosticos()
  return (
    <>
      <DocHero
        variant="compact"
        crumbs={[{ label: 'Academia We Make', href: '/academia' }, { label: 'Gestão da implantação' }]}
        eyebrow="Painel Mestre de Implantação 2027"
        title="Gestão da implantação"
        deck="Onde cada escola está, quem precisa agir, qual é o prazo e onde existe risco."
      />
      <GestaoNav diagnosticos={verDiagnosticos} />
      <div className="ac-wrap ac-wrap--gestao">{children}</div>
    </>
  )
}
