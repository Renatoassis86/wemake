import { WipPage } from "@/components/ui/WipPage"

export default function FinanceiroPage() {
  return (
    <WipPage
      title="Financeiro"
      subtitle="Controle financeiro da operação comercial e integração com Education Finance"
      tag="Em Breve"
      headline="Visão financeira completa das parcerias e receitas"
      description="Acompanhe o fluxo financeiro das parcerias: valores contratados, recebimentos, inadimplências e projeções. Integrado com os contratos da Jornada Contratual e com a plataforma Education Finance."
      features={[
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: "Receita por Contrato", desc: "Valores contratados por escola com cronograma de recebimentos." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title: "Controle de Recebimentos", desc: "Status de pagamentos: em dia, em atraso e recebidos." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: "Projeção de Receita", desc: "Previsão de receita com base nos contratos ativos e pipeline comercial." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: "Metas x Realizado", desc: "Comparativo entre meta de receita 2026 e valores efetivamente recebidos." },
      ]}
      integration={{
        label: "Education Finance — Integração Planejada",
        desc: "Este módulo será integrado com a plataforma Education Finance assim que disponível. Os dados financeiros das parcerias fluirão automaticamente entre os dois sistemas, eliminando retrabalho e garantindo consistência. A URL de integração será configurada em breve.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
      }}
      note="Aguardando os links de integração com a plataforma Education Finance. Assim que disponíveis, a conexão será configurada e o módulo será desenvolvido com dados sincronizados em tempo real."
      cta={{ label: "Ver Jornada Contratual", href: "/comercial/contratos" }}
    />
  )
}
