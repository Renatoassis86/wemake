'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import styles from './dashboardLayoutClient.module.css'
import { ArrowRight, LogOut } from 'lucide-react'

export function DashboardLayoutClient({ children, activeCompany, empresas, isAdmin, perfilName, perfilAvatar }: any) {
  const pathname = usePathname()
  const isPageWithoutSidebar = pathname?.startsWith('/dashboard/modulos') || pathname === '/dashboard'

  return (
    <div className={`${styles.layout} ${isPageWithoutSidebar ? styles.layoutHub : ''}`}>
      {!isPageWithoutSidebar && <Sidebar currentPath={pathname} activeCompany={activeCompany} isAdmin={isAdmin} />}

      <div className={`${styles.content} ${isPageWithoutSidebar ? styles.contentHub : ''}`}>
        <header className={styles.header}>
          <div className={styles.leftHeader} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isPageWithoutSidebar && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo-high-res.svg" alt="Arkos" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            {!isPageWithoutSidebar && <CompanySwitcher empresas={empresas} activeCompany={activeCompany} />}
          </div>

          {/* Espaço Customizável Removido a pedido */}

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8A8F99', fontSize: '0.813rem', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s', fontWeight: 500 }}>
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)', strokeWidth: 3 }} /> Voltar para o Site
            </Link>
            
            <div className={styles.userMenu}>
              <div className={styles.perfilIcon}>
                {perfilAvatar || perfilName?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600 }}>{perfilName}</span>
            </div>

            {/* Botão Sair na Paleta da Arkos */}
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#070A0F',
                background: '#C8F542',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: '800',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(200, 245, 66, 0.2)'
              }}>
                <LogOut size={16} style={{ strokeWidth: 3 }} />
                <span>Sair</span>
              </button>
            </Link>
          </div>
        </header>

        <main className={`${styles.main} ${isPageWithoutSidebar ? styles.mainHub : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

import { CompanySwitcher } from '@/components/layout/CompanySwitcher'
import Link from 'next/link'
