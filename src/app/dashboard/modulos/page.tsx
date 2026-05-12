'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Users, ShoppingCart, LogOut, Package, ArrowRight, CheckCircle, MessageCircle, BarChart2, Cpu, Shield } from 'lucide-react'
import styles from './modulos.module.css'

export default function ModulosSelector() {
  const [mounted, setMounted] = useState(false)
  const [isPlayingVideo, setIsPlayingVideo] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Começar a esmaecer após 3.5 segundos (tempo para o vídeo impactar)
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true)
    }, 3500)

    // Remover totalmente após o fade completar (4.5 segundos)
    const removeTimeout = setTimeout(() => {
      setIsPlayingVideo(false)
    }, 4500)

    return () => {
      clearTimeout(fadeTimeout)
      clearTimeout(removeTimeout)
    }
  }, [])

  const modulos = [
    {
      id: 'marketing',
      titulo: 'Marketing Intelligence',
      tag: 'MI',
      desc: 'O marketing atua como gerador supremo de dados decisórios. Operamos desde o digital analítico até a inteligência profunda.',
      link: '/dashboard/modulos/marketing',
      externo: false,
      icon: <BarChart2 size={22} />,
      color: '#FF4D4D',
      hasAccess: false,
      foto: '/arkos_marketing_v2_1775140793051.png'
    },
    {
      id: 'data',
      titulo: 'Governança de Dados e BI',
      tag: 'GDB',
      desc: 'Data warehouse, pipelines conectadas e dashboards preditivos de alta performance para tomada de decisão.',
      link: '/dashboard/modulos/data',
      externo: false,
      icon: <Cpu size={22} />,
      color: '#EC4899',
      hasAccess: false,
      foto: '/arkos_data_v2_1775140815684.png'
    },
    {
      id: 'crm',
      titulo: 'Gestão Comercial (CRM)',
      tag: 'CRM',
      desc: 'Otimize o funil de vendas, propostas comerciais e conversões estratégicas em tempo real.',
      link: '/dashboard/modulos/crm',
      externo: false,
      icon: <ShoppingCart size={22} />,
      color: '#3B82F6',
      hasAccess: false,
      foto: '/arkos_crm_clm_v2_1775140837645.png'
    },
    {
      id: 'clm',
      titulo: 'Gestão de Contratos (CLM)',
      tag: 'CLM',
      desc: 'Centraliza a espinha dorsal financeira e física do negócio: faturamento, fardamento e contratos.',
      link: '/dashboard/contratos',
      externo: false,
      icon: <FileText size={22} />,
      color: '#C8F542',
      hasAccess: true,
      foto: '/arkos_dashboard_decision_1774133572097.png'
    },
    {
      id: 'recrutamento',
      titulo: 'Arkos Talent Intelligence',
      tag: 'ATI',
      desc: 'Redesenho organizacional via NLP e Otimização Matemática para estruturação de cargos e processos.',
      link: '/dashboard/modulos/recrutamento',
      externo: false,
      icon: <Users size={22} />,
      color: '#8B5CF6',
      hasAccess: false,
      foto: '/arkos_talent_v2_1775140860229.png'
    },
    {
      id: 'ai',
      titulo: 'Agentes de IA e Automação',
      tag: 'AIA',
      desc: 'Agentes autônomos treinados com as regras do seu negócio para resolver chamados e automatizar fluxos.',
      link: '/dashboard/modulos/ai',
      externo: false,
      icon: <Cpu size={22} />,
      color: '#F472B6',
      hasAccess: false,
      foto: '/arkos_ai_v2_1775140880134.png'
    },
    {
      id: 'commerce',
      titulo: 'Central de Comércio Inteligente',
      tag: 'CCI',
      desc: 'Motor financeiro robusto para B2B integrado à gestão para e-commerce e faturamento agnóstico.',
      link: '/dashboard/modulos/commerce',
      externo: false,
      icon: <ShoppingCart size={22} />,
      color: '#F43F5E',
      hasAccess: false,
      foto: '/arkos_commerce_v2_1775141111185.png'
    },
    {
      id: 'growth',
      titulo: 'Aceleração de Crescimento',
      tag: 'ACG',
      desc: 'Squads avançados operando tráfego pago escalável e ROI preditivo para empresas que precisam de escala.',
      link: '/dashboard/modulos/growth',
      externo: false,
      icon: <BarChart2 size={22} />,
      color: '#2DD4BF',
      hasAccess: false,
      foto: '/arkos_growth_v2_1775140991666.png'
    },
    {
      id: 'strategy',
      titulo: 'Planejamento Estratégico',
      tag: 'PEC',
      desc: 'Formulação completa e acompanhamento de planos estratégicos dinâmicos orientados por dados.',
      link: '/dashboard/modulos/strategy',
      externo: false,
      icon: <Shield size={22} />,
      color: '#F59E0B',
      hasAccess: false,
      foto: '/arkos_strategy_v2_1775141013223.png'
    },
    {
      id: 'academy',
      titulo: 'Edtech Academy',
      tag: 'EDT',
      desc: 'Plataforma LMS completa para letramento digital da equipe e capacitação preditiva.',
      link: '/dashboard/modulos/academy',
      externo: false,
      icon: <Users size={22} />,
      color: '#EF4444',
      hasAccess: false,
      foto: '/arkos_academy_v2_1775141033972.png'
    },
    {
      id: 'infra',
      titulo: 'Gestão de Tecnologia e Cyber',
      tag: 'GTC',
      desc: 'Monitoramento de infraestrutura, segurança de servidores e otimização de redes.',
      link: '/dashboard/modulos/infra',
      externo: false,
      icon: <Shield size={24} />,
      color: '#14B8A6',
      hasAccess: false,
      foto: '/arkos_infra_v2_1775141129587.png'
    },
    {
      id: 'pedidos',
      titulo: 'Governança de Service Desk',
      tag: 'GSD',
      desc: 'Controle centralizado de chamados e fluxos de atendimento escaláveis com foco em eficiência.',
      link: '/dashboard/modulos/pedidos',
      externo: false,
      icon: <Package size={24} />,
      color: '#06B6D4',
      hasAccess: false,
      foto: '/arkos_service_v2_1775141149450.png'
    }
  ]

  return (
    <div className={styles.container}>
      {/* Video Transition Overlay */}
      {mounted && isPlayingVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: '#070A0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 1.2s ease-in-out',
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <video 
            src="/Futuristic_Corporate_Analytics_Video_Generated.mp4" 
            autoPlay 
            muted 
            playsInline 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* Main Container Grid */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Arkos Suite</h1>
          <p className={styles.subtitle}>
            Selecione o módulo de inteligência empresarial que deseja operar agora.
          </p>
        </div>

        <div className={styles.grid}>
          {modulos.map((modulo) => {
            const CardContent = (
              <div 
                className={`${styles.card} ${modulo.hasAccess ? styles.cardActive : styles.cardInactive}`} 
                style={{ 
                  padding: 0, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer'
                }}
              >
                {/* Imagem de Capa */}
                <div style={{ height: '140px', width: '100%', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <img src={modulo.foto} alt={modulo.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {modulo.hasAccess && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#C8F542', color: '#000', fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Ativo
                    </div>
                  )}
                </div>

                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper} style={{ color: modulo.color }}>
                      {modulo.icon}
                    </div>
                    <span className={styles.accentTag} style={{ color: modulo.color }}>
                      {modulo.tag}
                    </span>
                  </div>
                  
                  <h2 className={styles.cardTitle}>{modulo.titulo}</h2>
                  <p className={styles.cardDesc} style={{ margin: 0, flexGrow: 1, fontSize: '0.783rem' }}>{modulo.desc}</p>
                  
                  <div className={styles.cardFooter} style={{ marginTop: '16px' }}>
                    {modulo.hasAccess ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C8F542', fontWeight: 800, fontSize: '0.813rem' }}>
                        <span>Acessar módulo</span>
                        <ArrowRight size={14} />
                      </div>
                    ) : (
                      <button style={{ 
                        width: '100%', 
                        background: '#1F2937', 
                        color: '#C8F542', 
                        border: '1px solid rgba(200,245,66,0.3)', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Quero Conhecer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );

            const detailLink = `/dashboard/modulos/${modulo.id}`;

            return (
              <div key={modulo.id} style={{ display: 'flex' }}>
                <Link 
                  href={modulo.hasAccess ? modulo.link : detailLink} 
                  target={modulo.hasAccess && modulo.externo ? "_blank" : "_self"} 
                  rel="noopener noreferrer" 
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  {CardContent}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer Cta section */}
        <div style={{
          margin: '60px auto 40px auto',
          padding: '24px 32px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ color: '#8A8F99', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            Precisa de um módulo exclusivo ou suporte dedicado?
          </p>
          <a href="https://wa.me/5583981957737" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#C8F542',
              color: '#000',
              fontWeight: '800',
              fontSize: '0.75rem',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s'
            }}>
              <MessageCircle size={16} style={{ strokeWidth: 3 }} />
              <span>Falar com Consultor</span>
            </button>
          </a>
        </div>
      </main>
    </div>
  )
}
