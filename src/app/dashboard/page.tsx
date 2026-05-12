'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, BarChart2, Users, Shield, ArrowRight, CornerUpLeft } from 'lucide-react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'suite' | 'maintenance'>('suite')
  const [maintenanceItem, setMaintenanceItem] = useState('')

  const apps = [
    { tag: 'MI', id: 'marketing', title: 'Marketing Intelligence', status: 'Desenvolvimento', desc: 'O marketing atua como gerador supremo de dados decisórios. Operamos desde o digital analítico até a inteligência profunda.', image: '/arkos_marketing_intelligence_hero_v1_1774542591336.png', color: '#FF4D4D', link: '#' },
    { tag: 'GDB', id: 'data', title: 'Governança de Dados e BI', status: 'Desenvolvimento', desc: 'Data warehouse, pipelines conectadas e dashboards preditivos de alta performance.', image: '/arkos_data_stream_1774143375030.png', color: '#EC4899', link: '#' },
    { tag: 'CRM', id: 'crm', title: 'Gestão Comercial (CRM)', status: 'Desenvolvimento', desc: 'Otimize o funil de vendas, propostas comerciais e conversões estratégicas em tempo real.', image: '/arkos_real_executive_dashboard_1774143584596.png', color: '#3B82F6', link: 'https://comercial.cidadeviva.education' },
    { tag: 'CLM', id: 'clm', title: 'Gestão de Contratos (CLM)', status: 'Disponível', desc: 'Centraliza a espinha dorsal financeira e física do negócio: faturamento, fardamento e contratos.', image: '/arkos_dashboard_decision_1774133572097.png', color: '#C8F542', link: '/dashboard/documentos' },
    { tag: 'ATI', id: 'recrutamento', title: 'Arkos Talent Intelligence', status: 'Desenvolvimento', desc: 'Redesenho organizacional via NLP e Otimização Matemática. Estruturação de cargos e processos.', image: '/arkos_executive_dashboard_1774143501248.png', color: '#8B5CF6', link: 'https://recrutamento.cidadeviva.education/' },
    { tag: 'AIA', id: 'ai', title: 'Agentes de IA e Automação', status: 'Desenvolvimento', desc: 'Agentes autônomos treinados com as regras do seu negócio para resolver chamados e fluxos.', image: '/arkos_data_brain_1774143436679.png', color: '#F472B6', link: '#' },
    { tag: 'CCI', id: 'commerce', title: 'Central de Comércio Inteligente', status: 'Desenvolvimento', desc: 'Motor financeiro robusto B2B integrado à gestão para e-commerce e recorrência.', image: '/arkos_laptop_mockup_1774143172389.png', color: '#F43F5E', link: '#' },
    { tag: 'ACG', id: 'growth', title: 'Aceleração de Crescimento (Growth)', status: 'Desenvolvimento', desc: 'Squads avançados operando tráfego pago escalável, ROI preditivo e SEO técnico.', image: '/arkos_growth_acceleration_hero_v1_1774542610685.png', color: '#2DD4BF', link: '#' },
    { tag: 'PEC', id: 'strategy', title: 'Planejamento Estratégico e Cenários', status: 'Desenvolvimento', desc: 'Formulação completa e acompanhamento de planos estratégicos dinâmicos e operação tática.', image: '/arkos_business_strategy_1774143055983.png', color: '#F59E0B', link: '#' },
    { tag: 'EDT', id: 'academy', title: 'Edtech Academy', status: 'Desenvolvimento', desc: 'Plataforma LMS completa para letramento digital da equipe e capacitação preditiva.', image: '/edtech_academy_watching_class_v1_1774549826855.png', color: '#EF4444', link: '#' },
    { tag: 'GTC', id: 'infra', title: 'Gestão de Tecnologia e Cyber', status: 'Desenvolvimento', desc: 'Monitoramento de infraestrutura, segurança de servidores e otimização de redes.', image: '/arkos_corporate_presenting_1774143639165.png', color: '#14B8A6', link: '#' },
    { tag: 'GSD', id: 'pedidos', title: 'Governança de Service Desk e Demandas', status: 'Desenvolvimento', desc: 'Controle centralizado de chamados e fluxos de atendimento escaláveis com foco em eficiência.', image: '/arkos_data_dashboard_holo_1774143471858.png', color: '#06B6D4', link: 'https://appgestaocontratos.vercel.app/' },
  ]

  if (activeTab === 'maintenance') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ background: '#111318', border: '1px solid #1F242D', borderRadius: '16px', padding: '3rem', maxWidth: '450px' }}>
          <div style={{ color: '#F59E0B', marginBottom: '1.25rem', fontSize: '3rem' }}>🚧</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F4F2ED', marginBottom: '0.5rem' }}>{maintenanceItem}</h2>
          <p style={{ color: '#8A8F99', fontSize: '0.875rem', marginBottom: '2rem' }}>Este módulo está em manutenção ou em fase de desenvolvimento para a sua infraestrutura.</p>
          <button 
            onClick={() => setActiveTab('suite')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1F242D', color: '#F4F2ED', padding: '0.625rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.813rem', border: '1px solid #272D38', cursor: 'pointer', margin: '0 auto' }}
          >
            <CornerUpLeft size={16} /> Voltar para Suite
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. CABEÇALHO DA SUITE */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#F4F2ED', letterSpacing: '-0.025em' }}>Ecossistema de Inteligência Arkos</h1>
        <p style={{ color: '#8A8F99', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '500px', margin: '0.4rem auto 0' }}>Conecte sua empresa a arquiteturas operacionais de alta performance em dados e gestão.</p>
      </div>

      {/* 2. GRID DE APLICATIVOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {apps.map((app) => (
          <div 
            key={app.id} 
            style={{ 
              background: '#0D0E12', 
              border: '1px solid #1F242D', 
              borderRadius: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-end', 
              position: 'relative', 
              overflow: 'hidden',
              minHeight: '340px',
              opacity: app.status === 'Disponível' ? 1 : 0.65,
              transition: 'all 0.3s ease',
              boxShadow: app.status === 'Disponível' ? `0 20px 40px rgba(200, 245, 66, 0.05)` : 'none'
            }}
          >
            {/* Imagem de Fundo por IA */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
              <img src={app.image} alt={app.title} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity', opacity: 0.25 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(13,14,18,0.4) 0%, rgba(13,14,18,0.95) 100%)' }}></div>
            </div>

            {/* Glossy top bar decoration */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: app.color, zIndex: 1 }}></div>

            <div style={{ padding: '1.5rem', zIndex: 2, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.625rem', padding: '4px 8px', background: app.status === 'Disponível' ? 'rgba(200,245,66,0.1)' : '#1F242D', color: app.status === 'Disponível' ? '#C8F542' : '#8A8F99', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {app.status === 'Disponível' ? 'Módulo Ativo' : 'Em Desenvolvimento'}
                </span>
                <span style={{ fontSize: '0.625rem', padding: '4px 8px', background: app.color, color: '#000', borderRadius: '4px', fontWeight: 900 }}>
                  {app.tag}
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F4F2ED', marginTop: '0.5rem', marginBottom: '0.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{app.title}</h3>
              <p style={{ color: '#8A8F99', fontSize: '0.813rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{app.desc}</p>

              {app.id === 'clm' ? (
                <Link 
                  href={app.link} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    background: app.color, 
                    color: '#0A0C0F', 
                    padding: '0.75rem', 
                    borderRadius: '10px', 
                    fontWeight: 800, 
                    fontSize: '0.813rem', 
                    textDecoration: 'none', 
                    boxShadow: `0 0 16px rgba(200, 245, 66, 0.15)`,
                    transition: 'transform 0.2s'
                  }}
                >
                  Acessar Ferramenta <ArrowRight size={16} />
                </Link>
              ) : (
                  <button 
                    onClick={() => { setActiveTab('maintenance'); setMaintenanceItem(app.title); }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      background: 'rgba(255,255,255,0.04)', 
                      color: '#F4F2ED', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      fontWeight: 800, 
                      fontSize: '0.813rem', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background 0.2s'
                    }}
                  >
                    Saiba Mais <ArrowRight size={16} color="#8A8F99" />
                  </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. TERMO DE INTEGRAÇÃO METODOLÓGICA CTA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(200,245,66,0.05) 0%, rgba(13,14,18,0.4) 100%)', border: '1px solid rgba(200,245,66,0.15)', padding: '2rem', borderRadius: '20px', display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#C8F542', padding: '14px', borderRadius: '14px', color: '#0A0C0F' }}>
            <Shield size={24} />
          </div>
          <div>
            <h4 style={{ color: '#F4F2ED', fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>Letramento e Organização Plena</h4>
            <p style={{ color: '#8A8F99', fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '650px' }}>
              Cada empresa pode contratar funcionalidades avulsas, porém, a metodologia de análise e previsibilidade 
              <strong style={{ color: '#C8F542' }}> ARKOS se dá de forma plena apenas quando todos os módulos operam integrados</strong>.
            </p>
          </div>
        </div>

        <Link href="https://wa.me/5583981957737" target="_blank" style={{ textDecoration: 'none' }}>
          <button style={{ background: '#C8F542', color: '#0A0C0F', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '0.813rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(200,245,66,0.2)' }}>
            Expandir Funcionalidades <ArrowRight size={16} />
          </button>
        </Link>
      </div>

    </div>
  )
}
