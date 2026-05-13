'use client'

import React, { useState } from 'react'
import { Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react'

interface FooterSection {
  title: string
  items: { label: string; href?: string }[]
}

interface MobileFooterProps {
  sections?: FooterSection[]
}

export default function MobileFooter({ sections }: MobileFooterProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const defaultSections: FooterSection[] = sections || [
    {
      title: 'Módulos',
      items: [
        { label: 'Gestão Comercial' },
        { label: 'Gestão de Contratos' },
        { label: 'Censo Escolar' },
        { label: 'Jornada de Relacionamento' },
      ],
    },
    {
      title: 'Links Úteis',
      items: [
        { label: 'We Make', href: 'https://wemake.com.br' },
        { label: 'Plataforma', href: '/login' },
        { label: 'Formulário', href: '/formulario' },
        { label: 'Contato', href: '#contato' },
      ],
    },
  ]

  return (
    <footer style={{
      background: '#030712',
      borderTop: '1px solid rgba(255,255,255,.05)',
      padding: '1.5rem 1rem 2rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Frase institucional */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <p style={{
            fontFamily: 'var(--font-cormorant, serif)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,.4)',
            lineHeight: 1.5,
            maxWidth: 280,
          }}>
            Plataforma inteligente de gestão comercial para educação de qualidade.
          </p>
        </div>

        {/* Contatos em abas */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: '#5FE3D0',
            marginBottom: '1rem',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            Contatos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="mailto:comercial@wemake.org" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              transition: 'color .2s',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
            >
              <Mail size={16} style={{ flexShrink: 0, color: '#5FE3D0' }} />
              comercial@wemake.org
            </a>
            <a href="tel:+5583986048784" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              transition: 'color .2s',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
            >
              <Phone size={16} style={{ flexShrink: 0, color: '#5FE3D0' }} />
              (83) 98604-8784
            </a>
            <a href="https://wa.me/5583986048784" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              transition: 'color .2s',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
            >
              <MessageCircle size={16} style={{ flexShrink: 0, color: '#5FE3D0' }} />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Seções accordion */}
        {defaultSections.map((section) => (
          <div key={section.title} style={{ marginBottom: '0.75rem' }}>
            <button
              onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 0.5rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,.05)',
                color: '#5FE3D0',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'var(--font-montserrat, sans-serif)',
                transition: 'color .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#4A7FDB'}
              onMouseLeave={e => e.currentTarget.style.color = '#5FE3D0'}
            >
              {section.title}
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform .3s',
                  transform: expandedSection === section.title ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {expandedSection === section.title && (
              <div style={{ paddingLeft: '0.5rem', paddingBottom: '1rem' }}>
                {section.items.map((item) => (
                  <div key={item.label}>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{
                        display: 'block',
                        padding: '0.6rem 0.5rem',
                        color: 'rgba(255,255,255,.45)',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        transition: 'color .2s',
                        fontFamily: 'var(--font-inter, sans-serif)',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = '#5FE3D0'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <div style={{
                        padding: '0.6rem 0.5rem',
                        color: 'rgba(255,255,255,.35)',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-inter, sans-serif)',
                      }}>
                        {item.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.05)',
          paddingTop: '1rem',
          marginTop: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,.2)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
            letterSpacing: '.03em',
          }}>
            © {new Date().getFullYear()} We Make · Gestão Comercial para Educação
          </p>
        </div>
      </div>
    </footer>
  )
}
