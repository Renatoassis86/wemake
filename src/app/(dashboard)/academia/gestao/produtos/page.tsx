import { podeVerDiagnosticos } from '@/lib/diagnostico-staff'
import { carregarCatalogoAdmin } from '@/lib/catalogo'
import ProdutosClient from '@/components/academia/gestao/ProdutosClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Lista de produtos · Academia We Make' }

export default async function ProdutosPage() {
  if (!(await podeVerDiagnosticos())) {
    return (
      <section className="ac-setup" aria-labelledby="perm-t">
        <h2 id="perm-t">Esta conta não tem acesso à lista de produtos</h2>
        <p>Entre com outra conta ou fale com a direção da We Make.</p>
      </section>
    )
  }

  const itens = await carregarCatalogoAdmin()

  return (
    <>
      <div className="ac-sec-linha">
        <div>
          <h2 className="ac-h3" style={{ margin: 0 }}>Lista de produtos</h2>
          <p className="ac-sec-lead" style={{ margin: '.4rem 0 0' }}>
            A matriz mãe do catálogo do Diagnóstico do Espaço Maker. Nome, descrição, categoria, link de compra e
            preço valem pra toda escola — editar aqui atualiza o formulário da escola, a tela de análise e o
            portal da escola, sem precisar de deploy. A quantidade de cada escola continua em cada diagnóstico,
            intocada por aqui.
          </p>
        </div>
      </div>
      <ProdutosClient itensIniciais={itens} />
    </>
  )
}
