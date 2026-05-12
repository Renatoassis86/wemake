'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import styles from './CompetidoresSeccion.module.css'

export default function CompetidoresSeccion() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Force the iframe to reload with autoplay when it enters viewport (mobile workaround)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && iframeRef.current) {
            const src = iframeRef.current.src
            if (!src.includes('autoplay=1')) return
            // Reset src to force reload and trigger autoplay
            iframeRef.current.src = ''
            setTimeout(() => {
              if (iframeRef.current) iframeRef.current.src = src
            }, 100)
          }
        })
      },
      { threshold: 0.3 }
    )
    if (iframeRef.current) observer.observe(iframeRef.current)
    return () => observer.disconnect()
  }, [])
  const empresas = [
    { name: 'Netflix', logo: '/netflix_logo_final_1774226938106.png' },
    { name: 'Amazon', logo: '/amazon_logo_1774226927016.png' },
    { name: 'Capital One', logo: '/capital_one_logo_1774226915516.png' },
    { name: 'Google', logo: '/google_logo_1774223514822.png' },
    { name: 'Walmart', logo: '/walmart_logo_wm_1774224400966.png' },
    { name: 'UPS', logo: '/ups_logo_1774225354790.png' },
    { name: 'LinkedIn', logo: '/linkedin_logo_1774226742798.png' },
    { name: 'Progressive', logo: '/progressive_logo_1774226810879.png' },
    { name: 'Caesars', logo: '/caesars.png' },
    { name: 'Patriots', logo: '/patriots.png' }
  ]

  return (
    <section id="competidores" className={styles.section}>
      <div className={styles.container}>
        
        {/* --- HEADER --- */}
        <div className={styles.header}>
          <div style={{ fontFamily: 'monospace', color: '#C8F542', fontSize: '0.688rem', letterSpacing: '2px', marginBottom: '12px' }}>O BENCHMARK MÁXIMO</div>








          <div className={styles.caseGrid} style={{ position: 'relative', zIndex: 1 }}>
            
            <div className={styles.caseContent}>
              <div className={styles.videoBgContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6, overflow: 'hidden', borderRadius: '16px' }}>
                {/* Desktop Video (Restored & Impactful) */}
                <div className={styles.desktopOnly} style={{ position: 'absolute', inset: 0 }}>
                  <iframe 
                    ref={iframeRef}
                    src="https://www.youtube.com/embed/GV3HUDMQ-F8?autoplay=1&mute=1&controls=0&loop=1&playlist=GV3HUDMQ-F8&modestbranding=1&rel=0&playsinline=1&enablejsapi=1" 
                    className={styles.videoBg}
                    style={{ filter: 'brightness(0.9) contrast(1.1)' }}
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    title="Netflix Analytics"
                  />
                </div>


                
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(17,19,24,0.2), rgba(17,19,24,0.95))' }}></div>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <h3 style={{ color: '#F4F2ED', fontSize: '2.25rem', fontWeight: 800, fontFamily: 'Sora, sans-serif' }}>O Caso Netflix</h3>
              </div>
              
              <p style={{ color: '#8A8F99', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                A Netflix, como uma empresa no Estágio 5 de maturidade (Competidor Analítico), diferencia-se por medir, testar e analisar o comportamento de seus usuários em um nível de granularidade extremo.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { t: 'Métricas de Recomendação e Preferência (Cinematch)', d: 'O algoritmo da empresa avalia milhares de classificações por segundo para personalizar a página de cada cliente com base en mais de um bilhão de opiniões e feedbacks.' },
                  { t: 'Análise de Atributos de Conteúdo', d: 'Para prever o sucesso de produções originais (como House of Cards), a empresa analisou 70 mil atributos de filmes, popularidade do diretor (David Fincher) e ator principal (Kevin Spacey) antes de fechar o contrato.' },
                  { t: 'Métricas Rigorosas de Testes A/B', d: 'Cultura de experimentação contínua com 1.000 ensaios anuais. Mensuram o tempo exato assistindo trailers, taxas de resposta em pesquisas e quantidade de filmes adicionados à lista.' },
                  { t: 'Métricas de Volume e Engajamento', d: 'Capacidade de gerenciar e analisar dados em altíssima escala, monitorando fluxos massivos como a transmissão de 69.444 horas de vídeo por minuto.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={18} color="#C8F542" style={{ marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#F4F2ED', fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>{item.t}</div>
                      <div style={{ color: '#8A8F99', fontSize: '0.85rem', lineHeight: '1.4' }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            
              </div></div>

            <div className={styles.caseStats} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div style={{ color: '#C8F542', fontSize: '1.8rem', fontWeight: 800 }}>325 mi</div>
                  <div style={{ color: '#8A8F99', fontSize: '0.75rem' }}>assinantes ativos globais</div>
                </div>
                <div className={styles.statCard}>
                  <div style={{ color: '#C8F542', fontSize: '1.8rem', fontWeight: 800 }}>US$ 2,4 Bi</div>
                  <div style={{ color: '#8A8F99', fontSize: '0.75rem' }}>lucro líquido (4º Tri 2025)</div>
                </div>
                <div className={styles.statCard}>
                  <div style={{ color: '#C8F542', fontSize: '1.8rem', fontWeight: 800 }}>96 Bi h</div>
                  <div style={{ color: '#8A8F99', fontSize: '0.75rem' }}>conteúdos assistidos por semestre</div>
                </div>
                <div className={styles.statCard}>
                  <div style={{ color: '#C8F542', fontSize: '1.8rem', fontWeight: 800 }}>US$ 45 Bi</div>
                  <div style={{ color: '#8A8F99', fontSize: '0.75rem' }}>receita total anual recorde</div>
                </div>
              </div>

              {/* CARD DESTAQUE: O QUE ESSA ESTRATÉGIA RENDEU */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(200,245,66,0.05), rgba(17,19,24,0.9))', 
                  border: '1px solid rgba(200,245,66,0.15)', 
                    padding: '24px', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ color: '#C8F542', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px' }}>CRESCIMENTO ABSOLUTO</div>
                <h4 style={{ color: '#F4F2ED', fontSize: '1.25rem', fontWeight: 800 }}>O que a Estratégia Rendeu em 2025?</h4>
                <p style={{ color: '#8A8F99', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  A estabilidade analítica garantiu uma margem operacional recorde de <strong>24,5%</strong>. Essa solidez financeira permitiu à Netflix propor uma compra histórica de <strong>US$ 82,7 bilhões</strong> da <em>Warner Bros. Discovery</em> 100% all-cash, consolidando-se como uma força imbatível contra a concorrência tradicional.
                </p>
                <p style={{ color: '#C8F542', fontSize: '0.85rem', fontWeight: 700 }}>
                   O volume de dados em tempo real sustenta investimentos bilionários com risco mitigado.
                </p>
              </div>
            </div>
          </div>

          {/* --- OUTROS CASES GRID --- */}
          <div style={{ marginTop: '80px' }}>
            <h4 style={{ color: '#F4F2ED', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px', fontFamily: 'Sora, sans-serif' }}>Outras Organizações que Competem Analiticamente</h4>
            <div style={{ width: '40px', height: '3px', background: '#C8F542', margin: '0 auto 16px auto' }}></div>
            <p style={{ color: '#8A8F99', fontSize: '0.9rem', textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>Benchmarks globais que comprovam como a ciência de dados reconfigura indústrias inteiras.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Amazon', logo: '/logos/amazon.png', text: 'A <strong>Amazon</strong> utiliza técnicas avançadas de otimização em tempo real e aprendizado de máquina em toda a sua cadeia de suprimentos para gerenciar estoques com base na incerteza da demanda.' },
                { name: 'Capital One', logo: '/logos/capital_one.svg', text: 'A <strong>Capital One</strong> é pioneira em "estratégias baseadas em informações", conduzindo cerca de 8.000 testes de marketing por ano para atrair clientes lucrativos com precisão.' },
                { name: 'Google', logo: '/logos/google.png', text: 'O <strong>Google</strong> aplica o rigor analítico a algoritmos de busca e ao "People Operations", utilizando ciência de dados para formar melhores líderes e estratégias de retenção.' },
                { name: 'Walmart', logo: '/logos/walmart.svg', text: 'O <strong>Walmart</strong> é referência em supply-chain, compartilhando dados em tempo real com 60 mil fornecedores via Retail Link, prevendo demandas sazonais ou atípicas.' },
                { name: 'UPS', logo: '/logos/ups.svg', text: 'A <strong>UPS</strong> investiu no sistema ORION, que otimiza rotas de 55 mil motoristas diariamente, gerando economia de centenas de milhões de dólares ao ano.', keepDetails: true },
                { name: 'Caesars Entertainment', logo: '/logos/caesars.svg', text: 'A <strong>Caesars Entertainment</strong> revolucionou o setor de cassinos fidelizando clientes por meio de análise de dados no ponto de venda para ofertas personalizadas.' },
                { name: 'Progressive', logo: '/logos/progressive.svg', text: 'A <strong>Progressive</strong> destaca-se pelo programa Snapshot, precificando seguros dinamicamente ao coletar dados reais sobre como o cliente dirige.' },
                { name: 'Times Esportivos (Patriots)', logo: ['/logos/patriots.svg', '/logos/oakland_as.svg'], text: 'Os <strong>Patriots</strong> e Oakland A\'s utilizam estatística avançada para montar equipes e definir jogadas, avaliando a psicologia dos atletas.', keepDetails: true }
              ].map((c) => (
                 <div key={c.name} style={{ background: '#111318', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                       {Array.isArray(c.logo) ? (
                           c.logo.map((l, i) => (
                               <img key={i} src={l} style={{ height: '40px', width: 'fit-content', maxWidth: '140px', filter: c.keepDetails ? 'grayscale(100%) brightness(1.2)' : 'brightness(0) invert(1)', opacity: 1.0, objectFit: 'contain' }} alt={c.name} />
                           ))
                       ) : (
                           <img src={c.logo} style={{ height: '40px', width: 'fit-content', maxWidth: '140px', filter: c.keepDetails ? 'grayscale(100%) brightness(1.2)' : 'brightness(0) invert(1)', opacity: 1.0, objectFit: 'contain' }} alt={c.name} />
                       )}
                    </div>
                    <div>
                      <p style={{ color: '#8A8F99', fontSize: '0.8rem', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: c.text }} />
                    </div>
                 </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
