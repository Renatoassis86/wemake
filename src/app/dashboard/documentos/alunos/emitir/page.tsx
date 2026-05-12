'use client'

import { useState, useEffect } from 'react'
import styles from '../../../dashboard.module.css'
import { FileText, Table, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'





import { getMoodleCourses, testMoodleConnection } from '@/app/actions'

export default function EmitirCertificadosPage() {
  const [source, setSource] = useState<'manual' | 'planilha' | 'moodle' | null>(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estados para Sincronização Moodle
  const [syncedData, setSyncedData] = useState<any[]>([])
  const [moodleCourses, setMoodleCourses] = useState<any[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const [searchMoodle, setSearchMoodle] = useState('')

  // Estados para Planilha
  const [spreadsheetData, setSpreadsheetData] = useState<any[]>([])
  const [isReadingSheet, setIsReadingSheet] = useState(false)

  useEffect(() => {
    // Carregar cursos reais do Moodle
    getMoodleCourses().then(res => {
      if (res.success) {
        setMoodleCourses(res.courses || [])
      }
    })
  }, [])

  const handleSyncMoodle = async () => {
    if (!selectedCourse) return
    setSyncLoading(true)
    try {
      const res = await testMoodleConnection(selectedCourse, 'historico')
      if (res.success && res.allUsers) {
        setSyncedData(res.allUsers.map((u: any) => ({
          id: u.id,
          nome: u.fullname,
          curso: u.curso,
          progresso: u.progresso || 0, // se vier do moodle
          media: u.media_geral && u.media_geral !== '-' ? parseFloat(u.media_geral) : 10, // Default 10 ou calculo
          status: u.progresso && u.progresso === 100 ? 'Finalizado' : 'Em Andamento',
          phone: u.phone
        })))
      } else {
        alert("Erro ao sincronizar dados. Verifique a integração.")
      }
    } catch (e) {
      alert("Erro na requisição.")
    } finally {
      setSyncLoading(false)
    }
  }

  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simular emissão
    setTimeout(() => {
       setLoading(false)
       setSuccess(true)
    }, 2000)
  }

  return (
    <div>
      <h1 className={styles.title}>Emissão de Certificados e Históricos</h1>
      <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>Selecione a origem dos dados dos alunos para gerar os documentos (FICV).</p>

      {success && (
        <div style={{ background: 'rgba(200, 245, 66, 0.1)', border: '1px solid rgba(200, 245, 66, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={20} /> Emissão processada com sucesso! Os PDFs foram salvos na central.
        </div>
      )}

      {/* 1. Escolha da Fonte */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setSource('manual')}
          style={{
            background: source === 'manual' ? 'rgba(200, 245, 66, 0.05)' : 'rgba(255,255,255,0.01)',
            border: source === 'manual' ? '1px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '16px', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <FileText size={28} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Manualmente</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Preencha os dados de um único aluno no formulário.</p>
        </button>

        <button 
          onClick={() => setSource('planilha')}
          style={{
            background: source === 'planilha' ? 'rgba(200, 245, 66, 0.05)' : 'rgba(255,255,255,0.01)',
            border: source === 'planilha' ? '1px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '16px', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Table size={28} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Via Planilha (Excel/CSV)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Importe uma lista em lote para disparar múltiplos documentos.</p>
        </button>

        <button 
          onClick={() => setSource('moodle')}
          style={{
            background: source === 'moodle' ? 'rgba(200, 245, 66, 0.05)' : 'rgba(255,255,255,0.01)',
            border: source === 'moodle' ? '1px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '16px', padding: '1.5rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={28} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Puxar API (Moodle)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Sincronize notas e aprovações direto do ambiente virtual.</p>
        </button>
      </div>

      {source && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, fontFamily: 'var(--serif)', color: 'white', marginBottom: '1.5rem' }}>
            Configurar Emissão {source === 'manual' ? 'Manual' : source === 'planilha' ? 'Lote (Planilha)' : 'Sincronizada (Moodle API)'}
          </h2>

          <form onSubmit={handleEmitir} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Escolha do Curso */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>CURSO</label>
              <select 
                value={selectedCourse} 
                onChange={e => setSelectedCourse(e.target.value)}
                required
                style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white' }}
              >
                <option value="" disabled>Selecione o Curso...</option>
                {moodleCourses.map((c: any) => (
                  <option key={c.id} value={c.id} style={{ background: '#0A0C0F' }}>{c.fullname} (ID: {c.id})</option>
                ))}
              </select>
            </div>

            {source === 'manual' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Nome Completo do Aluno</label>
                    <input name="nome" placeholder="Ex: Lucas Gabriel Sales" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>CPF</label>
                    <input name="cpf" placeholder="000.000.000-00" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>C.R.A (Média Global)</label>
                    <input name="cra" placeholder="Ex: 8.5" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Documentos a Emitir (Selecione múltiplos)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer' }}>
                        <input type="checkbox" value="historico" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem' }}>Histórico Acadêmico</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer' }}>
                        <input type="checkbox" value="certificado_conclusao" style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem' }}>Certificado de Conclusão de Curso</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer' }}>
                        <input type="checkbox" value="certificado_evento" style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem' }}>Certificado de Evento / Extensão</span>
                      </label>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', cursor: 'pointer', marginTop: '4px' }}>
                      <input type="checkbox" value="merge_pdf" style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mesclar todos os arquivos em um único PDF</span>
                    </label>
                  </div>

                </div>
              </>
            )}

            {source === 'planilha' && (
              <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: '16px', textAlign: 'center' }}>
                <Table size={40} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
                <p style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>Arraste uma Planilha (.xlsx ou .csv)</p>
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>A planilha deve conter colunas: NOME, CPF, CURSO, CRA</p>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button type="button" style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer' }}>
                    Selecionar Arquivo
                  </button>
                  
                  <a href="/api/planilha/modelo" download style={{ textDecoration: 'none' }}>
                    <button type="button" style={{ background: 'rgba(200, 245, 66, 0.1)', color: 'var(--primary)', border: '1px solid rgba(200, 245, 66, 0.2)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Baixar Planilha Modelo (.xlsx)
                    </button>
                  </a>

                </div>
              </div>
            )}




            {source === 'moodle' && syncedData.length === 0 && (
              <div style={{ padding: '3rem 2rem', border: '1px solid rgba(200, 245, 66, 0.1)', background: 'rgba(200, 245, 66, 0.02)', borderRadius: '16px', textAlign: 'center' }}>
                <RefreshCw size={40} style={{ color: 'var(--primary)', marginBottom: '1.2rem', animation: syncLoading ? 'spin 1s linear infinite' : 'none' }} className={syncLoading ? styles.spin : ''} />
                <p style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>Sincronização com o Moodle FICV</p>
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>O sistema lerá em tempo real o progresso, notas e aprovações dos alunos matriculados.</p>
                
                <button 
                  type="button" 
                  onClick={handleSyncMoodle}
                  disabled={syncLoading || !selectedCourse}
                  style={{ background: 'var(--primary)', color: '#000', fontWeight: 700, border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: (syncLoading || !selectedCourse) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', opacity: (!selectedCourse || syncLoading) ? 0.6 : 1 }}
                >
                  {syncLoading ? 'Sincronizando API...' : 'Consultar Banco de Dados Moodle'} <ArrowRight size={16} />
                </button>
                {!selectedCourse && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '8px', display: 'block' }}>⚠️ Selecione um Curso acima primeiro</span>}
              </div>
            )}

            {source === 'moodle' && syncedData.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>✅ {syncedData.length} Registros Sincronizados</p>
                  
                  <input 
                    placeholder="Filtrar por nome ou variável..." 
                    value={searchMoodle}
                    onChange={e => setSearchMoodle(e.target.value)}
                    style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', maxWidth: '300px', flex: '1' }} 
                  />
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--secondary)', fontSize: '0.8rem' }}>
                        <th style={{ padding: '0.8rem' }}><input type="checkbox" defaultChecked /></th>
                        <th style={{ padding: '0.8rem' }}>Aluno</th>
                        <th style={{ padding: '0.8rem' }}>Curso</th>
                        <th style={{ padding: '0.8rem' }}>Progresso %</th>
                        <th style={{ padding: '0.8rem' }}>Média (GPA)</th>
                        <th style={{ padding: '0.8rem' }}>Variável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncedData.filter(d => d.nome.toLowerCase().includes(searchMoodle.toLowerCase()) || d.status.toLowerCase().includes(searchMoodle.toLowerCase())).map((d: any) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', opacity: d.media < 7 ? 0.6 : 1 }}>
                          <td style={{ padding: '0.8rem' }}>
                            <input 
                              type="checkbox" 
                              defaultChecked={d.media >= 7 && d.progresso === 100} 
                              disabled={d.media < 7} 
                              style={{ cursor: d.media < 7 ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.8rem', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{d.nome}</td>
                          <td style={{ padding: '0.8rem', fontSize: '0.8rem', color: 'var(--secondary)' }}>{d.curso}</td>
                          <td style={{ padding: '0.8rem', color: 'white' }}>{d.progresso}%</td>
                          <td style={{ padding: '0.8rem', color: d.media < 7 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{d.media}</td>
                          <td style={{ padding: '0.8rem' }}>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              background: d.media >= 7 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              color: d.media >= 7 ? '#10b981' : '#ef4444', 
                              padding: '4px 8px', 
                              borderRadius: '6px' 
                            }}>
                              {d.media >= 7 ? 'Apto' : 'Reprovado (Média < 7)'}
                            </span>
                          </td>
                        </tr>

                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}



            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '1rem', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: '#000', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Calculando e Gerando Documentos...' : 'Processar Emissão em Lote'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
