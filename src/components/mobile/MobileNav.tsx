'use client'

import React from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

interface MobileNavProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  menuItems?: { label: string; href: string }[]
  cta?: { label: string; href: string }
}

export default function MobileNav({ mobileMenuOpen, setMobileMenuOpen, menuItems, cta }: MobileNavProps) {
  return (
    <>
      {/* Mobile Header */}
      <header className="mn-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15,23,42,.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        minHeight: 'calc(56px + env(safe-area-inset-top))',
      }}>
        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 56 }}>
          <Image
            src="/images/we-make-1.png"
            alt="We Make"
            width={120}
            height={32}
            style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '30px' }}
            priority
          />
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5FE3D0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            padding: 0,
            zIndex: 51,
          }}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X size={26} />
          ) : (
            <Menu size={26} />
          )}
        </button>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 45,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />

      {/* Side drawer */}
      <nav
        aria-hidden={!mobileMenuOpen}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(86vw, 320px)',
          background: '#0f172a',
          borderRight: '1px solid rgba(255,255,255,.06)',
          zIndex: 46,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
          overflowY: 'auto',
          boxShadow: mobileMenuOpen ? '8px 0 32px rgba(0,0,0,.5)' : 'none',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          marginBottom: '0.5rem',
        }}>
          <Image
            src="/images/we-make-1.png"
            alt="We Make"
            width={120}
            height={32}
            style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '30px', opacity: 0.95 }}
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,.7)',
              cursor: 'pointer',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {menuItems && menuItems.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 48,
                padding: '0 1.25rem',
                color: 'rgba(255,255,255,.85)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'background .15s, color .15s',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(95,227,208,.1)'
                e.currentTarget.style.color = '#5FE3D0'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,.85)'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {cta && (
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <a
              href={cta.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                padding: '0 1.25rem',
                background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '9999px',
                fontSize: '0.95rem',
                fontWeight: 700,
                textAlign: 'center',
                transition: 'transform .2s, box-shadow .2s',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                boxShadow: '0 6px 20px rgba(95,227,208,.4)',
                letterSpacing: '.02em',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {cta.label}
            </a>
          </div>
        )}
      </nav>
    </>
  )
}
