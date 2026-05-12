'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Award, Zap, Building2, UserCircle2, Mail, Users, Compass, ShieldCheck } from 'lucide-react'
import { saveDiagnostico } from '@/app/actions/save-diagnostico'
import styles from './DiagnosticoHub.module.css'

export default function DiagnosticoHub() {
  const [step, setStep] = useState<'intro' | 'lead' | 'quiz' | 'loading' | 'result'>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [lead, setLead] = useState({ nome: '', empresa: '', email: '', whatsapp: '' })
  const [scoreData, setScoreData] = useState<any>(null)

  // 1. Array de Perguntas (20)
  const perguntas = [
    // Bloco 1: LIDERANÇA (L)
    { id: 1, block: 'LIDERANÇA', text: 'Em grandes decisões estratégicas, qual é a atitude do CEO ou Diretoria?', options: [
      { id: 'A', text: 'Decidem puramente baseados em instinto e experiência passada.' },
      { id: 'B', text: 'Pedem relatórios, mas cada diretor defende os números do seu próprio silo.' },
      { id: 'C', text: 'Exigem dados corporativos consistentes, mas a TI demora a entregá-lo.' },
      { id: 'D', text: 'Agem como "farejadores de dados", usando dashboards para decisões rápidas e preditivas.' }
    ]},
    { id: 2, block: 'LIDERANÇA', text: 'Quando um dado analítico contraria a opinião de um gerente experiente, o que ocorre?', options: [
      { id: 'A', text: 'O dado é ignorado e a intuição vence.' },
      { id: 'B', text: 'Há ceticismo e o dado é torturado até confessar o que o gerente quer.' },
      { id: 'C', text: 'O dado é aceito, mas a mudança real na operação é muito lenta.' },
      { id: 'D', text: 'A empresa tem uma cultura ágil de "teste e aprendizado" e muda a rota na hora.' }
    ]},
    { id: 3, block: 'LIDERANÇA', text: 'Qual a visão da empresa sobre investimentos em Inteligência e Dados?', options: [
      { id: 'A', text: 'Um custo que deve ser mantido ao mínimo.' },
      { id: 'B', text: 'Um projeto da TI que o negócio não entende muito bem.' },
      { id: 'C', text: 'Uma necessidade, mas ainda sofre para provar seu ROI.' },
      { id: 'D', text: 'O pilar da vantagem competitiva, com patrocínio apaixonado do alto escalão.' }
    ]},
    { id: 4, block: 'LIDERANÇA', text: 'Os líderes da sua empresa promovem uma cultura meritocrática baseada em números?', options: [
      { id: 'A', text: 'Não, avaliações são subjetivas e políticas.' },
      { id: 'B', text: 'Apenas em áreas óbvias, como metas de vendas isoladas.' },
      { id: 'C', text: 'Sim, mas faltam indicadores claros que unam a empresa toda.' },
      { id: 'D', text: 'Sim, métricas guiam bônus, promoções e a gestão implacável da operação.' }
    ]},
    
    // Bloco 2: Empreendimento (E)
    { id: 5, block: 'EMPREENDIMENTO', text: 'Como os dados fluem pela empresa (Finanças, Vendas, RH, Logística)?', options: [
      { id: 'A', text: 'Temos "ilhas de dados". Os departamentos não se falam.' },
      { id: 'B', text: 'Planilhas (geralmente com erros) são trocadas por e-mail.' },
      { id: 'C', text: 'Temos sistemas robustos, mas os dados ainda precisam de conciliação manual.' },
      { id: 'D', text: 'Possuímos uma "única versão da verdade", gerida com uma perspectiva empresarial.' }
    ]},
    { id: 6, block: 'EMPREENDIMENTO', text: 'Quando há um problema complexo (margem caindo), como ele é investigado?', options: [
      { id: 'A', text: 'No escuro. Descobrimos tarde demais.' },
      { id: 'B', text: 'Cada departamento apresenta sua versão e a culpa é transferida.' },
      { id: 'C', text: 'Um comitê se reúne para tentar cruzar dados de diferentes bases.' },
      { id: 'D', text: 'Plataformas visuais mostram a raiz do problema quase em tempo real.' }
    ]},
    { id: 7, block: 'EMPREENDIMENTO', text: 'O financiamento de tecnologia na sua empresa é feito como?', options: [
      { id: 'A', text: 'Quando quebra, a gente compra.' },
      { id: 'B', text: 'Cada área compra seus softwares, gerando fragmentação.' },
      { id: 'C', text: 'Centralizado na TI, mas sem grande alinhamento com a estratégia.' },
      { id: 'D', text: 'TI e Negócios operam lado a lado, investindo em vantagem competitiva.' }
    ]},
    { id: 8, block: 'EMPREENDIMENTO', text: 'Qual o nível de automação das decisões táticas diárias?', options: [
      { id: 'A', text: 'Zero. Tudo depende de aprovação humana manual.' },
      { id: 'B', text: 'Apenas em aprovações financeiras básicas de sistema.' },
      { id: 'C', text: 'Algumas regras de negócio alertam gestores sobre exceções.' },
      { id: 'D', text: 'Algoritmos tomam decisões automatizadas e integradas (Ex: preços e rotas).' }
    ]},

    // Bloco 3: Dados (D)
    { id: 9, block: 'DADOS', text: 'Qual a qualidade atual da base de dados da empresa?', options: [
      { id: 'A', text: 'Inconsistente, cheia de duplicidades e falta de padrão.' },
      { id: 'B', text: 'Requer semanas de limpeza manual (processo doloroso).' },
      { id: 'C', text: 'Organizada, mas presa dentro dos sistemas de origem (ERP/CRM).' },
      { id: 'D', text: 'Dados integrados, precisos e disponíveis em repositórios corporativos.' }
    ]},
    { id: 10, block: 'DADOS', text: 'O que vocês fazem com o gigantesco volume de dados gerado?', options: [
      { id: 'A', text: 'Não armazenamos, ou só guardamos por obrigação fiscal.' },
      { id: 'B', text: 'Criamos relatórios para ver "o que aconteceu" no passado.' },
      { id: 'C', text: 'Tentamos responder "por que aconteceu" com cruzamento de dados.' },
      { id: 'D', text: 'Usamos algoritmos para saber "o que vai acontecer" (Análise Preditiva).' }
    ]},
    { id: 11, block: 'DADOS', text: 'Como vocês utilizam dados não-estruturados e informações externas?', options: [
      { id: 'A', text: 'Nunca usamos.' },
      { id: 'B', text: 'De forma pontual, lendo notícias ou relatórios esporádicos.' },
      { id: 'C', text: 'Compramos dados de terceiros, mas não integramos aos nossos.' },
      { id: 'D', text: 'Vasculhamos o mercado e cruzamos variáveis externas o tempo todo.' }
    ]},
    { id: 12, block: 'DADOS', text: 'Quem em sua empresa tem facilidade de acessar insights nos dados?', options: [
      { id: 'A', text: 'Ninguém confia nos dados atuais.' },
      { id: 'B', text: 'Apenas especialistas de TI que extraem os relatórios.' },
      { id: 'C', text: 'Gerentes que recebem dashboards padronizados.' },
      { id: 'D', text: 'Gestores da linha de frente possuem "análise de autoatendimento" em tempo real.' }
    ]},

    // Bloco 4: Alvos (T)
    { id: 13, block: 'ALVOS', text: 'Ao traçar a estratégia, onde a empresa aplica seus maiores esforços de análise?', options: [
      { id: 'A', text: 'Atiramos para todos os lados sem alvo definido.' },
      { id: 'B', text: 'Tentamos melhorar atividades funcionais desconexas.' },
      { id: 'C', text: 'Escolhemos métricas-chave, mas reagimos em vez de antecipar.' },
      { id: 'D', text: 'Focamos pesadamente na nossa competência distintiva para dominar o mercado.' }
    ]},
    { id: 14, block: 'ALVOS', text: 'Na hora de gerir clientes, qual é o nível de precisão?', options: [
      { id: 'A', text: 'Tratamos todos os clientes exatamente da mesma forma.' },
      { id: 'B', text: 'Dividimos em blocos demográficos amplos.' },
      { id: 'C', text: 'Identificamos os mais rentáveis e focamos neles.' },
      { id: 'D', text: 'Calculamos propensão de compra e LTV para ofertas hiperpersonalizadas.' }
    ]},
    { id: 15, block: 'ALVOS', text: 'Como vocês precificam produtos ou serviços?', options: [
      { id: 'A', text: 'Baseado no custo mais uma margem, ou copiando o concorrente.' },
      { id: 'B', text: 'Fazemos descontos quando as vendas caem.' },
      { id: 'C', text: 'Usamos planilhas que sugerem faixas de preços sazonais.' },
      { id: 'D', text: 'Otimização algorítmica: precificação dinâmica ajustada à demanda.' }
    ]},
    { id: 16, block: 'ALVOS', text: 'Na hora de inovar, lançar um produto, qual é a base da decisão?', options: [
      { id: 'A', text: 'Palpite do dono ou cópia do mercado.' },
      { id: 'B', text: 'Pesquisas tradicionais e longas reuniões de comitê.' },
      { id: 'C', text: 'Observamos o histórico do que deu certo antes.' },
      { id: 'D', text: 'Simulações profundas, modelagem preditiva e testes rigorosos.' }
    ]},

    // Bloco 5: Analistas (A)
    { id: 17, block: 'ANALISTAS', text: 'Quem é o responsável por gerar inteligência competitiva hoje?', options: [
      { id: 'A', text: 'Não temos essa função.' },
      { id: 'B', text: 'Funcionários usando Excel que perdem 80% do tempo arrumando planilhas.' },
      { id: 'C', text: 'Analistas que estão ilhados em departamentos específicos.' },
      { id: 'D', text: 'Um CDAO e equipe centralizada de cientistas de dados altamente capacitados.' }
    ]},
    { id: 18, block: 'ANALISTAS', text: 'Como é o treinamento para letramento em dados (data literacy) da sua equipe?', options: [
      { id: 'A', text: 'Inexistente.' },
      { id: 'B', text: 'Restrito a ensinar a equipe a apertar os botões do sistema.' },
      { id: 'C', text: 'Gestores são treinados para ler indicadores de performance.' },
      { id: 'D', text: 'Constante. Exigimos habilidades numéricas e experimentais desde o recrutamento.' }
    ]},
    { id: 19, block: 'ANALISTAS', text: 'Quais ferramentas a equipe de estratégia utiliza no dia a dia?', options: [
      { id: 'A', text: 'Calculadoras, cadernos e instinto.' },
      { id: 'B', text: 'Excel e funções matemáticas.' },
      { id: 'C', text: 'Ferramentas de Business Intelligence (BI) para relatórios visuais.' },
      { id: 'D', text: 'Softwares predíticos, aprendizado de máquina, R ou Python.' }
    ]},
    { id: 20, block: 'ANALISTAS', text: 'O que acontece quando os dados apresentam um cenário "fora da caixa"?', options: [
      { id: 'A', text: 'Geram desconfiança e são rapidamente engavetados.' },
      { id: 'B', text: 'Acham interessante, mas a empresa não sabe como executar.' },
      { id: 'C', text: 'O RH ou a TI são culpados pelos números.' },
      { id: 'D', text: 'A liderança confia no modelo, ajusta a estratégia e cria novos testes.' }
    ]}
  ]

  const totalQuestions = perguntas.length
  const currentProgress = ((currentQuestion) / totalQuestions) * 100

  const handleAnswerSelect = (optId: string) => {
    setAnswers(prev => ({ ...prev, [perguntas[currentQuestion].id]: optId }))
    
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }, 200)
  }

  const handleSubmit = async () => {
    setStep('loading')
    const result = await saveDiagnostico(lead, answers)
    if (result.success) {
      setScoreData(result.data)
      setStep('result')
    } else {
      alert('Erro ao salvar. Tente novamente.')
      setStep('quiz')
    }
  }

  const getEstagioNome = (lvl: number) => {
    const list = [
      'Deficientes Analíticos',
      'Empresas de Análise Localizada',
      'Aspirantes Analíticos',
      'Empresas Analíticas',
      'Competidores Analíticos'
    ]
    return list[lvl - 1] || 'Deficientes Analíticos'
  }

  return (
    <div className={styles.container}>
      {/* ── SEÇÃO 1: MATURIDADE ── */}
      {step === 'intro' && (
        <section className={styles.sectionFull}>
          <div className={styles.headerCentered}>
            <div className={styles.tag}>Framework: Competição Analítica</div>
            <h2 className={styles.title} style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '40px', textTransform: 'uppercase' }}>Os 5 Estágios de Maturidade Analítica</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '60px' }}>
            
            {/* Os Blocos da Pirâmide Centralizados */}
            <div className={styles.stairInfographic} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0px', padding: '0px' }}>
              {[
                { lvl: 1, t: 'Deficientes Analíticos', d: 'Atuam no escuro, sem dados padronizados e sem interesse analítico.' },
                { lvl: 2, t: 'Análise Localizada', d: 'O uso de dados ocorre em silos funcionais sem integração corporativa.' },
                { lvl: 3, t: 'Aspirantes Analíticos', d: 'Reconhecem a importância e iniciam integração de dados centralmente.' },
                { lvl: 4, t: 'Empresas Analíticas', d: 'Possuem visão corporativa e usam análise para se diferenciar no mercado.' },
                { lvl: 5, t: 'Competidores Analíticos', d: 'O nível máximo. Utilizam análise como sua principal vantagem sustentável.' }
              ].map((item, idx) => (
                <div 
                  key={item.lvl} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    width: '100%', 
                    margin: '0', 
                    padding: '0',
                    zIndex: 10 - idx,
                    transform: 'none'
                  }}
                >
                  <div 
                    className={`${styles.statCard} ${styles[`level${item.lvl}`]}`}
                    style={{ 
                      borderRadius: item.lvl === 1 ? '20px 20px 0 0' : item.lvl === 5 ? '0 0 20px 20px' : '0',
                      border: '1px solid rgba(200,245,66,0.3)',
                      borderBottom: item.lvl === 5 ? '2px solid #C8F542' : 'none',
                      borderTop: item.lvl === 1 ? '2px solid #C8F542' : '1px solid rgba(200,245,66,0.2)',
                      background: item.lvl === 1 ? 'linear-gradient(to bottom, rgba(200,245,66,0.05), #111318)' : item.lvl === 5 ? 'linear-gradient(to top, rgba(200,245,66,0.1), #111318)' : '#111318',
                      position: 'relative',
                      margin: '0 auto',
                      padding: '28px',
                      boxShadow: item.lvl === 5 ? '0 10px 40px rgba(200,245,66,0.15)' : 'none',
                      flexShrink: 0
                    } as React.CSSProperties}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', paddingTop: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#C8F542', fontSize: '0.85rem', fontFamily: 'monospace', opacity: 0.7, letterSpacing: '2px' }}>ESTÁGIO {item.lvl}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#F4F2ED', marginBottom: '6px', textAlign: 'center' }}>{item.t}</div>
                    <div style={{ fontSize: '0.813rem', color: '#8F94A3', lineHeight: '1.5', textAlign: 'center', maxWidth: '420px', margin: '0 auto' }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão High-Light Centered */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '50px', gap: '12px' }}>
            <p style={{ color: '#8A8F99', fontSize: '0.85rem', textAlign: 'center' }}>Faça nosso teste rápido e saiba em qual patamar sua empresa se encontra.</p>
            <Link href="/diagnostico" className={styles.btnLargeHero} target="_blank">
              Iniciar Diagnóstico de Maturidade <ArrowRight size={22} color="#000" />
            </Link>
          </div>
        </section>
      )}

      {/* ── SEÇÃO 2: DELTA (Light Mode horizontalizado) ── */}
      {step === 'intro' && (
        <div className={styles.sectionLight}>
          <div className={styles.sectionLightFull}>
            
            <div className={styles.headerCenteredDelta}>
              <div className={styles.tag} style={{ background: '#0A0C0F', color: '#C8F542' }}>Estrutura DELTA</div>
              <h2 className={styles.title} style={{ color: '#0A0C0F', fontSize: '2.5rem' }}>A Infraestrutura da Inteligência Comercial</h2>
              <p style={{ color: '#5A5F6A', fontSize: '1rem', maxWidth: '700px', textAlign: 'center', marginTop: '12px' }}>
                Segundo <strong>Thomas H. Davenport</strong> no clássico <em>"Competição Analítica"</em>, estes cinco pilares sustentam a escalada de maturidade corporativa.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', width: '100%', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }} className={styles.deltaLayoutGrid}>
              
              {/* VÍDEO (LADO ESQUERDO) */}
              <div className={styles.mediaWrapperDelta} style={{ margin: 0, height: '480px', position: 'relative', background: 'transparent', borderRadius: '32px 32px 500px 500px', overflow: 'hidden' }}>
                <video 
                  src="/delta.mp4" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    borderRadius: '0', /* Já contido pelo pai com overflow:hidden */
                    display: 'block',
                    filter: 'none' /* Garantir sem efeitos */
                  }}
                />
              </div>

              {/* LISTA VERTICAL (LADO DIREITO) */}
              <div className={styles.deltaVerticalList}>
                {[
                  { l: 'D', t: 'DATA', d: 'Dados integrados e precisos como ativo estratégico.' },
                  { l: 'E', t: 'ENTERPRISE', d: 'Quebra de silos departamentais unificando a tecnologia.' },
                  { l: 'L', t: 'LEADERSHIP', d: 'Executivos que exigem decisões baseadas em fatos.' },
                  { l: 'T', t: 'TARGETS', d: 'Foco estratégico onde algoritmos direcionam o ROI.' },
                  { l: 'A', t: 'ANALYSTS', d: 'Ciência de dados unida ao talento executivo ágil.' }
                ].map((d) => (
                  <div key={d.l} className={styles.deltaItemVertical} style={{ background: '#1A1C1F', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    <div className={styles.deltaLetterSmall} style={{ color: '#C8F542', background: 'rgba(200,245,66,0.1)' }}>{d.l}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F4F2ED', marginBottom: '2px' }}>{d.t}</div>
                      <div style={{ fontSize: '0.85rem', color: '#8A8F99', fontWeight: 500, lineHeight: '1.4' }}>{d.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}