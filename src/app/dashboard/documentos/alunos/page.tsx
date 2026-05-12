'use client'

import { useState, useEffect } from 'react'
import styles from '../../dashboard.module.css'
import Link from 'next/link'
import { Trash2, Edit, Mail, Phone, FileDown, Filter, Search, CheckSquare, ArrowRight } from 'lucide-react'
import { createClient } from '@/infrastructure/supabase/client'
import { testMoodleConnection, getMoodleCourses } from '@/app/actions'

// Função auxiliar idêntica ao explorador
function getAllDescendantCategoryIds(catId: string, categories: any[]): string[] {
  let ids = [catId];
  let queue = [catId];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = categories.filter(c => String(c.parent) === current);
    for (const child of children) {
      if (!ids.includes(String(child.id))) {
        ids.push(String(child.id));
        queue.push(String(child.id));
      }
    }
  }
  return ids;
}

export default function AlunosDocumentosPage() {
  const [moodleCategories, setMoodleCategories] = useState<any[]>([])
  const [moodleCourses, setMoodleCourses] = useState<any[]>([])
  const [categoryChain, setCategoryChain] = useState<string[]>(['all'])
  const [selectedAno, setSelectedAno] = useState('all')
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [tipoDocumento, setTipoDocumento] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [moodleUsers, setMoodleUsers] = useState<any[]>([])
  
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [documentTemplates, setDocumentTemplates] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    // 1. Carregar Categorias e Cursos do Moodle
    getMoodleCourses().then(res => {
      if (res.success) {
        setMoodleCourses(res.courses || [])
        setMoodleCategories(res.categories || [])
      }
    })

    // 2. Carregar templates de documentos salvos no banco
    async function fetchTemplates() {
      const { data } = await supabase
        .from('templates_contrato')
        .select('id, titulo, tipos_contrato(titulo)')
        .order('titulo', { ascending: true })
      setDocumentTemplates(data || [])
    }
    fetchTemplates()
  }, [])

  const handleCarregarAlunos = async () => {
    // Pegar a categoria ativa do chain
    const activeCatId = categoryChain[categoryChain.length - 1] === 'all' 
      ? (categoryChain.length > 1 ? categoryChain[categoryChain.length - 2] : 'all') 
      : categoryChain[categoryChain.length - 1];

    if (selectedCourse === 'all' && (activeCatId === 'all' || !activeCatId)) {
      alert('Por favor, selecione pelo menos uma Categoria ou Disciplina.');
      return;
    }

    setLoadingAlunos(true)
    setMoodleUsers([])
    setSelectedIds([])

    try {
      let coursesToLoad: string[] = [];
      if (selectedCourse !== 'all') {
        coursesToLoad = [selectedCourse];
      } else {
        const descendantIds = getAllDescendantCategoryIds(String(activeCatId), moodleCategories);
        coursesToLoad = moodleCourses
          .filter(c => descendantIds.includes(String(c.category)))
          .map(c => String(c.id));
      }

      if (coursesToLoad.length === 0) {
        setLoadingAlunos(false);
        return;
      }

      const promises = coursesToLoad.map(cId => testMoodleConnection(cId, 'historico'));
      const results = await Promise.all(promises);
      
      let allMergedUsers: any[] = [];
      results.forEach(res => {
        if (res.success && res.allUsers) {
          allMergedUsers = [...allMergedUsers, ...res.allUsers];
        }
      });

      // Dedup por id
      const dedupedUsers = allMergedUsers.reduce((acc: any[], current: any) => {
        if (!acc.find(u => String(u.id) === String(current.id))) {
          acc.push(current);
        }
        return acc;
      }, []);

      setMoodleUsers(dedupedUsers);

    } catch (e) {
      alert('Erro inesperado ao carregar alunos.');
    } finally {
      setLoadingAlunos(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMoodleUsers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMoodleUsers.map(u => String(u.id)))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Filtragem local conforme os Inputs
  const filteredMoodleUsers = moodleUsers.filter(u => {
    const matchSearch = searchQuery === '' || u.fullname.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSearch
  })

  return (
    <div>
      <h1 className={styles.title}>Alunos e Documentos</h1>
      <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
        Selecione o curso e tipo de documento para emitir e fazer downloads em massa.
      </p>

      {/* BLOCO DE FILTROS - SEQUÊNCIA SOLICITADA */}
      <div style={{ 
        marginBottom: '1.5rem', 
        background: '#111318', 
        border: '1px solid #1F242D', 
        borderRadius: '16px', 
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F4F2ED', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: '#C8F542' }} /> Filtrar e Selecionar Público
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* LINHA 1: Hierarquia de Categorias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {['Unidade / Instituição', 'Departamento / Escola', 'Área / Núcleo', 'Curso'].map((label, idx) => {
              const catId = categoryChain[idx] || 'all';
              const parentId = idx === 0 ? 0 : Number(categoryChain[idx - 1] || 'all');
              
              // Se o pai for 'all' e não for o primeiro nível, a lista fica vazia (usuário precisa selecionar o pai primeiro)
              const items = (idx > 0 && parentId === 0) || (idx > 0 && categoryChain[idx - 1] === 'all')
                ? [] 
                : moodleCategories.filter(cat => Number(cat.parent) === parentId);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#8A8F99', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </label>
                  <select 
                    value={catId} 
                    disabled={idx > 0 && (!categoryChain[idx - 1] || categoryChain[idx - 1] === 'all')}
                    onChange={(e) => { 
                      const val = e.target.value;
                      let newChain = [...categoryChain.slice(0, idx), val];
                      if (val !== 'all' && idx < 3) {
                        const hasKids = moodleCategories.some(cat => Number(cat.parent) === Number(val));
                        if (hasKids) newChain.push('all');
                      }
                      setCategoryChain(newChain);
                      setSelectedCourse('all');
                    }}
                    style={{ 
                      background: '#0A0C0F', 
                      color: (idx > 0 && (!categoryChain[idx - 1] || categoryChain[idx - 1] === 'all')) ? '#8A8F99' : '#F4F2ED', 
                      border: '1px solid #1F242D', 
                      borderRadius: '10px', 
                      padding: '0.625rem', 
                      fontSize: '0.813rem', 
                      width: '100%', 
                      outline: 'none', 
                      cursor: (idx > 0 && (!categoryChain[idx - 1] || categoryChain[idx - 1] === 'all')) ? 'not-allowed' : 'pointer', 
                      opacity: (idx > 0 && (!categoryChain[idx - 1] || categoryChain[idx - 1] === 'all')) ? 0.4 : 1 
                    }}
                  >
                    <option value="all">{idx === 0 ? 'Todas as Unidades' : 'Todas'}</option>
                    {items.map(cat => (
                      <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {/* LINHA 2: Dependentes e Pesquisa */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8A8F99', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Ano</label>
              <select 
                value={selectedAno} 
                onChange={(e) => setSelectedAno(e.target.value)}
                style={{ background: '#0A0C0F', color: '#F4F2ED', border: '1px solid #1F242D', borderRadius: '10px', padding: '0.625rem', fontSize: '0.813rem', width: '100%', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Ver Todos</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            {/* Documentos de múltipla escolha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '2 1 320px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8A8F99', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Tipo de Documento</label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', background: '#0A0C0F', border: '1px solid #1F242D', borderRadius: '10px', padding: '0.6rem', minHeight: '38px', alignItems: 'center' }}>
                {[
                  { value: 'historico', label: 'Histórico' },
                  { value: 'certificado', label: 'Certificado' },
                  { value: 'atestado', label: 'Atestado' },
                  { value: 'declaracao', label: 'Declaração' },
                  { value: 'evento', label: 'Evento' }
                ].map(doc => {
                  const isChecked = tipoDocumento.includes(doc.value);
                  return (
                    <label key={doc.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isChecked ? '#C8F542' : '#F4F2ED', cursor: 'pointer', fontSize: '0.75rem', fontWeight: isChecked ? 800 : 400, transition: 'color 0.15s' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {
                          if (isChecked) {
                            setTipoDocumento(tipoDocumento.filter(t => t !== doc.value));
                          } else {
                            setTipoDocumento([...tipoDocumento, doc.value]);
                          }
                        }} 
                        style={{ accentColor: '#C8F542', cursor: 'pointer' }} 
                      />
                      {doc.label}
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8A8F99', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. Disciplina</label>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ background: '#0A0C0F', color: '#F4F2ED', border: '1px solid #1F242D', borderRadius: '10px', padding: '0.625rem', fontSize: '0.813rem', width: '100%', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Selecione...</option>
                {moodleCourses
                  .filter(c => {
                    const activeCatId = categoryChain[categoryChain.length - 1] === 'all' 
                      ? (categoryChain.length > 1 ? categoryChain[categoryChain.length - 2] : 'all') 
                      : categoryChain[categoryChain.length - 1];

                    if (activeCatId !== 'all') {
                      const descendantIds = getAllDescendantCategoryIds(activeCatId, moodleCategories);
                      const matchCat = descendantIds.includes(String(c.category));
                      if (!matchCat) return false;
                    }

                    const matchYear = selectedAno === 'all' || c.fullname.includes(selectedAno);
                    return matchYear;
                  })
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.fullname}</option>
                  ))
                }
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8A8F99', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Search size={14} /> 4. Buscar Aluno
              </label>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Nome do aluno..." 
                style={{ background: '#0A0C0F', border: '1px solid #1F242D', borderRadius: '10px', padding: '0.625rem', fontSize: '0.813rem', color: '#F4F2ED', outline: 'none' }}
              />
            </div>

            <div>
              {(() => {
                const activeCatId = categoryChain[categoryChain.length - 1] === 'all' 
                  ? (categoryChain.length > 1 ? categoryChain[categoryChain.length - 2] : 'all') 
                  : categoryChain[categoryChain.length - 1];
                const isButtonActive = activeCatId !== 'all';

                return (
                  <button 
                    style={{ 
                      width: '100%', 
                      padding: '0.688rem', 
                      borderRadius: '10px',
                      background: !isButtonActive ? '#1F242D' : '#C8F542', 
                      color: !isButtonActive ? '#8A8F99' : '#0A0C0F', 
                      fontWeight: 800, 
                      border: 'none',
                      cursor: !isButtonActive ? 'not-allowed' : 'pointer', 
                      opacity: !isButtonActive ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: !isButtonActive ? 'none' : '0 0 16px rgba(200, 245, 66, 0.2)'
                    }} 
                    onClick={handleCarregarAlunos}
                    disabled={!isButtonActive || loadingAlunos}
                  >
                    {loadingAlunos ? 'Carregando...' : 'Carregar'}
                  </button>
                )
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* PAINEL DE AÇÃO EM MASSA */}
      {selectedIds.length > 0 && (
        <div style={{ padding: '1rem', background: 'rgba(200, 245, 66, 0.05)', border: '1px solid rgba(200, 245, 66, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckSquare size={16} style={{ marginBottom: -3, marginRight: 6 }} /> {selectedIds.length} Aluno(s) Selecionado(s)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: 'var(--primary)', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileDown size={16} /> Emitir e Baixar em Lote
            </button>
          </div>
        </div>
      )}

      {moodleUsers.length > 0 && (
        <p style={{ color: '#8A8F99', fontSize: '0.75rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💡 <span style={{ color: '#C8F542', fontWeight: 800 }}>Dica:</span> Selecione alunos individualmente ou clique no topo da tabela para marcar todos para emissão em massa.
        </p>
      )}

      {/* TABELA DE ALUNOS */}
      <div className={styles.tableWrapper} style={{ background: '#111318', border: '1px solid #1F242D', borderRadius: '16px', padding: '1.25rem', overflowX: 'auto' }}>
        {moodleUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>
            Nenhum aluno carregado. Preencha os filtros acima para carregar o quadro.
          </div>
        ) : (
          <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className={styles.thead}>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.8rem', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredMoodleUsers.length && filteredMoodleUsers.length > 0} 
                    onChange={toggleSelectAll} 
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>Nome Completo</th>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>E-mail</th>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>CPF</th>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.8rem', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMoodleUsers.map((u: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: selectedIds.includes(String(u.id)) ? 'rgba(200, 245, 66, 0.02)' : 'transparent' }}>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(String(u.id))} 
                      onChange={() => toggleSelect(String(u.id))} 
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.8rem', fontWeight: 'bold', color: 'white' }}>{u.fullname}</td>
                  <td style={{ padding: '0.8rem', color: 'var(--secondary)', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={{ padding: '0.8rem' }}>{u.cpf || '-'}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: u.status === 'Aprovado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      color: u.status === 'Aprovado' ? '#10b981' : '#f59e0b', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 600 
                    }}>
                      {u.status || 'Em Curso'}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem', display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                    <button style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <FileDown size={14} /> Emitir
                    </button>
                    <button style={{ background: 'transparent', color: 'var(--secondary)', border: 'none', cursor: 'pointer' }}>
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
