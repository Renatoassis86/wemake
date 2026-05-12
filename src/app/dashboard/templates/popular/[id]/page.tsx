'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/client'
import { ArrowLeft, FileText, Check, Upload, Database, Users } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { getMoodleCourses, testMoodleConnection } from '../../../../actions'

const CURSOS_FICV = [
  "BACHARELADO EM TEOLOGIA EAD",
  "BACHARELADO EM TEOLOGIA PRES",
  "BACHARELADO EM DIREITO",
  "PÓS-GRADUAÇÃO EM PSICOTEOLOGIA",
  "PÓS-GRADUAÇÃO EM EDUCAÇÃO CRISTÃ CLÁSSICA",
  "PÓS-GRADUAÇÃO EM TEOLOGIA SISTEMÁTICA",
  "PÓS-GRADUAÇÃO EM GESTÃO ESCOLAR",
  "PÓS-GRADUAÇÃO EM TEOLOGIA DO NOVO TESTAMENTO",
  "PÓS-GRADUAÇÃO EM LIDERANÇA CRISTÃ",
  "PÓS-GRADUAÇÃO EM FORMAÇÃO POLÍTICA",
  "PÓS-GRADUAÇÃO EM MISSOLOGIA URBANA",
  "PÓS-GRADUAÇÃO EM PSICOPEDAGOGIA",
  "PÓS-GRADUAÇÃO EM HISTÓRIA DO CRISTIANISMO"
]

export default function PopularTemplatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('manual') // manual, spreadsheet, moodle
  
  const [values, setValues] = useState<Record<string, string>>({})
  const [selectedCourse, setSelectedCourse] = useState('')
  const [excelRows, setExcelRows] = useState<any[]>([])
  const [successCount, setSuccessCount] = useState<number | null>(null)

  // Campos para carregar do Banco de Dados Dinamicamente
  const [dbCourses, setDbCourses] = useState<any[]>([])
  const [selectedDbCourse, setSelectedDbCourse] = useState('')
  const [dbDisciplines, setDbDisciplines] = useState<any[]>([])
  const [discValues, setDiscValues] = useState<Record<string, string>>({})

  const spreadsheetInputRef = useRef<HTMLInputElement>(null)

  // Estados Integração Moodle
  function parseMoodleItem(fullname: string) {
    // Padrao 1: DIREITO - 2024.1 - P1 - DIREITO CIVIL I
    const p1 = fullname.match(/^(.+?)\s*-\s*(\d{4}\.\d+)\s*-\s*(P\d+)\s*-\s*(.+)$/);
    if (p1) return { curso: p1[1].trim(), periodo: p1[2].trim(), modulo: p1[3].trim(), disciplina: p1[4].trim() };

    // Padrao 2: PÓS EAD - 2024.1 - POSECC/T3 - 06 VERDADE, BONDADE E BELEZA
    const p2 = fullname.match(/^PÓS EAD\s*-\s*(\d{4}\.\d+)\s*-\s*([^/]+)\/T(\d+)\s*-\s*(.+)$/);
    if (p2) return { curso: `PÓS EAD (${p2[2].trim()})`, periodo: p2[1].trim(), modulo: `T${p2[3].trim()}`, disciplina: p2[4].trim() };

    // Padrao 3: EAD - 2020.2 - P1 - ETICA I
    const p3 = fullname.match(/^EAD\s*-\s*(\d{4}\.\d+)\s*-\s*(P\d+)\s*-\s*(.+)$/);
    if (p3) return { curso: 'EAD', periodo: p3[1].trim(), modulo: p3[2].trim(), disciplina: p3[3].trim() };

    // Padrao 4: EBCV - 2023.1 - Introdução...
    const p4 = fullname.match(/^EBCV\s*-\s*(\d{4}\.\d+)\s*-\s*(.+)$/);
    if (p4) return { curso: 'EBCV', periodo: p4[1].trim(), modulo: '-', disciplina: p4[2].trim() };

    return { curso: 'Extracurricular/Livre', periodo: '-', modulo: '-', disciplina: fullname };
  }

  function getAllDescendantCategoryIds(catId: string, list: any[]): string[] {
    let res = [catId];
    const children = list.filter(c => String(c.parent) === catId).map(c => String(c.id));
    for (const child of children) {
      res = [...res, ...getAllDescendantCategoryIds(child, list)];
    }
    return res;
  }

  const [moodleCategories, setMoodleCategories] = useState<any[]>([])
  const [moodleCourses, setMoodleCourses] = useState<any[]>([])
  const [moodleCategoryChain, setMoodleCategoryChain] = useState<string[]>(['all'])
  const [moodleSelectedAno, setMoodleSelectedAno] = useState<string>('all')
  const [moodleSelectedCursoSub, setMoodleSelectedCursoSub] = useState<string>('all')
  const [moodleSelectedModulo, setMoodleSelectedModulo] = useState<string>('all')
  const [moodleSelectedCourseState, setMoodleSelectedCourseState] = useState<string>('all')
  const [moodleAlunos, setMoodleAlunos] = useState<any[]>([])
  const [moodleLoadingAlunos, setMoodleLoadingAlunos] = useState(false)
  const [moodleSelectedAlunoLocal, setMoodleSelectedAlunoLocal] = useState<any | null>(null)

  const currentCategoryCoursesFiltered = useMemo(() => {
    return moodleCourses.filter((c: any) => {
      const activeCatId = moodleCategoryChain[moodleCategoryChain.length - 1] === 'all' 
        ? (moodleCategoryChain.length > 1 ? moodleCategoryChain[moodleCategoryChain.length - 2] : 'all') 
        : moodleCategoryChain[moodleCategoryChain.length - 1];

      if (activeCatId !== 'all') {
        const descendantIds = getAllDescendantCategoryIds(activeCatId, moodleCategories);
        return descendantIds.includes(String(c.categoryid));
      }
      return true;
    }).map((c: any) => ({
      ...c,
      parsed: parseMoodleItem(c.fullname)
    }));
  }, [moodleCourses, moodleCategoryChain, moodleCategories]);

  const distinctAnos = useMemo(() => {
    return Array.from(new Set(currentCategoryCoursesFiltered.map((c: any) => c.parsed.periodo).filter((p: any) => p !== '-'))).sort().reverse();
  }, [currentCategoryCoursesFiltered]);

  const distinctCursos = useMemo(() => {
    return Array.from(new Set(currentCategoryCoursesFiltered.map((c: any) => c.parsed.curso).filter((c: any) => c !== '-'))).sort();
  }, [currentCategoryCoursesFiltered]);

  const distinctModulos = useMemo(() => {
    return Array.from(new Set(currentCategoryCoursesFiltered.map((c: any) => c.parsed.modulo).filter((m: any) => m !== '-'))).sort();
  }, [currentCategoryCoursesFiltered]);

  const handleDownloadTemplate = () => {
    let headers = fields.map(f => f.rotulo || f.chave_tag)
    
    // Forçar CPF e NOME DO ALUNO no início
    const priority = ['CPF', 'NOME ALUNO', 'NOME DO ALUNO']
    headers = [
      ...priority.filter(p => headers.includes(p)),
      ...headers.filter(h => !priority.includes(h))
    ]

    if (dbDisciplines.length > 0) {
      dbDisciplines.forEach(d => {
        headers.push(`NOTA_${d.nome.toUpperCase().replace(/\s+/g, '_')}`)
      })
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers])
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importacao')

    const wopts: any = { bookType: 'xlsx', bookSST: false, type: 'binary' }
    const wbout = XLSX.write(wb, wopts)

    function s2ab(s: any) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `modelo_${template?.titulo || 'documento'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)
      setExcelRows(data)
      alert(`✅ Planilha "${file.name}" carregada com êxito! Encontrados ${data.length} registros.`)
    }
    reader.readAsBinaryString(file)
  }

  const handleBulkSubmit = async () => {
    if (excelRows.length === 0) return;
    setLoading(true);

    try {
      // Create body rows based on accurate spreadsheet headers mapping to placeholders tags keys or columns.
      // E.g. excel data { "NOME DO ALUNO": "Fulano", "CPF": "123" }
      const response = await fetch(`/api/documentos/batch/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excelRows)
      });
  
      if (response.ok) {
        setSuccessCount(excelRows.length)
      } else {
        alert("Erro ao enviar pacotes de em massa.");
      }
    } catch (err) {
      alert("Erro de conexão ao enviar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // 1. Carregar Template
      const { data: temp } = await supabase
        .from('templates_contrato')
        .select('*')
        .eq('id', id)
        .single()

      // Carregar Cursos do Banco para o formulário
      const { data: cData } = await supabase
        .from('cursos')
        .select('*')
      if (cData) setDbCourses(cData)

      if (temp) {
        setTemplate(temp)
        
        // 2. Carregar Campos
        const { data: flds } = await supabase
          .from('campos_template')
          .select('*')
          .eq('template_id', id)

        const standardFields = [
          { chave_tag: '{{nome_aluno}}', rotulo: 'NOME DO ALUNO' },
          { chave_tag: '{{cpf}}', rotulo: 'CPF' },
          { chave_tag: '{{data_nascimento}}', rotulo: 'DATA DE NASCIMENTO' },
          { chave_tag: '{{tipo_curso}}', rotulo: 'TIPO DE CURSO (EX: ESPECIALIZAÇÃO)' },
          { chave_tag: '{{nome_curso}}', rotulo: 'NOME DO CURSO' },
          { chave_tag: '{{carga_horaria}}', rotulo: 'CARGA HORÁRIA' },
          { chave_tag: '{{data_inicio}}', rotulo: 'DATA DE INÍCIO' },
          { chave_tag: '{{data_conclusao}}', rotulo: 'DATA DE CONCLUSÃO' },
          { chave_tag: '{{data_expedicao}}', rotulo: 'DATA DE EXPEDIÇÃO' }
        ]

        let finalFields: any[] = []

        if (flds && flds.length > 0) {
          finalFields = [...flds]
        } else {
          // Fallback: extrair variáveis do corpo se não houver
          const matches = temp.corpo_template ? (temp.corpo_template.match(/\{\{([^}]+)\}\}/g) || []) : []
          const fallbackFields = matches.map((tag: string) => ({
            chave_tag: tag,
            rotulo: tag.replace('{{', '').replace('}}', '').toUpperCase()
          }))
          finalFields = [...fallbackFields]
        }

        // Unificar com campos estáticos sem duplicar
        const existingTags = new Set(finalFields.map(f => f.chave_tag.toLowerCase()))
        
        // Inserir os campos padrão no início de finalFields apenas se não existirem
        standardFields.forEach(sf => {
          if (!existingTags.has(sf.chave_tag.toLowerCase())) {
            finalFields.unshift(sf)
          }
        })

        setFields(finalFields)
      }
      setLoading(false)
    }

    if (id) loadData()
  }, [id])

  // Efeito para carregar disciplinas do banco
  useEffect(() => {
    async function loadDisciplines() {
      if (!selectedDbCourse) {
        setDbDisciplines([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('disciplinas')
        .select('*')
        .eq('curso_id', selectedDbCourse)
      
      if (data) {
        setDbDisciplines(data)
      }
    }
    loadDisciplines()
  }, [selectedDbCourse])

  // Efeito para carregar categorias e cursos do Moodle
  useEffect(() => {
    if (tab !== 'moodle' || moodleCategories.length > 0) return;
    async function loadMoodleData() {
      try {
        const result = await getMoodleCourses()
        if (result.success) {
          setMoodleCourses(result.courses || [])
          setMoodleCategories(result.categories || [])
        }
      } catch (err) {}
    }
    loadMoodleData()
  }, [tab, moodleCategories.length])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('✅ Documento gerado com sucesso para ' + (values['{{nome_aluno}}'] || 'o aluno') + '!')
    router.push('/dashboard/templates')
  }

  if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Carregando dados do template...</div>
  if (!template) return <div style={{ padding: '2rem', color: 'red' }}>Template não encontrado.</div>

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Link href="/dashboard/templates" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Voltar para Lists
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}> Popular Template: {template.titulo}</h1>
        <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>Defina os dados para os campos variáveis do documento.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setTab('manual')}
          style={{ padding: '0.6rem 1.2rem', background: tab === 'manual' ? 'var(--primary)' : 'transparent', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={16} /> Individual (Manual)
        </button>
        <button 
          onClick={() => setTab('spreadsheet')}
          style={{ padding: '0.6rem 1.2rem', background: tab === 'spreadsheet' ? 'var(--primary)' : 'transparent', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Upload size={16} /> Em Massa (Planilha)
        </button>
        <button 
          onClick={() => setTab('moodle')}
          style={{ padding: '0.6rem 1.2rem', background: tab === 'moodle' ? 'var(--primary)' : 'transparent', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Database size={16} /> Integração Moodle
        </button>
      </div>

      <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
        
        {/* TAB 1 - MANUAL */}
        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} style={{ display: 'grid', gap: '1.2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>Preencha os Campos do Documento</h3>
            
            {/* Seletor de Curso para Disciplinas do Banco */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}>VINCULAR CURSO DO BANCO DE DADOS (OPCIONAL):</label>
              <select 
                value={selectedDbCourse}
                onChange={(e) => setSelectedDbCourse(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', marginBottom: '1rem' }}
              >
                <option value="">--- Selecione um curso cadastrado ---</option>
                {dbCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>

              {dbDisciplines.length > 0 && (
                <div style={{ marginTop: '1.2rem' }}>
                  <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px' }}>Médias Finais das Disciplinas:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '10px', background: '#0a0a0b', borderRadius: '8px' }}>
                    {dbDisciplines.map((d) => (
                      <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={d.nome}>{d.nome}</label>
                        <input 
                          type="text" 
                          placeholder="Média (Ex: 8.5)"
                          value={discValues[d.id] || ''}
                          onChange={(e) => setDiscValues({...discValues, [d.id]: e.target.value})}
                          style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {fields
                .filter((f) => !selectedDbCourse || f.chave_tag?.toLowerCase() !== '{{notas_disciplinas}}')
                .map((f) => (
                <div key={f.id || f.chave_tag}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '5px' }}>{f.rotulo}:</label>
                  <input 
                    type="text" 
                    required 
                    value={values[f.chave_tag] || ''}
                    onChange={(e) => setValues({...values, [f.chave_tag]: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }} 
                  />
                </div>
              ))}
            </div>

            <button type="submit" style={{ justifySelf: 'start', marginTop: '1rem', padding: '0.8rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} /> Gerar Documento
            </button>
          </form>
        )}

        {/* TAB 2 - PLANILHA */}
        {tab === 'spreadsheet' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '10px' }}>Importar via Planilha</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
              Baixe a planilha modelo contendo os cabeçalhos das variáveis, preencha os dados de todos os alunos e faça o upload novamente para gerar os certificados em massa.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <input 
                type="file" 
                ref={spreadsheetInputRef} 
                onChange={handleSpreadsheetUpload} 
                accept=".csv, .xlsx, .xls" 
                hidden 
              />
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                style={{ padding: '0.75rem 1.2rem', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                ⬇️ Baixar Planilha Guia
              </button>
              <button 
                type="button"
                onClick={() => spreadsheetInputRef.current?.click()}
                style={{ padding: '0.75rem 1.2rem', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                📂 Selecionar Arquivo
              </button>
            </div>

            {excelRows.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', background: 'rgba(200,245,66,0.05)', color: 'var(--primary)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(200,245,66,0.1)' }}>
                  🎉 Planilha lida com êxito! Encontrados <strong>{excelRows.length}</strong> registros prontos para emissão.
                </div>
                <button onClick={handleBulkSubmit} disabled={loading} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? 'Tratando fila...' : 'Processar Carga em Lote'}
                </button>
              </div>
            )}

            {successCount !== null && (
              <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                ✅ <strong>{successCount}</strong> documentos criados com sucesso! Verifique na lista principal.
              </div>
            )}
          </div>
        )}

        {/* TAB 3 - MOODLE */}
        {tab === 'moodle' && (
          <div style={{ display: 'grid', gap: '1.2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>Buscar dados do Moodle</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>Filtre para carregar alunos e médias de forma consolidada e popular o documento.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
              {moodleCategoryChain.map((catId, idx) => {
                const parentId = idx === 0 ? 0 : Number(moodleCategoryChain[idx - 1]);
                if (idx > 0 && moodleCategoryChain[idx - 1] === 'all') return null; 

                const items = moodleCategories.filter(cat => Number(cat.parent) === parentId);
                if (items.length === 0 && idx > 0) return null; 

                return (
                  <div key={idx}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '5px' }}>
                      {idx === 0 ? 'Unidade / Instituição:' : 
                       idx === 1 ? 'Departamento / Escola:' : 
                       'Área / Núcleo:'}
                    </label>
                    <select 
                      value={catId} 
                      onChange={(e) => { 
                        const val = e.target.value;
                        let newChain = [...moodleCategoryChain.slice(0, idx), val];
                        if (val !== 'all') {
                          const hasKids = moodleCategories.some(cat => Number(cat.parent) === Number(val));
                          if (hasKids) newChain.push('all');
                        }
                        setMoodleCategoryChain(newChain);
                        setMoodleSelectedCourseState('all');
                        setMoodleAlunos([]);
                        setMoodleSelectedAlunoLocal(null);
                      }}
                      style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="all">{idx === 0 ? 'Ver Todas' : 'Todas'}</option>
                      {items.map(cat => (
                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '5px' }}>Curso:</label>
                <select 
                  value={moodleSelectedCursoSub} 
                  onChange={(e) => { setMoodleSelectedCursoSub(e.target.value); setMoodleAlunos([]); setMoodleSelectedCourseState('all'); }}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                >
                  <option value="all">Ver Todos</option>
                  {distinctCursos.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '5px' }}>Ano / Período:</label>
                <select 
                  value={moodleSelectedAno} 
                  onChange={(e) => { setMoodleSelectedAno(e.target.value); setMoodleAlunos([]); setMoodleSelectedCourseState('all'); }}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                >
                  <option value="all">Ver Todos</option>
                  {distinctAnos.map((a: any) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '5px' }}>Módulo:</label>
                <select 
                  value={moodleSelectedModulo} 
                  onChange={(e) => { setMoodleSelectedModulo(e.target.value); setMoodleAlunos([]); setMoodleSelectedCourseState('all'); }}
                  style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                >
                  <option value="all">Ver Todos</option>
                  {distinctModulos.map((m: any) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '5px' }}>Disciplina / Filtro Final:</label>
              <select 
                value={moodleSelectedCourseState} 
                onChange={(e) => { setMoodleSelectedCourseState(e.target.value); setMoodleAlunos([]); setMoodleSelectedAlunoLocal(null); }}
                style={{ width: '100%', padding: '0.6rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="all">Todas as Disciplinas</option>
                {currentCategoryCoursesFiltered
                  .filter((c: any) => {
                    const matchYear = moodleSelectedAno === 'all' || c.parsed.periodo === moodleSelectedAno;
                    const matchCurso = moodleSelectedCursoSub === 'all' || c.parsed.curso === moodleSelectedCursoSub;
                    const matchModulo = moodleSelectedModulo === 'all' || c.parsed.modulo === moodleSelectedModulo;
                    return matchYear && matchCurso && matchModulo;
                  })
                  .map((c: any) => (
                    <option key={c.id} value={String(c.id)}>{c.parsed.disciplina}</option>
                  ))
                }
              </select>
            </div>

            <button 
              style={{ justifySelf: 'start', marginTop: '0.5rem', padding: '0.8rem 1.5rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: moodleLoadingAlunos ? 0.6 : 1 }}
              disabled={moodleLoadingAlunos}
              onClick={async () => {
                setMoodleLoadingAlunos(true);
                setMoodleSelectedAlunoLocal(null);
                try {
                  const coursesToSync = moodleSelectedCourseState !== 'all' 
                    ? currentCategoryCoursesFiltered.filter((c: any) => String(c.id) === moodleSelectedCourseState)
                    : currentCategoryCoursesFiltered.filter((c: any) => {
                        const matchYear = moodleSelectedAno === 'all' || c.parsed.periodo === moodleSelectedAno;
                        const matchCurso = moodleSelectedCursoSub === 'all' || c.parsed.curso === moodleSelectedCursoSub;
                        const matchModulo = moodleSelectedModulo === 'all' || c.parsed.modulo === moodleSelectedModulo;
                        return matchYear && matchCurso && matchModulo;
                      });

                  if (coursesToSync.length === 0) {
                    alert('Nenhum curso correspondente aos filtros atuais para sincronizar.');
                    setMoodleLoadingAlunos(false);
                    return;
                  }

                  // Limitar a lotes de 10 cursos para evitar sobrecarga e lentidão na API
                  const batch = coursesToSync.slice(0, 10);
                  const results = await Promise.all(batch.map((c: any) => testMoodleConnection(String(c.id), 'historico')));
                  
                  let aggregatedUsers: any[] = [];
                  for (const res of results) {
                    if (res.success && res.allUsers) {
                      aggregatedUsers = [...aggregatedUsers, ...res.allUsers];
                    }
                  }

                  const uniqueUsers = Array.from(new Map(aggregatedUsers.map((u: any) => [u.id, u])).values());
                  setMoodleAlunos(uniqueUsers);

                  if (uniqueUsers.length === 0) {
                    alert('Nenhum aluno encontrado para os cursos selecionados no Moodle.');
                  } else if (coursesToSync.length > 10) {
                    alert(`Sincronizados alunos dos primeiros 10 cursos (${uniqueUsers.length} alunos). Refine os filtros para mais precisão.`);
                  }
                } catch (e) {
                  console.error(e);
                }
                setMoodleLoadingAlunos(false);
              }}
            >
              <Users size={18} /> {moodleLoadingAlunos ? 'Sincronizando...' : 'Sincronizar Alunos'}
            </button>

            {moodleAlunos.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '5px' }}>Selecione o Aluno para Carregar:</label>
                <select 
                  onChange={(e) => {
                    const selected = moodleAlunos.find(a => String(a.id) === e.target.value);
                    setMoodleSelectedAlunoLocal(selected || null);
                    if (selected) {
                      setValues(prev => ({
                        ...prev,
                        '{{nome_aluno}}': selected.fullname || '',
                        '{{cpf}}': selected.cpf || '',
                        '{{email}}': selected.email || '',
                        '{{nome_curso}}': moodleCourses.find(c => String(c.id) === moodleSelectedCourseState)?.fullname || ''
                      }));
                    }
                  }}
                  style={{ width: '100%', padding: '0.75rem', background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                >
                  <option value="">--- Selecione um Aluno ---</option>
                  {moodleAlunos.map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.fullname} - {a.cpf || 'Sem CPF'}</option>
                  ))}
                </select>
              </div>
            )}

            {moodleSelectedAlunoLocal && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>📥 Dados Moodle Mapeados:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'white' }}><strong>Nome:</strong> {moodleSelectedAlunoLocal.fullname}</div>
                  <div style={{ fontSize: '0.8rem', color: 'white' }}><strong>CPF:</strong> {moodleSelectedAlunoLocal.cpf || 'Não informado'}</div>
                </div>

                {moodleSelectedAlunoLocal.notas_disciplinas && moodleSelectedAlunoLocal.notas_disciplinas !== '-' && (
                  <div>
                    <h5 style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Médias Finais das Disciplinas:</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                      {moodleSelectedAlunoLocal.notas_disciplinas.split(' | ').map((n: string, i: number) => {
                        const [name, score] = n.split(':');
                        return (
                          <div key={i} style={{ background: '#0a0a0b', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.02)' }}>
                            <span style={{ color: 'var(--secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={name}>{name}</span>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{score || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => { setTab('manual'); alert('✅ Dados pré-populados na aba Manual!'); }} 
                  style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Concluir e Ver Formulário
                </button>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  )
}
