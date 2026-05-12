'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CheckCircle, 
  MessageCircle, 
  Sparkles, 
  Workflow, 
  Layout, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Target, 
  BarChart2, 
  Lightbulb, 
  FileSearch,
  Package
} from 'lucide-react'
import styles from '../modulos.module.css'
import Footer from '@/components/Footer'

// Estilos base para reuso do Header da Home
const headerStyles: any = {
  header: {
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(7, 10, 15, 0.8)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  nav: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  },
  navLink: {
    color: '#FFF',
    fontSize: '0.813rem',
    textDecoration: 'none',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    cursor: 'pointer'
  }
}

const moduleDetails: Record<string, { 
  title: string, 
  tag: string,
  desc: string, 
  whatItIs: string,
  whatItDoes: string,
  results: string,
  integration: string,
  acquired: boolean,
  banner: string,
  iconType: string
}> = {
  marketing: { 
    title: 'Marketing Intelligence', 
    tag: 'MI',
    desc: 'O marketing atua como gerador supremo de dados decisórios.', 
    whatItIs: 'O Marketing Intelligence (MI) é o sistema nervoso receptivo da Arkos. Ele transforma cada interação, clique e menção à sua marca em uma variável analítica estruturada.',
    whatItDoes: 'Realiza coleta passiva e ativa de dados de mercado, análise de sentimento via NLP, trackeamento de ROI em multi-canais e testes de tração para novos produtos.',
    results: 'Redução drástica no custo de aquisição (CAC), aumento da precisão de lançamentos e uma visão em tempo real da saúde da marca perante a concorrência.',
    integration: 'Alimenta o CRM com leads qualificados por score e fornece dados brutos para o módulo de Planejamento Estratégico (PEC).',
    acquired: false,
    banner: '/arkos_marketing_v2_1775140793051.png',
    iconType: 'sparkles'
  },
  data: { 
    title: 'Governança de Dados e BI', 
    tag: 'GDB',
    desc: 'Powering decisions through a single source of truth.', 
    whatItIs: 'O coração infraestrutural da Arkos. É o módulo que garante que a "Single Source of Truth" (SSOT) seja uma realidade inquestionável na sua empresa.',
    whatItDoes: 'Gere pipelines de dados, limpa e padroniza bases dispersas (ERP/CRM) e constrói dashboards preditivos que respondem não apenas o que aconteceu, mas por que aconteceu.',
    results: 'Eliminação total de planilhas manuais, redução de erros de reporte em 95% e autonomia total para o C-Level decidir em segundos.',
    integration: 'É a base onde todos os outros módulos (CRM, CLM, ATI) depositam e consultam informações validadas.',
    acquired: false,
    banner: '/arkos_data_v2_1775140815684.png',
    iconType: 'workflow'
  },
  crm: { 
    title: 'Gestão Comercial (CRM)', 
    tag: 'CRM',
    desc: 'Alta performance comercial orientada por dados.', 
    whatItIs: 'Um motor de vendas inteligente que remove o "feeling" da negociação e introduz a probabilidade matemática no fechamento de contratos.',
    whatItDoes: 'Monitora o funil de vendas com score preditivo de lead, automatiza propostas e alerta gestores sobre gargalos na esteira comercial antes que eles afetem o faturamento.',
    results: 'Aumento na velocidade de fechamento (Sales Velocity) e previsibilidade absoluta de fluxo de caixa para os próximos meses.',
    integration: 'Conecta leads do MI diretamente à formalização no CLM, garantindo que a venda seja fluida do anúncio à assinatura.',
    acquired: false,
    banner: '/arkos_crm_clm_v2_1775140837645.png',
    iconType: 'trending'
  },
  clm: { 
    title: 'Gestão de Contratos (CLM)', 
    tag: 'CLM',
    desc: 'A espinha dorsal de governança da Arkos.', 
    whatItIs: 'O CLM Arkos (Ópera) é a solução definitiva para a gestão do ciclo de vida de contratos e documentos, protegendo o patrimônio físico e financeiro do negócio.',
    whatItDoes: 'Gere minutas inteligentes, automatiza assinaturas digitais, controla vigências e prazos de renovação, e audita documentos com rigor econométrico.',
    results: 'Segurança jurídica total, eliminação de multas por esquecimento de prazos e conformidade total com auditorias externas em tempo recorde.',
    integration: 'Utiliza os dados do CRM para gerar contratos e alimenta o módulo Financeiro (CCI) para automação de cobranças.',
    acquired: true,
    banner: '/arkos_dashboard_decision_1774133572097.png',
    iconType: 'shield'
  },
  recrutamento: { 
    title: 'Arkos Talent Intelligence', 
    tag: 'ATI',
    desc: 'NLP e Otimização para o capital humano.', 
    whatItIs: 'O módulo de inteligência de talentos que usa Ciência de Dados para otimizar o ativo mais valioso e imprevisível de qualquer empresa: as pessoas.',
    whatItDoes: 'Mapeia competências via NLP, analisa o "clima analítico", automatiza o recrutamento baseado em fit técnico e gera matrizes de produtividade reais.',
    results: 'Redução drástica no churn de funcionários (turnover) e alocação precisa de talentos onde eles geram mais valor para a corporação.',
    integration: 'Informa ao PEC (Estratégico) se a empresa tem a capacidade humana física para executar os planos de expansão traçados.',
    acquired: false,
    banner: '/arkos_talent_v2_1775140860229.png',
    iconType: 'layout'
  },
  ai: { 
    title: 'Agentes de IA e Automação', 
    tag: 'AIA',
    desc: 'Agentes autônomos treinados para o seu negócio.', 
    whatItIs: 'A camada de execução autônoma da Arkos. São cérebros digitais que operam dentro dos seus fluxos para resolver problemas sem intervenção humana.',
    whatItDoes: 'Atendimento inteligente, alertas de anomalia ativa, auditoria de massa em tempo real e automação de chamados técnicos ou comerciais via NLP.',
    results: 'Liberação de tempo da equipe para tarefas estratégicas e uma operação que funciona 24/7 com precisão milimétrica.',
    integration: 'Conecta-se a todos os módulos para agir como um "Concierge" de dados, enviando alertas ou resolvendo tarefas entre sistemas.',
    acquired: false,
    banner: '/arkos_ai_v2_1775140880134.png',
    iconType: 'cpu'
  },
  growth: { 
    title: 'Aceleração de Crescimento', 
    tag: 'ACG',
    desc: 'Escala acelerada baseada em ROI preditivo.', 
    whatItIs: 'A Arkos Growth é o braço de expansão que aplica modelagem matemática no tráfego pago e em estratégias de conversão de larga escala.',
    whatItDoes: 'Opera squads de tráfego, otimiza modelos de atribuição e escala investimentos em mídia apenas quando a probabilidade de ROI é positiva.',
    results: 'Escalabilidade previsível do faturamento sem desperdício de verbas publicitárias. ROI controlado unidade a unidade.',
    integration: 'Utiliza os analytics do MI e as taxas de conversão do CRM para retroalimentar os algoritmos de investimento.',
    acquired: false,
    banner: '/arkos_growth_v2_1775140991666.png',
    iconType: 'trending'
  },
  strategy: { 
    title: 'Planejamento Estratégico', 
    tag: 'PEC',
    desc: 'Planejamento dinâmico orientado por dados.', 
    whatItIs: 'O cérebro estratégico da suite. Transforma a visão dos sócios em metas executáveis, monitoradas e ajustadas em tempo real por modelos de cenários.',
    whatItDoes: 'Cria cenários de "e se" (What-if analysis), define o roadmap de metas anuais e desdobra objetivos estratégicos até o nível operacional.',
    results: 'Alinhamento total da empresa com a visão do fundador e agilidade para mudar a rota perante choques brutos de mercado.',
    integration: 'Consolida outputs de todos os outros módulos para garantir que a estratégia tenha "pernas" (execução) em todos os níveis.',
    acquired: false,
    banner: '/arkos_strategy_v2_1775141013223.png',
    iconType: 'target'
  },
  academy: { 
    title: 'Edtech Academy', 
    tag: 'EDT',
    desc: 'Letramento digital para alta performance.', 
    whatItIs: 'Uma plataforma de capacitação que garante que a tecnologia da Arkos seja efetivamente utilizada por todos, fechando o gap de conhecimento.',
    whatItDoes: 'Entrega treinamentos sob demanda, certificações internas de processos e garante que a cultura de dados (Data Literacy) permeie toda a corporação.',
    results: 'Maior adoção das ferramentas, aumento da produtividade individual e criação de uma barreira competitiva via capital intelectual.',
    integration: 'Sincroniza currículos e progresso de aprendizado diretamente com o módulo de Talent Intelligence (ATI).',
    acquired: false,
    banner: '/arkos_academy_v2_1775141033972.png',
    iconType: 'sparkles'
  },
  commerce: { 
    title: 'Central de Comércio Inteligente', 
    tag: 'CCI',
    desc: 'Motor financeiro robusto para B2B.', 
    whatItIs: 'A central que governa as transações financeiras complexas da Arkos, focada em e-commerce B2B e receitas recorrentes.',
    whatItDoes: 'Gerencia subscrições, faturamento automático, split de pagamentos e fluxos de checkout agnósticos a gateways bancários.',
    results: 'Redução drástica na inadimplência, automação de 100% do faturamento e visão clara do LTV de cada cliente.',
    integration: 'Alimenta o fluxo financeiro do CLM e recebe dados de conversão do CRM.',
    acquired: false,
    banner: '/arkos_commerce_v2_1775141111185.png',
    iconType: 'trending'
  },
  infra: { 
    title: 'Gestão de Tecnologia e Cyber', 
    tag: 'GTC',
    desc: 'Monitoramento e segurança 24/7.', 
    whatItIs: 'O escudo tecnológico da Arkos. Uma camada de proteção e monitoramento que garante que sua infraestrutura seja impenetrável e resiliente.',
    whatItDoes: 'Realiza monitoramento de carga síncrono, segurança lógica contra invasões, backups determinísticos e otimização de custos de nuvem.',
    results: 'Disponibilidade de 99.9% dos sistemas, proteção de dados críticos contra vazamentos e economia em infraestrutura cloud.',
    integration: 'Protege todos os endpoints de dados da Suite e garante a integridade dos pipelines do módulo GDB.',
    acquired: false,
    banner: '/arkos_infra_v2_1775141129587.png',
    iconType: 'shield'
  },
  pedidos: { 
    title: 'Governança de Service Desk', 
    tag: 'GSD',
    desc: 'Eficiência operacional em chamados e suporte.', 
    whatItIs: 'A central de requisições unificada que organiza o caos operacional de chamados, compras e suporte técnico ou administrativo.',
    whatItDoes: 'Gere tickets com controle rigoroso de SLA, automatiza fluxos de aprovação de compras e audita a eficiência de resolução de problemas.',
    results: 'Aumento na satisfação do cliente interno/externo e identificação clara de gargalos operacionais que consomem margem.',
    integration: 'Utiliza a inteligência do AIA (Agentes de IA) para resolver chamados simples sem intervenção humana.',
    acquired: false,
    banner: '/arkos_service_v2_1775141149450.png',
    iconType: 'workflow'
  }
}

function getIcon(type: string) {
  switch (type) {
    case 'sparkles': return <Sparkles size={20} />
    case 'workflow': return <Workflow size={20} />
    case 'trending': return <TrendingUp size={20} />
    case 'shield': return <ShieldCheck size={20} />
    case 'layout': return <Layout size={20} />
    case 'cpu': return <Cpu size={20} />
    case 'target': return <Target size={20} />
    default: return <Package size={20} />
  }
}

export default function ModuloDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  if (!id) return null

  const item = moduleDetails[id as keyof typeof moduleDetails]

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070A0F', color: '#FFF' }}>
        <p style={{ color: '#8A8F99', marginBottom: '16px' }}>Módulo não encontrado.</p>
        <button onClick={() => router.push('/dashboard/modulos')} style={{ background: '#C8F542', color: '#000', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800 }}>
          Voltar para Suite
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: '#070A0F', minHeight: '100vh', color: '#F4F2ED', width: '100%', position: 'relative' }}>
      
      {/* ── HEADER PREMIUM (Simulando Home com Menu) ────────────────── */}
      <header style={headerStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/">
            <img src="/logo-high-res.svg" alt="ARKOS" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
        
        <nav style={headerStyles.nav} className="hide-on-mobile">
          <Link href="/institucional/o-problema" style={headerStyles.navLink}>O Problema</Link>
          <Link href="/institucional/a-solucao" style={headerStyles.navLink}>Solução</Link>
          <Link href="/institucional/o-ecossistema" style={headerStyles.navLink}>Ecossistema</Link>
          <Link href="/institucional/o-hub-arkos" style={headerStyles.navLink}>Hub Arkos</Link>
          <Link href="/institucional/diferencial" style={headerStyles.navLink}>Diferencial</Link>
        </nav>

        <button onClick={() => router.push('/dashboard/modulos')} style={{ background: 'transparent', border: 'none', color: '#C8F542', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <ArrowLeft size={16} /> Voltar para Suite
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'start' }}>
          
          {/* Lado Esquerdo: Conteúdo */}
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ 
                background: item.acquired ? 'rgba(200,245,66,0.1)' : 'rgba(255,255,255,0.03)', 
                color: item.acquired ? '#C8F542' : '#8A8F99', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                fontSize: '0.625rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                border: `1px solid ${item.acquired ? 'rgba(200,245,66,0.2)' : 'rgba(255,255,255,0.05)'}`
              }}>
                {item.acquired ? '✓ Módulo Adquirido' : '⚡ Módulo Disponível'}
              </span>
              <span style={{ color: '#C8F542', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                {getIcon(item.iconType)} {item.tag}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {item.title}
            </h1>

            <section style={{ marginBottom: '40px' }}>
              <h3 style={{ color: '#C8F542', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '2px' }}>O que é & O que faz</h3>
              <p style={{ color: '#F4F2ED', fontSize: '1.125rem', lineHeight: 1.6, fontWeight: 300, marginBottom: '20px' }}>{item.whatItIs}</p>
              <p style={{ color: '#8A8F99', fontSize: '0.938rem', lineHeight: 1.7 }}>{item.whatItDoes}</p>
            </section>

            <section style={{ marginBottom: '40px', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                   <h3 style={{ color: '#C8F542', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '2px' }}>Resultados</h3>
                   <p style={{ color: '#F4F2ED', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.results}</p>
                </div>
                <div>
                   <h3 style={{ color: '#C8F542', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '2px' }}>Integração Hub</h3>
                   <p style={{ color: '#F4F2ED', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.integration}</p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Sparkles size={20} color="#C8F542" style={{ marginTop: '4px' }} />
                <p style={{ color: '#8A8F99', fontSize: '0.813rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "A junção da inteligência de dados em todos os setores corporativos através da Arkos Intelligence cria um diferencial competitivo inalcançável por gestões baseadas em silos de informação."
                </p>
              </div>
            </section>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {item.acquired ? (
                <button 
                  onClick={() => router.push(id === 'clm' ? '/dashboard/contratos' : '#')}
                  style={{ 
                    background: '#C8F542', 
                    color: '#070A0F', 
                    fontWeight: 800, 
                    fontSize: '0.875rem', 
                    padding: '16px 32px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    cursor: 'pointer', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    boxShadow: '0 8px 24px rgba(200, 245, 66, 0.25)'
                  }}
                >
                  Entrar no Módulo
                </button>
              ) : (
                <button 
                  disabled
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    color: '#8A8F99', 
                    fontWeight: 800, 
                    fontSize: '0.875rem', 
                    padding: '16px 32px', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    cursor: 'not-allowed', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px'
                  }}
                >
                  Em Desenvolvimento
                </button>
              )}

              {!item.acquired && (
                <a href="https://wa.me/5583981957737" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ 
                    background: 'transparent', 
                    color: '#C8F542', 
                    fontWeight: 800, 
                    fontSize: '0.875rem', 
                    padding: '16px 32px', 
                    borderRadius: '12px', 
                    border: '1px solid #C8F542', 
                    cursor: 'pointer', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px'
                  }}>
                    <MessageCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Quero Adquirir
                  </button>
                </a>
              )}
            </div>
          </div>

          {/* Lado Direito: Visual Premium */}
          <div style={{ position: 'sticky', top: '140px' }}>
            <div style={{ 
              borderRadius: '24px', 
              overflow: 'hidden', 
              border: `2px solid ${item.acquired ? '#C8F542' : 'rgba(255,255,255,0.1)'}`, 
              boxShadow: item.acquired ? '0 0 40px rgba(200,245,66,0.1)' : 'none',
              transition: 'all 0.3s',
              background: '#000'
            }}>
              <img 
                src={item.banner} 
                alt={item.title} 
                style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000'
                }}
              />
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
               <p style={{ fontSize: '0.75rem', color: '#5A5F6A', fontFamily: 'monospace' }}>ARKOS · ECOSYSTEM · {item.tag}</p>
            </div>
          </div>

        </div>

      </main>

      {/* Footer link duplication as requested */}
      <div style={{ padding: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
         <nav style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/institucional/o-problema" style={headerStyles.navLink}>O Problema</Link>
            <Link href="/institucional/a-solucao" style={headerStyles.navLink}>Solução</Link>
            <Link href="/institucional/o-ecossistema" style={headerStyles.navLink}>Ecossistema</Link>
            <Link href="/institucional/o-hub-arkos" style={headerStyles.navLink}>Hub Arkos</Link>
            <Link href="/institucional/diferencial" style={headerStyles.navLink}>Diferencial</Link>
         </nav>
      </div>

      <Footer />
    </div>
  )
}
