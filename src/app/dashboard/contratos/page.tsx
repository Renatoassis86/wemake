'use client'

import { useState, useEffect } from 'react'
import styles from '../dashboard.module.css'
import Link from 'next/link'
import { Plus, Briefcase, FileText, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/infrastructure/supabase/client'

export default function ContratosPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: templatesRes } = await supabase
        .from('templates_contrato')
        .select('*, tipos_contrato(titulo)')
        .order('titulo', { ascending: true })

      const mockContractTemplates = [
        { id: 'mock-1', titulo: 'Contrato de Docência Acadêmica FICV', tipos_contrato: { titulo: 'Contratos de Professores' }, versao: '1.2.0' },
        { id: 'mock-2', titulo: 'Contrato de Prestação de Serviços TIC', tipos_contrato: { titulo: 'Contratos de Fornecedores' }, versao: '1.0.1' },
        { id: 'mock-3', titulo: 'Cessão de Direitos de Material Didático', tipos_contrato: { titulo: 'Contratos de Autores' }, versao: '2.0.0' },
        { id: 'mock-4', titulo: 'Aditivo Contratual - Carga Horária', tipos_contrato: { titulo: 'Contratos de Professores' }, versao: '1.0.0' },
        { id: 'mock-5', titulo: 'Acordo de Confidencialidade (NDA)', tipos_contrato: { titulo: 'Geral' } }
      ];

      setTemplates([...mockContractTemplates, ...(templatesRes || [])])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este modelo de contrato?")) return
    const { error } = await supabase.from('templates_contrato').delete().eq('id', id)
    if (!error) setTemplates(templates.filter(t => t.id !== id))
  }

  // Filtrar Apenas Tipos que Contenham 'Contrato'
  const contractTemplates = templates.filter(t => 
    t.id?.startsWith('mock-') || t.tipos_contrato?.titulo?.toLowerCase().includes('contrato')
  )

  // Agrupamento Dinâmico por Tipo de Contrato
  const groupedContracts = contractTemplates.reduce((acc: any, t: any) => {
    const groupName = t.tipos_contrato?.titulo || 'Geral';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Carregando dados de contratos...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.025em' }}>Aba Contratos Corporativos</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Customize templates de contratos. O ciclo depende de dados de fornecedores e prestadores.</p>
        </div>
        <Link href="/dashboard/templates" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#C8F542', color: '#0A0C0F', padding: '0.7rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', boxShadow: '0 0 20px rgba(200, 245, 66, 0.2)' }}>
          <Plus size={18} /> Criar Novo Template
        </Link>
      </div>

      {contractTemplates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed #1F242D', borderRadius: '16px', color: '#8A8F99' }}>
          <Briefcase size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Nenhum modelo de contrato cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedContracts).map(([groupName, items]: [string, any[]]) => (
            <div key={groupName} style={{ background: '#111318', border: '1px solid #1F242D', borderRadius: '16px', padding: '1.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem', borderBottom: '1px solid #1F242D', paddingBottom: '0.75rem' }}>
                <div style={{ background: '#C8F542', width: '4px', height: '16px', borderRadius: '2px' }}></div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#F4F2ED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {groupName} <span style={{ color: '#8A8F99', fontSize: '0.8rem', textTransform: 'none', fontWeight: 400 }}>({items.length})</span>
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {items.map((t: any) => (
                  <div key={t.id} style={{ background: '#0A0C0F', border: '1px solid #1F242D', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.1s ease' }}>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                      <div style={{ background: '#1F242D', color: '#C8F542', padding: '0.625rem', borderRadius: '10px', flexShrink: 0 }}>
                        <Briefcase size={18} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.813rem', color: '#F4F2ED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.titulo}>
                          {t.titulo}
                        </div>
                        <div style={{ fontSize: '0.688rem', color: '#8A8F99', marginTop: '0.15rem' }}>
                          Versão: {t.versao || '1.0'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                      <Link 
                        href={`/dashboard/documentos/emitir/${t.id}?contexto=fornecedores`} 
                        style={{ color: '#0A0C0F', background: '#C8F542', padding: '0.45rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 0 12px rgba(200, 245, 66, 0.1)' }}
                      >
                        <FileText size={14} /> Popular
                      </Link>
                      <Link href={`/dashboard/templates/${t.id}/editar`} style={{ color: '#8A8F99', background: '#111318', border: '1px solid #1F242D', padding: '0.45rem', borderRadius: '8px' }} title="Editar">
                        <Edit size={14} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer' }}
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
