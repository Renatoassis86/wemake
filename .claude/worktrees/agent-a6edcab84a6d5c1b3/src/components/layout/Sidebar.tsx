'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard, School, Users, FileText, Activity,
  Kanban, Calculator, LogOut, Settings,
  Package, FlaskConical, BarChart2, Download,
  Bot, DollarSign, Table2, Info, FileSignature, ClipboardList,
  ExternalLink, GitBranch, Target, CalendarDays, FileAudio,
  Upload, Database, BookOpen
} from 'lucide-react'

interface SidebarProps { profile: Profile | null }

// ── Nav groups ───────────────────────────────────────────────────────────────

const NAV_CRM = [
  { href: '/comercial',                label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/comercial/pre-cadastros',  label: 'Dados Proposta Comercial', icon: ClipboardList   },
  { href: '/comercial/escolas',        label: 'Escolas',       icon: School          },
  { href: '/comercial/registros',      label: 'Registros',     icon: FileText        },
]

const NAV_PROCESS = [
  { href: '/comercial/jornada-visual', label: 'Jornada Visual',    icon: GitBranch   },
  { href: '/comercial/jornada',        label: 'Jornada Relac.',    icon: Activity    },
  { href: '/comercial/contratos',      label: 'Jornada Contrat.',  icon: FileSignature },
  { href: '/comercial/pipeline',       label: 'Pipeline',          icon: Kanban      },
  { href: '/comercial/tabela',         label: 'Tabela Geral',      icon: Table2      },
  { href: '/comercial/metas',          label: 'Metas 2027',        icon: Target      },
]

const NAV_TOOLS = [
  { href: '/agenda',              label: 'Agenda',           icon: CalendarDays    },
  { href: '/transcricoes',        label: 'Transcrições',     icon: FileAudio       },
  { href: '/leads-banco',         label: 'Banco de Leads',   icon: Database        },
  { href: '/importacao',          label: 'Importar Dados',   icon: Upload          },
  { href: '/calculadora',         label: 'Calculadora',      icon: Calculator      },
  { href: '/exports',             label: 'Downloads',        icon: Download        },
]

const NAV_WIP = [
  { href: '/estoque',    label: 'Estoque',       icon: Package    },
  { href: '/amostras',   label: 'Amostras',      icon: FlaskConical },
  { href: '/dashboards', label: 'BI / Analytics',icon: BarChart2  },
  { href: '/ai-bob',     label: 'ALMA — IA',     icon: Bot        },
  { href: '/financeiro', label: 'Financeiro',    icon: DollarSign },
]

// ── Subcomponents ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '.1em', color: 'rgba(255,255,255,.2)',
      padding: '.85rem 1.25rem .3rem',
      fontFamily: 'var(--font-montserrat, sans-serif)',
    }}>
      {children}
    </div>
  )
}

function NavDivider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,.05)', margin: '.4rem .75rem' }} />
}

interface NavItemProps {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  active: boolean
  badge?: number | string
  external?: boolean
  wip?: boolean
}

function NavItem({ href, label, icon: Icon, active, badge, external, wip }: NavItemProps) {
  const baseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '.6rem',
    padding: '.5rem .9rem', margin: '1px 6px',
    color: active ? '#ffffff' : 'rgba(255,255,255,.6)',
    fontSize: '.8rem', fontWeight: active ? 600 : 500,
    borderRadius: 7, textDecoration: 'none', transition: 'all .15s',
    fontFamily: 'var(--font-montserrat, sans-serif)',
    letterSpacing: '.005em',
    position: 'relative',
    background: active
      ? 'linear-gradient(135deg, rgba(95,227,208,.85), rgba(74,143,231,.85))'
      : 'transparent',
    boxShadow: active ? '0 2px 10px rgba(74,143,231,.3)' : 'none',
    opacity: wip ? .4 : 1,
    pointerEvents: wip ? 'none' : 'auto',
  }

  const content = (
    <>
      {/* Ícone com mini fundo */}
      <span style={{
        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, flexShrink: 0,
        background: active ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.04)',
        transition: 'background .15s',
      }}>
        <Icon size={14} />
      </span>

      <span style={{ flex: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>

      {badge !== undefined && (
        <span style={{
          marginLeft: 'auto', background: active ? 'rgba(255,255,255,.25)' : '#4A7FDB',
          color: '#fff', fontSize: '.58rem', fontWeight: 800, padding: '.1rem .4rem',
          borderRadius: 99, minWidth: 18, textAlign: 'center',
        }}>
          {badge}
        </span>
      )}

      {wip && (
        <span style={{
          marginLeft: 'auto', fontSize: '.55rem', fontWeight: 700,
          color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.1)', padding: '.04rem .3rem',
          borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em',
        }}>
          Em breve
        </span>
      )}

      {external && !wip && (
        <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: .4 }} />
      )}
    </>
  )

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={baseStyle}>{content}</a>
  }
  if (wip) {
    return <div style={baseStyle}>{content}</div>
  }
  return (
    <Link href={href} style={baseStyle}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,.07)'
          e.currentTarget.style.color = 'rgba(255,255,255,.9)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,.6)'
        }
      }}
    >
      {content}
    </Link>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    (window as any).__toggleSidebar = () => setMobileOpen(p => !p)
    return () => { delete (window as any).__toggleSidebar }
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/comercial') return pathname === '/comercial'
    // Garante que '/comercial/jornada' não ative '/comercial/jornada-visual'
    // A rota deve ser exata OU o pathname deve continuar com '/' após o href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isGerente = profile?.role === 'gerente'
  // Gestão de Usuários visível apenas para o administrador principal
  const isAdmin = profile?.email === 'contato@wemake.tec.br' || profile?.email === 'renato086@gmail.com'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="mobile-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            zIndex: 99, backdropFilter: 'blur(2px)',
          }}
        />
      )}

    <aside
      id="main-sidebar"
      className={mobileOpen ? 'mobile-open' : ''}
      style={{
        width: 'var(--sidebar-w)', minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,.05)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>

      {/* Mobile close button */}
      <button
        onClick={() => setMobileOpen(false)}
        className="mobile-close-btn"
        aria-label="Fechar menu"
        style={{
          position: 'absolute', top: '1rem', right: '-3rem',
          width: 40, height: 40, borderRadius: '50%',
          background: '#0f172a', border: '1px solid rgba(255,255,255,.2)',
          color: '#fff', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 101,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div style={{
        padding: '1.1rem 1.1rem .9rem',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}>
        <Image
          src="/images/we-make-1.png"
          alt="We Make"
          width={144}
          height={36}
          style={{ objectFit: 'contain', objectPosition: 'left', opacity: .88, width: 'auto', height: 'auto' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.55rem' }}>
          <span style={{
            display: 'inline-block',
            width: 6, height: 6, borderRadius: '50%', background: '#5FE3D0', flexShrink: 0,
          }} />
          <span style={{
            fontSize: '.6rem', fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'rgba(95,227,208,.85)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            Gestão Comercial
          </span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '.5rem 0 1rem' }}>

        {/* ── Sobre + Tutorial — primeiras abas ────────────────── */}
        <NavItem href="/sobre"    label="Plataforma We Make" icon={Info}     active={isActive('/sobre')} />
        <NavItem href="/tutorial" label="Tutorial"     icon={BookOpen} active={isActive('/tutorial')} />
        <NavDivider />

        <SectionLabel>CRM</SectionLabel>
        {NAV_CRM.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}

        <NavDivider />
        <SectionLabel>Processos</SectionLabel>
        {NAV_PROCESS.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}

        <NavDivider />
        <SectionLabel>Ferramentas</SectionLabel>
        {NAV_TOOLS.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}

        {/* Formulário público */}
        <NavItem
          href="/formulario"
          label="Formulário Escola"
          icon={ClipboardList}
          active={false}
          external
        />

        {/* Gestão de usuários — visível apenas para Renato (admin principal) */}
        {isAdmin && (
          <>
            <NavDivider />
            <NavItem href="/adminpanel" label="Gestão de Usuários" icon={Settings} active={isActive('/adminpanel')} />
          </>
        )}

        <NavDivider />
        <SectionLabel>Em Desenvolvimento</SectionLabel>
        {NAV_WIP.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={false}
            wip
          />
        ))}
      </nav>

      {/* ── User Footer ──────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,.05)',
        padding: '.9rem 1rem',
        background: 'rgba(0,0,0,.2)',
      }}>
        {profile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #5FE3D0, #4A7FDB)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '.72rem', fontWeight: 700,
              overflow: 'hidden', boxShadow: '0 0 0 2px rgba(74,143,231,.25)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(profile.full_name || profile.email)
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'rgba(255,255,255,.9)', fontSize: '.78rem', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                {profile.full_name?.split(' ').slice(0, 2).join(' ') || profile.email}
              </div>
              <div style={{
                color: 'rgba(255,255,255,.3)', fontSize: '.62rem', textTransform: 'capitalize',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                display: 'flex', alignItems: 'center', gap: '.3rem',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                {profile.role}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                color: 'rgba(255,255,255,.25)', background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer',
                padding: '5px', borderRadius: 7, transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#dc2626'
                e.currentTarget.style.background = 'rgba(220,38,38,.12)'
                e.currentTarget.style.borderColor = 'rgba(220,38,38,.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,.25)'
                e.currentTarget.style.background = 'rgba(255,255,255,.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: 'rgba(255,255,255,.07)', borderRadius: 4, marginBottom: 5, width: '70%' }} />
              <div style={{ height: 6, background: 'rgba(255,255,255,.04)', borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        )}
      </div>
    </aside>

    <style>{`
      /* Desktop: esconde o botão X completamente */
      .mobile-close-btn {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      @media (max-width: 768px) {
        #main-sidebar {
          transform: translateX(-100%);
        }
        #main-sidebar.mobile-open {
          transform: translateX(0) !important;
        }
        .mobile-close-btn {
          display: flex !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .mobile-overlay { display: block !important; }
      }
    `}</style>
    </>
  )
}
