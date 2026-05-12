'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './sidebar.module.css'
import { LayoutDashboard, Building2, Users, FileText, LifeBuoy, Settings, LogOut, FileCheck, Database } from 'lucide-react'

interface SidebarProps {
  currentPath?: string; // Mantido por compatibilidade
  activeCompany?: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
  };
  isAdmin?: boolean;
}

export function Sidebar({ activeCompany, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const isFICV = activeCompany?.nomeFantasia?.toLowerCase().includes('ficv') || 
                 activeCompany?.razaoSocial?.toLowerCase().includes('ficv')

  const sections = [
    {
      title: 'Indicadores',
      items: [
        { name: 'Dashboard Principal', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        ...(isFICV ? [
          { name: 'Alunos e Certificados', path: '/dashboard/documentos/alunos', icon: <Users size={20} /> },
          { name: 'Emitir Histórico em Lote', path: '/dashboard/documentos/alunos/emitir', icon: <FileText size={20} /> }
        ] : []),
        { name: 'CLM Ópera', path: '/dashboard/clm', icon: <FileCheck size={20} /> },
      ]
    },
    {
      title: 'Criação',
      items: [
        { name: 'Criação de Documentos e Templates', path: '/dashboard/templates', icon: <FileCheck size={20} /> },
        { name: 'Repositório de Documentos', path: '/dashboard/documentos', icon: <FileText size={20} /> },
        { name: 'Assinaturas', path: '/dashboard/assinaturas', icon: <FileText size={20} /> },
        { name: 'Criação de Contratos', path: '/dashboard/contratos', icon: <FileText size={20} /> },
      ]
    },
    {
      title: 'Cadastro',
      items: [
        { name: 'Fornecedores', path: '/dashboard/pessoas', icon: <Users size={20} /> },
        ...(isAdmin ? [
          { name: 'Unidades / Setores', path: '/dashboard/empresas', icon: <Building2 size={20} /> },
          { name: 'Gestão de Usuários', path: '/dashboard/usuarios', icon: <Users size={20} /> }
        ] : []),
      ]
    },
    {
      title: 'Configurações',
      items: [
         { name: 'Explorador', path: '/dashboard/documentos/alunos/explorador', icon: <LayoutDashboard size={20} /> },
         ...(isFICV ? [
            { name: 'Manual API Moodle', path: '/dashboard/documentos/alunos/manual', icon: <FileText size={20} /> }
         ] : [])
      ]
    }
  ]

  const BottomMenus = [
    { name: 'Configurações', path: '/dashboard/settings', icon: <Settings size={20} /> },
    { name: 'Ajuda', path: '/dashboard/help', icon: <LifeBuoy size={20} /> },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
        <img src="/logo-high-res.svg" alt="Arkos" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <nav className={styles.nav}>
        {sections.map((section, sidx) => (
          <div key={sidx} style={{ marginBottom: '1.25rem' }}>
            {section.items.length > 0 && <span className={styles.categoryTitle}>{section.title}</span>}
            <ul>
              {section.items.map((menu) => {
                const isActive = pathname === menu.path;
                return (
                  <li key={menu.path}>
                    <Link href={menu.path} className={isActive ? styles.active : ''}>
                      {menu.icon}
                      <span>{menu.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <ul>
          {BottomMenus.map((menu) => {
            const isActive = pathname === menu.path;
            return (
              <li key={menu.path}>
                <Link href={menu.path} className={isActive ? styles.active : ''}>
                  {menu.icon}
                  <span>{menu.name}</span>
                </Link>
              </li>
            )
          })}
          <li>
            <form action="/login" method="GET">
              <button type="submit" className={styles.logoutBtn}>
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </form>
          </li>
        </ul>
      </div>
    </aside>
  )
}
