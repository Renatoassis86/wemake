import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PaginasDoModulo } from '@/components/academia/gestao/ModuloShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestão de Contratos · We Make' }

export default async function ContratosPage() {
  const { data, error } = await createAdminClient()
    .from('contratos')
    .select('contrato_assinado, contrato_enviado, minuta_enviada, declinou')
  const c = (data ?? []) as { contrato_assinado: boolean; contrato_enviado: boolean; minuta_enviada: boolean; declinou: boolean }[]
  const ativos = c.filter(x => !x.declinou)
  const assinados = ativos.filter(x => x.contrato_assinado).length
  const enviados = ativos.filter(x => x.contrato_enviado && !x.contrato_assinado).length
  const minuta = ativos.filter(x => x.minuta_enviada && !x.contrato_enviado && !x.contrato_assinado).length
  const andamento = ativos.length - assinados - enviados - minuta

  return (
    <>
      <section aria-label="Situação dos contratos">
        <dl className="ac-kpis">
          <div><dt>Assinados</dt><dd>{error ? '—' : assinados}</dd></div>
          <div><dt>Contrato enviado, aguardando assinatura</dt><dd>{error ? '—' : enviados}</dd></div>
          <div><dt>Minuta enviada</dt><dd>{error ? '—' : minuta}</dd></div>
          <div><dt>Em andamento</dt><dd>{error ? '—' : andamento}</dd></div>
        </dl>
        <p className="ac-nota">
          Situação lida da Jornada Contratual de cada escola. Contratos declinados não entram na conta.{' '}
          <Link href="/comercial/contratos">Abrir a jornada contratual →</Link>
        </p>
      </section>
      <PaginasDoModulo slug="contratos" />
    </>
  )
}
