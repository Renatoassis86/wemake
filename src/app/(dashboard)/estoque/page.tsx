import { WipPage } from '@/components/ui/WipPage'

export default function EstoquePage() {
  return (
    <WipPage
      title="Estoque e Logística"
      subtitle="Controle integrado de produtos e distribuição"
      tag="Em Breve"
      headline="Visibilidade total do estoque Paideia, Oikos e Biblos"
      description="Gerencie o inventário de materiais didáticos, controle entradas e saídas, monitore níveis de estoque por produto e região, e integre diretamente com a plataforma de pedidos das escolas parceiras."
      features={[
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
          title: 'Controle de Inventário',
          desc: 'Quantidade em estoque por produto (Paideia, Oikos, Biblos) com alertas de nível mínimo.',
        },
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
          title: 'Entrada de Produtos',
          desc: 'Registro de recebimentos com nota fiscal, lote e localização no depósito.',
        },
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>,
          title: 'Saída e Expedição',
          desc: 'Controle de saídas vinculadas aos pedidos das escolas com rastreamento de envio.',
        },
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
          title: 'Logística de Distribuição',
          desc: 'Acompanhamento de transportadoras, prazos de entrega e status por escola.',
        },
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
          title: 'Relatórios de Movimentação',
          desc: 'Histórico completo de entradas, saídas e saldo por período e produto.',
        },
        {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
          title: 'Alertas de Estoque Baixo',
          desc: 'Notificações automáticas quando o estoque atingir o nível mínimo configurado.',
        },
      ]}
      integration={{
        label: 'Plataforma de Pedidos e Registros',
        desc: 'Este módulo será integrado diretamente com a plataforma de pedidos das escolas parceiras. A URL de integração será configurada assim que disponível — os pedidos aprovados alimentarão automaticamente as saídas de estoque.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        ),
      }}
      note="Aguardando a URL da plataforma de pedidos para configurar a integração. Assim que disponível, este módulo será desenvolvido e conectado automaticamente ao fluxo de pedidos das escolas."
    />
  )
}
