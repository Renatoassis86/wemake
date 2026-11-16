import { carregarOrcamentoReceitas, carregarOrcamentoDespesas } from '@/lib/orcamentos'
import OrcamentoGrid from '@/components/financeiro/OrcamentoGrid'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gestão Orçamentária · Gestão Financeira' }

const ANO = 2027

function Ferramenta({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.1rem 1.3rem', marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 .3rem', fontWeight: 700, fontSize: '.95rem' }}>{titulo}</p>
      <p className="ac-nota" style={{ margin: 0 }}>{descricao}</p>
    </div>
  )
}

export default async function GestaoOrcamentariaPage() {
  const [receitas, despesas] = await Promise.all([carregarOrcamentoReceitas(ANO), carregarOrcamentoDespesas(ANO)])

  return (
    <>
      <h2 className="ac-h3">Gestão Orçamentária</h2>
      <p className="ac-sec-lead">
        As ferramentas de acompanhar o orçamento de {ANO} depois de fechado: previsto x realizado, remanejamento,
        fluxo de caixa e indicadores. A edição da previsão em si mora nas páginas de Receitas e Despesas.
      </p>

      <h3 className="ac-h4">Acompanhamento — Receitas</h3>
      <OrcamentoGrid ano={ANO} tipo="receita" orcamentoInicial={receitas} mostrarPrevisao={false} mostrarControles={false} mostrarKpis={false} />

      <h3 className="ac-h4" style={{ marginTop: '2rem' }}>Acompanhamento — Despesas</h3>
      <OrcamentoGrid ano={ANO} tipo="despesa" orcamentoInicial={despesas} mostrarPrevisao={false} mostrarControles={false} mostrarKpis={false} />

      <h3 className="ac-h4" style={{ marginTop: '2.5rem' }}>Outras ferramentas</h3>
      <Ferramenta titulo="Remanejamentos"
        descricao="Ainda em estruturação — vai operar por dotação (categoria de despesa), não por linha, com o motor desenhado a partir do modelo do bi_financeiro. Entra numa sessão própria." />
      <Ferramenta titulo="Fluxo de caixa"
        descricao="Ainda em estruturação — depende de contas a pagar/receber e conciliação bancária, que também estão em estruturação no módulo financeiro." />
      <Ferramenta titulo="Indicadores financeiros"
        descricao="Ainda em estruturação — painel de KPIs (ex.: ticket médio por escola, % de execução por categoria, inadimplência) a partir do que já existe no Orçamento e na Receita Contratada." />
    </>
  )
}
