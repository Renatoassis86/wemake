'use client'

import { ReactNode } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: Breadcrumb[]
  badge?: ReactNode
}

export default function PageHeader({ title, subtitle, actions, breadcrumbs, badge }: PageHeaderProps) {
  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 0 rgba(15,23,42,.05)',
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0 1.75rem',
      position: 'sticky', top: 0, zIndex: 40,
    }}>

      {/* Hamburger — mobile only */}
      <button
        id="mobile-sidebar-toggle"
        onClick={() => (window as any).__toggleSidebar?.()}
        style={{
          display: 'none', // shown via CSS
          alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 8,
          border: '1px solid #e2e8f0', background: '#f8fafc',
          cursor: 'pointer', flexShrink: 0, marginRight: '.5rem',
        }}
        aria-label="Abrir menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.2rem' }}>
            <Link href="/comercial" style={{ color: 'var(--text-s)', display: 'flex', alignItems: 'center' }}>
              <Home size={11} />
            </Link>
            {breadcrumbs.map((bc, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <ChevronRight size={11} style={{ color: 'var(--border-d)', flexShrink: 0 }} />
                {bc.href ? (
                  <Link href={bc.href} style={{
                    fontSize: '.72rem', color: 'var(--text-s)',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    textDecoration: 'none', transition: 'color .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-s)')}
                  >
                    {bc.label}
                  </Link>
                ) : (
                  <span style={{
                    fontSize: '.72rem', color: 'var(--text-m)', fontWeight: 600,
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    {bc.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-cormorant, serif)',
            fontSize: breadcrumbs ? '1.15rem' : '1.25rem',
            fontWeight: 700,
            color: 'var(--slate-900)',
            lineHeight: 1.1,
            letterSpacing: '-.015em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>

          {badge && badge}

          {subtitle && (
            <span style={{
              fontSize: '.78rem',
              color: 'var(--text-s)',
              fontFamily: 'var(--font-inter, sans-serif)',
              flexShrink: 0,
            }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </header>
  )
}
