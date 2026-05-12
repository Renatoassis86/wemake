'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { selectCompany } from '@/app/actions'
import { ChevronDown, Building } from 'lucide-react'

interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
}

interface CompanySwitcherProps {
  empresas: Empresa[];
  activeCompany?: Empresa;
}

export function CompanySwitcher({ empresas, activeCompany }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSelect = async (id: string) => {
    setOpen(false)
    await selectCompany(id)
    router.refresh() // Recarregar dados do layout Server Component
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '8px 14px',
          borderRadius: '12px',
          color: '#F8FAFC',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.2s'
        }}
      >
        <Building size={16} style={{ color: 'var(--primary)' }} />

        <span>{activeCompany ? (activeCompany.nomeFantasia || activeCompany.razaoSocial) : 'Selecione...'}</span>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          width: '220px',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          {empresas.map((emp) => (
            <div 
              key={emp.id}
              onClick={() => handleSelect(emp.id)}
              style={{
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: '#E2E8F0',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: emp.id === activeCompany?.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = emp.id === activeCompany?.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent')}
            >
              {emp.nomeFantasia || emp.razaoSocial}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
