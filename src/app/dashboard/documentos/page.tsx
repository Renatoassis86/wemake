'use client'

import { useState, useEffect } from 'react'
import styles from '../dashboard.module.css'
import Link from 'next/link'
import { Plus, GraduationCap, FileText, Settings, Trash2, Edit, AlertCircle } from 'lucide-react'
import { createClient } from '@/infrastructure/supabase/client'

export default function DocumentosModelosPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEmitidos, setTotalEmitidos] = useState(0)
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // 1. Pegar empresa ativa (Simulação do contexto via supabase session ou similar)
      const { data: { session } } = await supabase.auth.getSession()
      
      // Como o TenantService é server-side, faremos uma leitura direta dos documentos
      // Para listar sem travar, puxaremos todos os templates corporativos
      const { data: templatesRes } = await supabase
        .from('templates_contrato')
        .select('*, tipos_contrato(titulo)')
        .order('titulo', { ascending: true })

      const { count } = await supabase
        .from('contratos')
        .select('id', { count: 'exact', head: true })

      setTemplates(templatesRes || [])
      setTotalEmitidos(count || 0)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este modelo? Essa ação não poderá ser desfeita.")) return
    
    try {
      const { error } = await supabase
        .from('templates_contrato')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setTemplates(templates.filter(t => t.id !== id))
    } catch (e: any) {
      alert(`Erro ao excluir modelo: ${e.message}`)
    }
  }

  // Agrupamento Dinâmico por Tipo de Documento - EXCLUINDO Contratos
  const groupedTemplates = templates
    .filter(t => !t.tipos_contrato?.titulo?.toLowerCase().includes('contrato'))
    .reduce((acc: any, t: any) => {
      const groupName = t.tipos_contrato?.titulo || 'Outros Modelos';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(t);
      return acc;
    }, {} as Record<string, any[]>);

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Carregando central de documentos...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.025em' }}>Criação de Documentos</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Crie e customize templates de documentos que ficarão disponíveis para emissão.</p>
        </div>
        <Link href="/dashboard/templates" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#C8F542', color: '#0A0C0F', padding: '0.7rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', boxShadow: '0 0 20px rgba(200, 245, 66, 0.2)', transition: 'transform 0.2s' }}>
          <Plus size={18} /> Criar Novo Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed var(--border)', borderRadius: '16px', color: 'var(--secondary)' }}>
          <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Nenhum modelo de documento cadastrado ainda.</p>
          <Link href="/dashboard/templates" style={{ color: '#C8F542', fontSize: '0.85rem', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}>Clique aqui para criar o primeiro</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedTemplates).map(([groupName, items]: [string, any[]]) => (
            <div key={groupName} style={{ background: '#111318', border: '1px solid #1F242D', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem', borderBottom: '1px solid #1F242D', paddingBottom: '0.75rem' }}>
                <div style={{ background: '#C8F542', width: '4px', height: '16px', borderRadius: '2px' }}></div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F4F2ED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {groupName} <span style={{ color: '#8A8F99', fontSize: '0.8rem', textTransform: 'none', fontWeight: 400 }}>({items.length})</span>
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {items.map((t: any) => (
                  <div key={t.id} style={{ background: '#0A0C0F', border: '1px solid #1F242D', borderRadius: '14px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.1s ease', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <div style={{ background: '#1F242D', color: '#C8F542', padding: '0.75rem', borderRadius: '12px', flexShrink: 0 }}>
                        {groupName.toLowerCase().includes('histórico') || groupName.toLowerCase().includes('certificado') ? <GraduationCap size={20} /> : <FileText size={20} />}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#F4F2ED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.titulo}>
                          {t.titulo}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8A8F99', marginTop: '0.25rem' }}>
                          Versão: {t.versao || '1.0'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                      <Link 
                        href={`/dashboard/documentos/emitir/${t.id}`} 
                        style={{ color: '#0A0C0F', background: '#C8F542', padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(200, 245, 66, 0.1)' }}
                      >
                        <FileText size={14} /> Popular
                      </Link>
                      <Link href={`/dashboard/templates/${t.id}/editar`} style={{ color: '#8A8F99', background: '#111318', border: '1px solid #1F242D', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center' }} title="Editar">
                        <Edit size={14} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
