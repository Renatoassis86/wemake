import PageHeader from '@/components/layout/PageHeader'
import { carregarQuantidadeAlunos } from '@/lib/quantidade-alunos'
import { QuantidadeAlunosClient } from '@/app/(dashboard)/comercial/quantidade-alunos/QuantidadeAlunosClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Quantidade de Alunos · Gestão Financeira' }

export default async function QuantidadeAlunosFinanceiroPage() {
  const dados = await carregarQuantidadeAlunos()

  return (
    <div>
      <PageHeader
        title="Quantidade de Alunos"
        subtitle="Alunos por série em cada escola parceira, e pedido de livro pra gráfica — mesma tabela da Gestão Comercial"
      />
      <div style={{ padding: '2rem 2.5rem' }}>
        <QuantidadeAlunosClient
          linhasIniciais={dados.linhas}
          escolasDisponiveis={dados.escolasDisponiveis}
          livroColunaExiste={dados.livroColunaExiste}
          veteranaColunaExiste={dados.veteranaColunaExiste}
          livroQtdsColunaExiste={dados.livroQtdsColunaExiste}
        />
      </div>
    </div>
  )
}
