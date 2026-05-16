'use client'

import Image from 'next/image'
import { Menu } from 'lucide-react'

/**
 * Topbar mobile do dashboard. Visivel apenas em <=900px.
 * Renderiza o hamburguer que aciona `window.__toggleSidebar`
 * (mecanismo ja existente em src/components/layout/Sidebar.tsx).
 */
export default function DashboardTopbar() {
  function toggle() {
    const fn = (window as any).__toggleSidebar
    if (typeof fn === 'function') fn()
  }

  return (
    <div className="dashboard-topbar">
      <button
        type="button"
        onClick={toggle}
        aria-label="Abrir menu"
        className="dashboard-topbar-burger"
      >
        <Menu size={22} />
      </button>

      <div className="dashboard-topbar-logo">
        <Image
          src="/images/we-make-1.png"
          alt="We Make"
          width={112}
          height={28}
          priority
          style={{ height: 28, width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* spacer (mantem o logo centralizado) */}
      <div style={{ width: 44, height: 44, flexShrink: 0 }} />

      <style>{`
        .dashboard-topbar {
          display: none;
        }
        @media (max-width: 900px) {
          .dashboard-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: .5rem;
            position: sticky;
            top: 0;
            z-index: 30;
            height: 56px;
            padding: 0 .5rem;
            padding-top: env(safe-area-inset-top);
            background: rgba(15,23,42,.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,.08);
          }
        }
        .dashboard-topbar-burger {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.06);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background .15s;
        }
        .dashboard-topbar-burger:active {
          background: rgba(255,255,255,.14);
        }
        .dashboard-topbar-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-width: 0;
        }
      `}</style>
    </div>
  )
}
