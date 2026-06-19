import { WipPage } from "@/components/ui/WipPage"

export default function AlmaPage() {
  return (
    <WipPage
      title="ALMA — IA Comercial"
      subtitle="Assistente de Leitura e Missão Analítica da We Make"
      tag="Em Breve"
      headline="ALMA: a inteligência que conhece cada escola tanto quanto você"
      description="ALMA é a IA comercial da We Make Education. Ela analisa o histórico completo de cada parceiro, sugere o próximo passo estratégico, identifica leads negligenciados e gera insights para acelerar o fechamento de contratos — tudo com base nos dados reais da sua operação."
      features={[
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: "Chat com Contexto Completo", desc: "Pergunte sobre qualquer escola — a ALMA já conhece todo o histórico de relacionamento." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: "Sugestão de Próximo Passo", desc: "Com base na jornada atual, indica a ação mais estratégica para avançar na negociação." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>, title: "Alertas Proativos", desc: "Identifica leads quentes sem contato há mais de 15 dias e notifica o consultor responsável." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: "Resumos Automáticos", desc: "Gera um resumo executivo da jornada de qualquer escola em segundos." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/></svg>, title: "Análise de Padrões de Sucesso", desc: "Identifica o que as negociações que chegaram ao contrato têm em comum." },
        { icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: "Privacidade por Perfil", desc: "Cada consultor vê insights apenas das suas escolas. Gerentes veem o panorama geral." },
      ]}
      note="A ALMA será o último módulo lançado — desenvolvido após todos os demais estarem operacionais, para que ela tenha dados suficientes para aprender e gerar insights realmente valiosos. Utilizará a API da Anthropic (Claude) com acesso direto ao banco de dados da plataforma."
    />
  )
}

