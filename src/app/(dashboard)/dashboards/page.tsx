import { WipPage } from "@/components/ui/WipPage"

export default function DashboardsPage() {
  return (
    <WipPage
      title="BI / Analytics"
      subtitle="Dados em tempo real — indicadores estratégicos da operação comercial"
      tag="Em Breve"
      headline="Inteligência comercial em tempo real para decisões estratégicas"
      description="Painéis dinâmicos que agregam dados de escolas, registros, contratos e metas em visualizações interativas. Filtros por período, UF, responsável e perfil pedagógico para análises segmentadas."
      features={[
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: "KPIs em Tempo Real", desc: "Total de escolas, leads, registros, potencial e contratos atualizados automaticamente." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: "Análise Temporal", desc: "Gráficos de evolução mensal de interações, leads qualificados e contratos fechados." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>, title: "Segmentação por Filtros", desc: "Filtre por período, UF, responsável, porte da escola e perfil pedagógico." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, title: "Mapa Geográfico", desc: "Distribuição de escolas e leads no território nacional por estado e região." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: "Funil de Conversão", desc: "Frio → Morno → Quente → Contrato com taxas de conversão por estágio." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: "Palavras-Chave nos Registros", desc: "Análise de frequência das palavras mais citadas nos resumos de reuniões." },
      ]}
      note="Este módulo puxará dados em tempo real diretamente do banco Supabase, sem necessidade de atualização manual. Todos os dados inseridos nos outros módulos alimentarão automaticamente os painéis de BI."
    />
  )
}
