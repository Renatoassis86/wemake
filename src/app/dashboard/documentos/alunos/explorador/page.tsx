'use client'

import { useState, useEffect } from 'react'
import { getMoodleCourses, testMoodleConnection, getCourseContents } from '../../../../actions'
import styles from './explorador.module.css'
import { 
  Database, 
  Users, 
  GraduationCap, 
  FileText, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  FolderOpen,
  ArrowRight
} from 'lucide-react'

export default function ExploradorMoodle() {
  const [activeTab, setActiveTab] = useState<'geral' | 'notas' | 'cadastral' | 'ementas'>('geral')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cursos, setCursos] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [alunos, setAlunos] = useState<any[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aprovado' | 'Em Curso'>('all')
  const [moodleLogs, setMoodleLogs] = useState<string[]>([])
  
  const [categoryChain, setCategoryChain] = useState<string[]>(['all'])
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('all')
  const [courseSearch, setCourseSearch] = useState<string>('')
  const [courseSections, setCourseSections] = useState<any[]>([])
  const [selectedAno, setSelectedAno] = useState<string>('all')
  
  const [selectedEmenta, setSelectedEmenta] = useState<any | null>(null)
  const [loadingEmenta, setLoadingEmenta] = useState(false)
  const [ementaContents, setEmentaContents] = useState<any[]>([])
  const [ementaStudentsCount, setEmentaStudentsCount] = useState<number>(0)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const coursesPerPage = 12

  useEffect(() => {
    async function loadInitial() {
      setLoading(true)
      try {
        const result = await getMoodleCourses()
        if (result.success) {
          setCursos(result.courses || [])
          setCategories(result.categories || [])
          setSelectedCourse('all')
        } else {
          setError(result.error || "Falha ao carregar metadados estruturais do Moodle.")
        }
      } catch (e: any) {
        setError(e.message || "Erro de conexão ao carregar dados do Moodle.")
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  useEffect(() => {
    if (selectedCourse && selectedCourse !== 'all') {
      const fetchSections = async () => {
        try {
          const res = await getCourseContents(selectedCourse)
          setCourseSections(res.contents || [])
        } catch (e) {
          setCourseSections([])
        }
      }
      fetchSections()
    } else {
      setCourseSections([])
    }
    setSelectedDisciplina('all')
  }, [selectedCourse])

  const loadCourseStudents = async (id: string) => {
    setLoadingAlunos(true)
    setMoodleLogs([])
    try {
      const result = await testMoodleConnection(id, 'historico')
      if (result.logs) setMoodleLogs(result.logs)
      if (result.success) {
        setAlunos(result.allUsers || [])
      } else {
        setAlunos([])
      }
    } catch (e) {
      setAlunos([])
    } finally {
      setLoadingAlunos(false)
    }
  }

  const loadMultipleCourseStudents = async (ids: string[]) => {
    setLoadingAlunos(true)
    setMoodleLogs([])
    setAlunos([]) // Limpar anteriores para streaming visível
    
    try {
      const BATCH_SIZE = 8; // Processar de 8 em 8 cursos em paralelo para velocidade ideal sem pane
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(id => testMoodleConnection(id, 'historico').catch(() => ({ success: false })))
        );

        let batchUsers: any[] = []
        results.forEach(result => {
          const res = result as any;
          if (res && res.success && res.allUsers) {
            batchUsers = [...batchUsers, ...res.allUsers]
          }
        });

        if (batchUsers.length > 0) {
          setAlunos(prev => {
             // Evitar duplicados se o mesmo aluno estiver em múltiplos cursos
             const unique = new Map();
             [...prev, ...batchUsers].forEach(u => unique.set(`${u.id}-${u.curso}`, u));
             return Array.from(unique.values());
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlunos(false)
    }
  }

  const handleOpenEmenta = async (course: any) => {
    setSelectedEmenta(course)
    setLoadingEmenta(true)
    setEmentaContents([])
    setEmentaStudentsCount(0)
    try {
      const result = await getCourseContents(String(course.id))
      setEmentaContents(result.contents || [])
      
      const studentsData = await testMoodleConnection(String(course.id), 'historico')
      if (studentsData.success) {
        setEmentaStudentsCount(studentsData.allUsers?.length || 0)
      }
    } catch (e) {
      setEmentaContents([])
    } finally {
      setLoadingEmenta(false)
    }
  }

  // Função recursiva para obter todos os IDs de categorias descendentes (filhas, netas, etc.)
  function getAllDescendantCategoryIds(catId: string, list: any[]): string[] {
    let res = [catId];
    const children = list.filter(c => String(c.parent) === catId).map(c => String(c.id));
    for (const child of children) {
      res = [...res, ...getAllDescendantCategoryIds(child, list)];
    }
    return res;
  }

  const filteredAlunos = alunos.filter(a => {
    const matchSearch = a.fullname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <span>Consultando Moodle API em tempo real...</span>
    </div>
  )

  const totalCursos = cursos.filter(c => c.visible === 1).length
  const totalCat = categories.length

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Database className={styles.titleIcon} size={24} /> Explorador de Ingestão Moodle
          </h1>
          <p className={styles.subtitle}>Sincronização ao vivo para auditoria de ementas, tabelas relacionais e diagnósticos preditivos.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* METRIC CARDS */}
      {activeTab === 'geral' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div>
              <span className={styles.metricLabel}>Cursos Visíveis</span>
              <h4 className={styles.metricValue}>{totalCursos}</h4>
            </div>
            <Database size={32} className={styles.iconOverlay} />
          </div>

          <div className={styles.metricCard}>
            <div>
              <span className={styles.metricLabel}>Categorias</span>
              <h4 className={styles.metricValue}>{totalCat}</h4>
            </div>
            <FolderOpen size={32} className={styles.iconOverlay} />
          </div>

          <div className={styles.metricCard}>
            <div>
              <span className={styles.metricLabel}>Saúde da Integração</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 800 }}>
                Saudável <CheckCircle2 size={16} />
              </div>
            </div>
            <RefreshCw size={32} className={styles.iconOverlay} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('geral')} 
          className={`${styles.tabButton} ${activeTab === 'geral' ? styles.tabButtonActive : ''}`}
        >
          <Database size={16} /> Visão Estrutural
        </button>
        <button 
          onClick={() => setActiveTab('notas')} 
          className={`${styles.tabButton} ${activeTab === 'notas' ? styles.tabButtonActive : ''}`}
        >
          <GraduationCap size={16} /> Notas e Médias
        </button>
        <button 
          onClick={() => setActiveTab('cadastral')} 
          className={`${styles.tabButton} ${activeTab === 'cadastral' ? styles.tabButtonActive : ''}`}
        >
          <Database size={16} /> Dados Cadastrais
        </button>
        <button 
          onClick={() => setActiveTab('ementas')} 
          className={`${styles.tabButton} ${activeTab === 'ementas' ? styles.tabButtonActive : ''}`}
        >
          <FileText size={16} /> NLP e Ementas
        </button>
      </div>

      {/* Content */}
      <div style={{ marginTop: '0.5rem' }}>
        
        {/* ABA 1: ESTRUTURAL */}
        {activeTab === 'geral' && (
          <div className={styles.contentGrid}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>
                <Database size={16} /> Coleção de Cursos ({totalCursos})
              </h3>
              <div className={styles.scrollList}>
                {cursos.filter(c => c.visible === 1).map(c => (
                  <div key={c.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listTextMain}>{c.fullname}</div>
                      <div className={styles.listTextSub}>{c.shortname || "S/N"}</div>
                    </div>
                    <span className={styles.pill}>ID: {c.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>
                <Filter size={16} /> Mapeamento de Categorias ({totalCat})
              </h3>
              <div className={styles.scrollList}>
                {categories.map(cat => (
                  <div key={cat.id} className={styles.listItem}>
                    <div className={styles.listTextMain}>{cat.name}</div>
                    <span className={styles.pill}>ID: {cat.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: NOTAS E CADASTRAL */}
        {(activeTab === 'notas' || activeTab === 'cadastral') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={styles.filterBar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
              {categoryChain.map((catId, idx) => {
                const parentId = idx === 0 ? 0 : Number(categoryChain[idx - 1]);
                if (idx > 0 && categoryChain[idx - 1] === 'all') return null; 

                const items = categories.filter(cat => Number(cat.parent) === parentId);
                if (items.length === 0 && idx > 0) return null; 

                return (
                  <div className={styles.inputGroup} key={idx}>
                    <label>
                      {idx === 0 ? 'Unidade / Instituição:' : 
                       idx === 1 ? 'Departamento / Escola:' : 
                       idx === 2 ? 'Área / Núcleo:' : 
                       idx === 3 ? 'Curso:' :
                       `Nível ${idx + 1}:`}
                    </label>
                    <select 
                      value={catId} 
                      onChange={(e) => { 
                        const val = e.target.value;
                        let newChain = [...categoryChain.slice(0, idx), val];
                        if (val !== 'all') {
                          const hasKids = categories.some(cat => Number(cat.parent) === Number(val));
                          if (hasKids) newChain.push('all');
                        }
                        setCategoryChain(newChain);
                        setSelectedCourse('all');
                      }}
                      className={styles.select}
                    >
                      <option value="all">{idx === 0 ? 'Ver Todas' : 'Todas'}</option>
                      {items.map(cat => (
                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}

              <div className={styles.inputGroup}>
                <label>Ano:</label>
                <select 
                  value={selectedAno} 
                  onChange={(e) => setSelectedAno(e.target.value)}
                  className={styles.select}
                >
                  <option value="all">Ver Todos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              <div className={styles.inputGroup} style={{ maxWidth: '160px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  🔍 Filtrar Disciplina:
                </label>
                <input 
                  type="text" 
                  value={courseSearch} 
                  onChange={e => setCourseSearch(e.target.value)} 
                  placeholder="Nome do curso..." 
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem', fontSize: '0.813rem', color: 'var(--foreground)', height: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Disciplina:</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className={styles.select}
                >
                  <option value="all">Todas</option>
                  {cursos
                    .filter(c => {
                      const matchSearch = courseSearch === '' || c.fullname.toLowerCase().includes(courseSearch.toLowerCase());
                      if (!matchSearch) return false;

                      const activeCatId = categoryChain[categoryChain.length - 1] === 'all' 
                        ? (categoryChain.length > 1 ? categoryChain[categoryChain.length - 2] : 'all') 
                        : categoryChain[categoryChain.length - 1];

                      if (activeCatId !== 'all') {
                        const descendantIds = getAllDescendantCategoryIds(activeCatId, categories);
                        const matchCat = descendantIds.includes(String(c.categoryid));
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

              <div className={styles.inputGroup}>
                <label>Atividade / Tópico:</label>
                <select 
                  value={selectedDisciplina} 
                  onChange={(e) => setSelectedDisciplina(e.target.value)}
                  className={styles.select}
                >
                  <option value="all">Todas</option>
                  {courseSections.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Status:</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="all">Ver Todos</option>
                  <option value="Aprovado">Aprovado ({">= 7.0"})</option>
                  <option value="Em Curso">Em Curso / Crítico</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Buscar Aluno:</label>
                <div className={styles.inputWrapper}>
                  <Search size={16} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="Nome..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <button 
                  className={styles.nlpButton} 
                  style={{ width: '100%', padding: '0.625rem', justifyContent: 'center', background: 'var(--primary)', color: '#000', fontWeight: 800, opacity: 1 }} 
                  onClick={() => {
                    if (selectedCourse !== 'all') {
                      loadCourseStudents(selectedCourse);
                    } else {
                      const filteredCourseIds = cursos
                        .filter(c => {
                          const matchSearch = courseSearch === '' || c.fullname.toLowerCase().includes(courseSearch.toLowerCase());
                          if (!matchSearch) return false;

                          const activeCatId = categoryChain[categoryChain.length - 1] === 'all' 
                            ? (categoryChain.length > 1 ? categoryChain[categoryChain.length - 2] : 'all') 
                            : categoryChain[categoryChain.length - 1];

                          if (activeCatId !== 'all') {
                            const descendantIds = getAllDescendantCategoryIds(activeCatId, categories);
                            const matchCat = descendantIds.includes(String(c.categoryid));
                            if (!matchCat) return false;
                          }

                          const matchYear = selectedAno === 'all' || c.fullname.includes(selectedAno);
                          return matchYear;
                        })
                        .map(c => String(c.id));

                      if (filteredCourseIds.length > 0) {
                        loadMultipleCourseStudents(filteredCourseIds);
                      }
                    }
                  }}
                  disabled={false}
                >
                  Carregar
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper} style={{ position: 'relative' }}>
              {loadingAlunos && (
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid var(--border)', backdropFilter: 'blur(4px)' }}>
                  <div className={styles.spinner} style={{ width: 12, height: 12 }}></div> Certificando...
                </div>
              )}
              
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Nome Completo</th>
                      <th className={styles.th}>CPF</th>
                      {activeTab === 'notas' ? (
                        <>
                          <th className={styles.th}>Média</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th}>Notas</th>
                        </>
                      ) : (
                        <>
                          <th className={styles.th}>Email</th>
                          <th className={styles.th}>Telefone</th>
                          <th className={styles.th}>Data Nasc.</th>
                          <th className={styles.th}>Semestre</th>
                        </>
                      )}
                    </tr>
                    </thead>
                    <tbody>
                      {filteredAlunos.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)', fontStyle: 'italic' }}>Nenhum aluno encontrado ou sem notas para essa turma.</td></tr>
                      ) : (
                        filteredAlunos.map((a: any, i) => (
                          <tr key={i} className={styles.tr}>
                            <td className={styles.td} style={{ fontWeight: 700 }}>{a.fullname}</td>
                            <td className={styles.td} style={{ color: 'var(--secondary)', fontFamily: 'var(--mono)', fontSize: '0.688rem' }}>{a.cpf}</td>
                            {activeTab === 'notas' ? (
                              <>
                                <td className={styles.td} style={{ color: 'var(--primary)', fontWeight: 800 }}>{a.media_final || "N/D"}</td>
                                <td className={styles.td}>
                                  {a.status === 'Aprovado' ? (
                                    <span className={`${styles.statusPill} ${styles.statusApproved}`}><CheckCircle2 size={12} /> Aprovado</span>
                                  ) : (
                                    <span className={`${styles.statusPill} ${styles.statusInCourse}`}>Em Curso</span>
                                  )}
                                </td>
                                <td className={styles.td} style={{ maxWidth: '400px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {a.notas_disciplinas && a.notas_disciplinas !== '-' ? (
                                      a.notas_disciplinas.split(' | ')
                                        .filter((note: string) => {
                                          if (selectedDisciplina === 'all') return true;
                                          return note.toLowerCase().includes(selectedDisciplina.toLowerCase());
                                        })
                                        .map((note: string, idx: number) => {
                                          const firstColon = note.indexOf(':');
                                          const lastColon = note.lastIndexOf(':');
                                          const name = firstColon > -1 ? note.substring(0, firstColon).trim() : note.trim();
                                          const score = lastColon > -1 ? note.substring(lastColon + 1).trim() : '';

                                          return (
                                            <div 
                                              key={idx} 
                                              style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                background: 'rgba(255,255,255,0.03)', 
                                                padding: '0.35rem 0.625rem', 
                                                borderRadius: '6px', 
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                fontSize: '0.688rem',
                                                gap: '1rem'
                                              }}
                                            >
                                              <span style={{ color: 'var(--secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {name}
                                              </span>
                                              <span style={{ 
                                                fontWeight: 800, 
                                                color: score === '-' ? 'var(--secondary)' : parseFloat(score) >= 7 ? 'var(--primary)' : '#F59E0B',
                                                background: 'rgba(0,0,0,0.15)',
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: '4px',
                                                fontFamily: 'var(--mono)'
                                              }}>
                                                {score}
                                              </span>
                                            </div>
                                          );
                                        })
                                    ) : (
                                      <span style={{ color: 'var(--secondary)', fontSize: '0.688rem', fontStyle: 'italic' }}>-</span>
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className={styles.td} style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{a.email || '-'}</td>
                                <td className={styles.td} style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{a.phone || '-'}</td>
                                <td className={styles.td} style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{a.data_nascimento || '-'}</td>
                                <td className={styles.td} style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{a.semestre || '-'}</td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {moodleLogs.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'var(--mono)' }}>
                  <strong style={{ color: 'var(--foreground)', marginBottom: '0.25rem', fontSize: '0.688rem', textTransform: 'uppercase' }}>Log de Sincronização API:</strong>
                  {moodleLogs.map((log, i) => (
                    <div key={i} style={{ color: log.includes('❌') || log.includes('⚠️') ? '#EF4444' : log.includes('✅') ? 'var(--primary)' : 'inherit' }}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {activeTab === 'ementas' && (
          <>
            <div className={styles.nlpGrid}>
              {cursos.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage).map(c => (
                <div key={c.id} className={styles.nlpCard}>
                  <div>
                    <div className={styles.nlpHeader}>
                      <span className={styles.nlpBadge}>{c.shortname || "EAD"}</span>
                      {c.summary ? (
                        <span style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%' }}></span> Ementa Ativa
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.625rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: 6, height: 6, background: 'var(--secondary)', borderRadius: '50%', opacity: 0.5 }}></span> Vazia
                        </span>
                      )}
                    </div>
                    <h4 className={styles.nlpTitle}>{c.fullname}</h4>
                    <div className={styles.nlpText}>
                      {c.summary ? c.summary.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ') : "Descrição de ementa vazia."}
                    </div>
                  </div>
                  <div className={styles.nlpFooter}>
                    <button className={styles.nlpButton} onClick={() => handleOpenEmenta(c)}>
                      Ver Detalhes NLP <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINAÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                Mostrando <b>{Math.min(cursos.length, (currentPage - 1) * coursesPerPage + 1)} - {Math.min(cursos.length, currentPage * coursesPerPage)}</b> de <b>{cursos.length}</b> Cursos
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ background: 'rgba(255,255,255,0.02)', color: currentPage === 1 ? 'var(--secondary)' : 'var(--foreground)', border: '1px solid var(--border)', padding: '0.375rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                  &larr; Anterior
                </button>
                <button 
                  disabled={currentPage * coursesPerPage >= cursos.length} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', cursor: currentPage * coursesPerPage >= cursos.length ? 'not-allowed' : 'pointer', fontWeight: 800, opacity: currentPage * coursesPerPage >= cursos.length ? 0.4 : 1 }}
                >
                  Próxima &rarr;
                </button>
              </div>
            </div>

            {/* MODAL DE EMENTAS NLP */}
            {selectedEmenta && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedEmenta(null)}>
                <div style={{ background: 'var(--accent)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--card-shadow)' }} onClick={e => e.stopPropagation()}>
                  <div>
                    <span style={{ fontSize: '0.625rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--secondary)' }}>{selectedEmenta.shortname}</span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '0.5rem' }}>{selectedEmenta.fullname}</h2>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.688rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                         👥 {ementaStudentsCount} Alunos
                      </span>
                      <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.688rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                         📂 {ementaContents.length} Seções / Tópicos
                      </span>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase' }}>Sumário Cadastrado</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {selectedEmenta.summary ? selectedEmenta.summary.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ') : "Sem descrição cadastrada."}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Tópicos da Disciplina (Conteúdo)</h4>
                    
                    {loadingEmenta ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.813rem' }}>
                        <div className={styles.spinner} style={{ width: 14, height: 14 }}></div> Carregando estrutura Moodle...
                      </div>
                    ) : ementaContents.length === 0 ? (
                      <div style={{ fontSize: '0.813rem', color: 'var(--secondary)', fontStyle: 'italic' }}>Nenhum tópico ou módulo encontrado para este curso.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {ementaContents.map((section, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.813rem', color: 'var(--primary)' }}>{section.name}</div>
                            {section.modules && section.modules.length > 0 && (
                              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {section.modules.map((mod: any, mIdx: number) => (
                                  <li key={mIdx} style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                    {mod.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
