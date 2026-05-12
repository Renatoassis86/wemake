'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../../../infrastructure/supabase/client'
import { FileText, Download, Filter, Check, ListFilter, RefreshCw, AlertCircle } from 'lucide-react'
import { getMoodleCourses, testMoodleConnection } from '../../../../actions'
import * as XLSX from 'xlsx'

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [cursos, setCursos] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedTipo, setSelectedTipo] = useState('') // Categoria Pai (Nível 1)
  const [selectedCursoCat, setSelectedCursoCat] = useState('') // Categoria Filho (Nível 2)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')

  // Colunas/Variáveis Dinâmicas
  const [availableColumns, setAvailableColumns] = useState<{ id: string, label: string }[]>([
    { id: 'fullname', label: 'Nome Completo' },
    { id: 'email', label: 'E-mail' },
  ])
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['fullname', 'email'])

  useEffect(() => {
    async function loadCourses() {
      try {
        const result = await getMoodleCourses()
        if (result.success) {
          setCursos(result.courses || [])
          setCategories(result.categories || [])
        } else {
          setError(result.error || 'Erro ao carregar cursos do Moodle')
        }
      } catch (err) {
        setError('Erro de conexão ao carregar cursos.')
      } finally {
        setLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  const handleFetchData = async () => {
    let coursesToFetch = []
    
    if (selectedCourse) {
      coursesToFetch = cursos.filter(c => String(c.id) === selectedCourse)
    } else if (selectedCursoCat) {
      coursesToFetch = cursos.filter(c => String(c.category) === selectedCursoCat)
    } else if (selectedTipo) {
      // Se selecionou Tipo, pegar todas as subcategorias daquele tipo
      const subCats = categories.filter(cat => String(cat.parent) === selectedTipo).map(cat => String(cat.id))
      // Incluir a própria categoria pai
      subCats.push(selectedTipo)
      coursesToFetch = cursos.filter(c => subCats.includes(String(c.category)))
    } else {
      setError('Por favor, selecione uma Categoria ou Curso para prosseguir.')
      return
    }

    if (coursesToFetch.length === 0) {
      setError('Nenhum curso encontrado para os filtros selecionados.')
      return
    }

    setLoading(true)
    setError(null)
    setAlunos([])

    try {
      const promises = coursesToFetch.map(async (c: any) => {
        const result = await testMoodleConnection(String(c.id), 'historico')
        return result.success && result.allUsers ? result.allUsers : []
      })
      
      const results = await Promise.all(promises)
      const aggregatedAlunos = results.flat()

      if (aggregatedAlunos.length > 0) {
        setAlunos(aggregatedAlunos)
        
        // Colunas dinâmicas (Média Geral, Notas por Disciplina, etc)
        const firstItem = aggregatedAlunos[0]
        const dynColumns = Object.keys(firstItem)
          .filter(k => k !== 'id')
          .map(key => ({
            id: key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
          }))
        setAvailableColumns(dynColumns)
      } else {
        setError('Nenhum aluno encontrado para os cursos/disciplinas selecionadas.')
      }
    } catch (err: any) {
      setError('Erro de conexão ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const toggleColumn = (id: string) => {
    if (selectedColumns.includes(id)) {
      setSelectedColumns(selectedColumns.filter(c => c !== id))
    } else {
      setSelectedColumns([...selectedColumns, id])
    }
  }

  const filteredAlunos = alunos.filter(a => {
    // Filtro de semestre se houver essa variável nos dados do aluno (ex: customfields)
    const matchSem = !selectedSemester || (a.semestre === selectedSemester || a.customfields?.some((f: any) => f.shortname === 'semestre' && f.value === selectedSemester))
    return matchSem
  })

  const handleExport = () => {
    const headers = availableColumns
      .filter(c => selectedColumns.includes(c.id))
      .map(c => c.label.toUpperCase())

    const rows = filteredAlunos.map(aluno => {
      return availableColumns
        .filter(c => selectedColumns.includes(c.id))
        .map(c => {
          const val = aluno[c.id]
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val || '')
        })
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Moodle')

    const wopts: any = { bookType: 'xlsx', bookSST: false, type: 'binary' }
    const wbout = XLSX.write(wb, wopts)

    function s2ab(s: any) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_moodle_curso_${selectedCourse}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Relatórios Dinâmicos (Moodle)</h1>
          <p className="text-muted-foreground">Trabalhe os dados e atributos de alunos de forma global e monte sua tabela.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleFetchData}
            className="bg-brand-green hover:bg-brand-green-hover text-zinc-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-brand-green/20"
            disabled={loading || !selectedCourse}
            style={{ opacity: (loading || !selectedCourse) ? 0.6 : 1 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Carregar Dados
          </button>

          <button 
            onClick={handleExport}
            className="border border-zinc-800 hover:bg-zinc-900 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            disabled={filteredAlunos.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar Planilha
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Painel de Filtros e Colunas */}
        <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Filter size={16} /> FILTROS
            </span>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '4px' }}>Categoria ou Curso:</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}>
                  <option value="">Todas as categorias...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '4px' }}>Disciplina / Módulo:</label>
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}>
                  <option value="">Selecione...</option>
                  {cursos
                    .filter(c => !selectedCategory || String(c.category) === selectedCategory)
                    .map(c => (
                    <option key={c.id} value={c.id}>{c.fullname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '4px' }}>Semestre:</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}>
                  <option value="">Todos</option>
                  {Array.from(new Set(alunos.map((a: any) => a.semestre).filter(Boolean))).map((sem: any, i) => (
                    <option key={i} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleFetchData} 
                disabled={loading || !selectedCourse}
                style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (loading || !selectedCourse) ? 0.6 : 1, marginTop: '5px' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Consultando...' : 'Carregar Dados do Moodle'}
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <ListFilter size={16} /> EXIBIR COLUNAS
            </span>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {availableColumns.map(col => (
                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedColumns.includes(col.id)} 
                    onChange={() => toggleColumn(col.id)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela Dinâmica */}
        <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Carregando dados...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => (
                    <th key={col.id} style={{ padding: '12px 16px', color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.length === 0 ? (
                  <tr>
                    <td colSpan={selectedColumns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)', fontSize: '0.85rem' }}>Nenhum aluno encontrado para os filtros selecionados.</td>
                  </tr>
                ) : (
                  filteredAlunos.map((aluno, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      {availableColumns.filter(c => selectedColumns.includes(c.id)).map(col => (
                        <td key={col.id} style={{ padding: '12px 16px', color: 'white', fontSize: '0.85rem' }}>{aluno[col.id]}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
