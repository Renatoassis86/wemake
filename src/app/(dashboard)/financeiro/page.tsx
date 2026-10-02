import Link from 'next/link'
import { carregarReceita } from '@/lib/gestao-receita'
import { formatCurrency } from '@/lib/utils'
import { PaginasDoModulo } from '@/components/academia/gestao/ModuloShell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestão Financeira · We Make' }

export default async function FinanceiroPage() {
  const r = await carregarReceita()
  const sem = !r.erro && r.semValor > 0
  return (
    <>
      <section aria-label="Indicadores">
        <dl className="ac-kpis">
          <div><dt>Contratos assinados</dt><dd>{r.erro ? '—' : r.assinados.length}</dd></div>
          <div><dt>Receita anual contratada</dt><dd className="ac-kpi-m">{r.erro || !r.receitaAnual ? '—' : formatCurrency(r.receitaAnual)}</dd></div>
          <div><dt>Equivalente mensal</dt><dd className="ac-kpi-m">{r.erro || !r.receitaAnual ? '—' : formatCurrency(r.receitaMensal)}</dd></div>
          <div><dt>Alunos contratados</dt><dd>{r.erro ? '—' : r.alunos.toLocaleString('pt-BR')}</dd></div>
        </dl>
        {r.erro ? <p className="ac-aviso is-erro">Não foi possível ler os contratos: {r.erro}</p> : sem ? (
          <p className="ac-nota ac-nota--alerta">
            {r.semValor} de {r.assinados.length} contratos assinados ainda não têm o valor por aluno registrado, por isso a receita não aparece.
            As quantidades de alunos estão corretas. <Link href="/financeiro/receita">Ver a receita por escola →</Link>
          </p>
        ) : (
          <p className="ac-nota">Calculado pelos contratos assinados: alunos × valor por aluno de cada série, por ano. <Link href="/financeiro/receita">Ver a receita por escola →</Link></p>
        )}
      </section>
      <PaginasDoModulo slug="financeiro" />
    </>
  )
}
