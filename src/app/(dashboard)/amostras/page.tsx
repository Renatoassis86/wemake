import { WipPage } from "@/components/ui/WipPage"

export default function AmostrasPage() {
  return (
    <WipPage
      title="Gestão de Amostras"
      subtitle="Controle de envio, recebimento e feedback de amostras pedagógicas"
      tag="Em Breve"
      headline="Rastreie cada livro enviado — do envio ao feedback da escola"
      description="Controle o estoque de amostras disponíveis, defina a política de distribuição, registre envios para cada escola prospectada e acompanhe o recebimento e o retorno comercial de cada amostra enviada."
      features={[
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, title: "Estoque de Amostras", desc: "Quantidade disponível por título com controle de entradas e baixas." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, title: "Registro de Envio", desc: "Escola destino, título, data de envio e responsável comercial." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, title: "Confirmação de Recebimento", desc: "Rastreio se a escola confirmou o recebimento e em qual data." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: "Feedback Pedagógico", desc: "Avaliação da escola sobre o conteúdo e qualidade do material recebido." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: "Conversão Comercial", desc: "Taxa de conversão amostra → negociação → contrato fechado." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: "Política de Distribuição", desc: "Regras: quantidade por escola, prioridade por estágio e prazo de retorno." },
      ]}
      note="Este módulo conecta com a Jornada Comercial — o envio de uma amostra aparece automaticamente na timeline da escola, enriquecendo o histórico de relacionamento."
      cta={{ label: "Ver Jornada Comercial", href: "/comercial/jornada-visual" }}
    />
  )
}
