"use client"
import React from 'react'
import Link from 'next/link'
import { Instagram, Youtube, Mail, Phone } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <>
      {/* ── BARRA SOCIAL (CÁPSULA SUPERIOR) ───────────────────── */}
      <div className={styles.socialBar} style={{ 
        background: 'var(--background)',
        borderTopLeftRadius: '48px',
        borderTopRightRadius: '48px',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '-48px',
        position: 'relative',
        zIndex: 3,
        padding: '60px 0 40px 0'
      }}>
        <div className={styles.socialContainer}>
          <div className={styles.socialText}>Encontre a <span style={{ color: 'var(--primary)' }}>Arkos Intelligence</span> nas redes sociais</div>
          <div className={styles.socialIcons}>
            <Link href="https://instagram.com" className={styles.socialIconActive}><Instagram size={18} /></Link>
            <Link href="https://youtube.com" className={styles.socialIconActive}><Youtube size={18} /></Link>
            <Link href="mailto:renato@arkosintelligence.com" className={styles.socialIconActive}><Mail size={18} /></Link>
            <Link href="tel:+5583981957737" className={styles.socialIconActive}><Phone size={18} /></Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER MEGA ARREDONDADO (DARK PREMIUM) ───────────── */}
      <footer className={styles.footerMega} style={{ 
        background: 'var(--background)', 
        color: 'var(--foreground)', 
        borderTop: '1px solid var(--border)',
        borderBottomLeftRadius: '48px',
        borderBottomRightRadius: '48px',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginBottom: '48px',
        position: 'relative',
        zIndex: 2,
        paddingTop: '60px',
        paddingBottom: '80px'
      }}>
        <div className={styles.footerGrid}>
          
          {/* Coluna Logo Vertical (ARKOS PREVIEW LIGHT) */}
          <div className={styles.footerCol}>
            <div style={{ marginBottom: '24px' }}>
              <img src="/logo-high-res.svg" alt="ARKOS Intelligence" style={{ height: '48px', width: 'auto', display: 'block' }} />
            </div>
            <p className={styles.footerLabel} style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--foreground)', lineHeight: '1.3', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              A Infraestrutura de <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Inteligência</span> da nova economia.
            </p>
            <p className={styles.footerLabel} style={{ opacity: 0.7, fontSize: '0.875rem', color: 'var(--secondary)', maxWidth: '300px', lineHeight: '1.6' }}>
              Do dado bruto à decisão executiva. Unificamos sistemas e ciências de dados em uma única arquitetura operacional.
            </p>
          </div>

           {/* Coluna Navegação (Espelhando Topo) */}
          <div className={styles.footerCol}>
            <h4 style={{ color: 'var(--foreground)', borderBottom: '2px solid var(--primary)' }}>Navegação</h4>
            <Link href="/institucional/o-que-e" style={{ color: 'var(--secondary)' }}>O que é a Arkos</Link>
            <Link href="/institucional/quem-somos" style={{ color: 'var(--secondary)' }}>Quem somos</Link>
            <Link href="/institucional/equipe" style={{ color: 'var(--secondary)' }}>Nossa equipe</Link>
            <Link href="/institucional/nosso-negocio" style={{ color: 'var(--secondary)' }}>Nosso negócio</Link>
            <Link href="/institucional/o-problema" style={{ color: 'var(--secondary)' }}>O Problema</Link>
            <Link href="/institucional/a-solucao" style={{ color: 'var(--secondary)' }}>Solução</Link>
            <Link href="/institucional/o-ecossistema" style={{ color: 'var(--secondary)' }}>Ecossistema</Link>
            <Link href="/institucional/o-hub-arkos" style={{ color: 'var(--secondary)' }}>Hub Arkos</Link>
            <Link href="/diagnostico" style={{ color: 'var(--secondary)' }} target="_blank">Diagnóstico</Link>
            <Link href="/institucional/diferencial" style={{ color: 'var(--secondary)' }}>Diferencial</Link>
            <Link href="/login" style={{ color: 'var(--foreground)', fontWeight: 800, textDecoration: 'underline', textDecorationColor: 'var(--primary)' }}>Acesso restrito</Link>
          </div>

          <div className={styles.footerCol}>
            <h4 style={{ color: 'var(--foreground)', borderBottom: '2px solid var(--primary)' }}>Ecossistema Hub</h4>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Marketing Intelligence (MI)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Governança de Dados e BI (GDB)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Gestão Comercial (CRM)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Gestão de Contratos (CLM)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Arkos Talent Intelligence (ATI)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Agentes de IA e Automação (AIA)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Central de Comércio Inteligente (CCI)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Aceleração de Crescimento (ACG)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Planejamento Estratégico e Cenários (PEC)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Edtech Academy (EDT)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Gestão de Tecnologia e Cyber (GTC)</Link>
            <Link href="#modulos" style={{ color: 'var(--secondary)' }}>Governança de Service Desk (GSD)</Link>
          </div>

          <div className={styles.footerCol}>
            <h4 style={{ color: 'var(--foreground)', borderBottom: '2px solid var(--primary)' }}>Fale Conosco</h4>
            <p style={{ fontWeight: '500', color: 'var(--foreground)' }}>renato@arkosintelligence.com</p>
            <p style={{ fontWeight: '500', color: 'var(--foreground)' }}>+55 (83) 98195-7737</p>
            <Link href="https://wa.me/5583981957737" target="_blank" style={{ color: 'var(--primary)', fontWeight: 800, borderLeft: '3px solid var(--primary)', paddingLeft: '12px', marginTop: '8px' }}>
              Falar com Consultor
            </Link>
          </div>

          {/* Coluna Localização */}
          <div className={styles.footerCol}>
            <h4 style={{ color: 'var(--foreground)', borderBottom: '2px solid var(--primary)' }}>Localização</h4>
            <p style={{ lineHeight: '1.6', color: 'var(--secondary)' }}>
              Avenida João Machado, 849, Sala 801<br />
              Centro, João Pessoa - PB<br />
              CEP: 58013-522
            </p>
          </div>

        </div>
        
        <div className={styles.footerBottomBar} style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'left' }}>
            <Link href="/privacidade" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 700 }}>Privacidade E Termos</Link>
          </div>
          <div style={{ textAlign: 'center', whiteSpace: 'nowrap', opacity: 0.5, color: 'var(--secondary)' }}>
            © 2026 Arkos Intelligence. Todos os direitos reservados.
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--secondary)', opacity: 0.4 }}>PB, Brasil · Global</span>
          </div>
        </div>
      </footer>
    </>
  )
}
