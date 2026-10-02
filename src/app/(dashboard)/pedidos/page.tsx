import { PaginasDoModulo } from '@/components/academia/gestao/ModuloShell'

export const metadata = { title: 'Gestão de Pedidos · We Make' }

export default function PedidosPage() {
  return (
    <>
      <p className="ac-vazio" style={{ marginBottom: '2.5rem' }}>
        O módulo de pedidos ainda não tem dados. Quando for estruturado, os pedidos das escolas parceiras aparecerão aqui, com etapa e previsão de entrega.
      </p>
      <PaginasDoModulo slug="pedidos" />
    </>
  )
}
