'use client'

import React, { useState } from 'react'
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
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(15,23,42,.95) 0%, rgba(15,23,42,.8) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
        height: '60px',
      }}>
        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/we-make-1.png"
            alt="We Make"
            width={120}
            height={32}
            style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '32px' }}
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
            padding: '0.5rem',
            zIndex: 51,
          }}
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <nav style={{
        position: 'fixed',
        top: 60,
        left: 0,
        right: 0,
        maxHeight: 'calc(100vh - 60px)',
        background: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,.05)',
        zIndex: 45,
        display: mobileMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '1rem',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,.5)',
      }}>
        {menuItems && menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              padding: '0.75rem 1rem',
              color: 'rgba(255,255,255,.75)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,.05)',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all .2s',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(95,227,208,.1)'
              e.currentTarget.style.color = '#5FE3D0'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,.75)'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </a>
        ))}

        {cta && (
          <a
            href={cta.href}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#5FE3D0',
              color: '#0f172a',
              textDecoration: 'none',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 700,
              textAlign: 'center',
              transition: 'all .2s',
              fontFamily: 'var(--font-montserrat, sans-serif)',
              boxShadow: '0 4px 14px rgba(95,227,208,.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#4A7FDB'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#5FE3D0'
              e.currentTarget.style.color = '#0f172a'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {cta.label}
          </a>
        )}
      </nav>
    </>
  )
}
