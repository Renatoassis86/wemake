'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/client'
import { salvarTemplate } from '@/app/actions'


import { Check, ArrowRight, ArrowLeft, Upload, FileText, Settings, BadgePercent, CheckCircle } from 'lucide-react'

import styles from '../../dashboard.module.css'

export default function NovoTemplatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)

  const [docType, setDocType] = useState('')
  const [titulo, setTitulo] = useState('')
  const [vars, setVars] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '{{data_emissao}}', 
    '{{nome_aluno}}', 
    '{{notas_disciplinas}}'
  ])
  const [highlightedText, setHighlightedText] = useState('')
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, active: false })
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSave = async () => {
    try {
      // 1. Capturar o Corpo do Editor Atual
      const corpoHTML = editorRef.current?.innerHTML || 'Texto do template'

      // 2. Preparar FormData para a Server Action
      const formData = new FormData()
      formData.append('titulo', titulo || `Novo ${docType}`)
      formData.append('corpo_template', corpoHTML)

      // Anexar arquivo de fundo se houver (Para Certificados)
      if (selectedFile) {
        formData.append('fundo_certificado', selectedFile)
      }

      const varsToInsert = selectedTags.map(tag => ({
        tag: tag,
        label: tag.replace('{{', '').replace('}}', '').toUpperCase(),
        tipo: 'Texto',
        origem: 'manual'
      }))
      formData.append('variables', JSON.stringify(varsToInsert))

      // 3. Chamar a Server Action (Segura e Independente de cookies client-side HttpOnly)
      const result = await salvarTemplate(formData)

      if (result && result.success) {
        setShowSuccessModal(true)
        setTimeout(() => {
          router.push('/dashboard/templates')
        }, 2200)
      } else {
        alert('❌ Erro inesperado ao salvar template.')
      }
    } catch (err: any) {
      alert('❌ Erro Supabase: ' + err.message)
      console.error(err)
    }
  }







  const handleTextHighlight = (e: React.MouseEvent) => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 1) {
      setHighlightedText(selection.trim())
      setPopoverPos({ top: e.clientY - 40, left: e.clientX, active: true })
    } else {
      setPopoverPos({ ...popoverPos, active: false })
    }
  }

  const addHighlightedAsVar = () => {
    if (highlightedText) {
      const cleanTag = `{{${highlightedText.toLowerCase().replace(/\s+/g, '_')}}}`
      toggleTag(cleanTag)
      setPopoverPos({ ...popoverPos, active: false })
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }



  const handleDocTypeSelect = (type: string) => {
    setDocType(type)
    nextStep()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }


  // Vars default adaptativas por tipo
  const handleLoadVars = () => {
    if (docType === 'Certificado') {
      // Para certificados, como o texto já é digitado com as tags no passo 2, pula direto para Salvar!
      handleSave()
      return
    }

    if (docType === 'Historico') {
      setVars([
        { tag: '{{aluno_nome}}', label: 'Nome do Aluno', tipo: 'Texto', origem: 'cadastro' },
        { tag: '{{aluno_cpf}}', label: 'CPF', tipo: 'Texto', origem: 'cadastro' },
        { tag: '{{curso_nome}}', label: 'Nome do Curso', tipo: 'Texto', origem: 'Moodle/Mapeado' },
        { tag: '{{disciplinas_tabela}}', label: 'Grade de Disciplinas (Tabela)', tipo: 'Tabela', origem: 'CRA/Automático' },
        { tag: '{{cra}}', label: 'CRA (Coeficiente)', tipo: 'Número', origem: 'CRA/Automático' }
      ])
    } else {
      setVars([
        { tag: '{{contratado_nome}}', label: 'Razão Social', tipo: 'Texto', origem: 'cadastro' },
        { tag: '{{valor_total}}', label: 'Valor Total', tipo: 'Valor', origem: 'manual' }
      ])
    }
    nextStep()
  }


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h1 className={styles.title}>Novo Template</h1>
      <p className={styles.subtitle}>Siga o assistente passo a passo para cadastrar seu novo modelo.</p>

      {/* Progress Bar com Títulos */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3.5rem', 
        maxWidth: '500px', 
        margin: '0 auto 3rem auto', 
        position: 'relative' 
      }}>
        {['Tipo', 'Arquivo', 'Variáveis'].map((label, idx) => {
          const s = idx + 1;
          const isActive = step === s;
          const isCompleted = step > s;
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : '#1a1a1a',
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                color: isCompleted || isActive ? 'black' : 'var(--secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                transition: 'all 0.3s', zIndex: 2,
                boxShadow: isActive ? '0 0 15px rgba(132, 204, 22, 0.2)' : 'none'
              }}>
                {isCompleted ? <Check size={18} color="white" /> : s}
              </div>
              <span style={{ 
                fontSize: '0.85rem', 
                marginTop: '0.6rem', 
                fontWeight: isActive ? 'bold' : 'normal', 
                color: isActive || isCompleted ? 'white' : 'var(--secondary)',
                letterSpacing: '0.5px'
              }}>{label}</span>

              {s < 3 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '18px', 
                  left: 'calc(50% + 18px)', 
                  width: 'calc(100% - 36px)', 
                  height: '2px', 
                  background: isCompleted ? 'var(--primary)' : 'var(--border)', 
                  zIndex: 1 
                }}></div>
              )}
            </div>
          )
        })}
      </div>



      <div style={{ position: 'relative', minHeight: '400px' }}>
        
        {/* PASSO 1 - TIPO */}
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
              Selecione o Tipo de Documento
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button 
                onClick={() => handleDocTypeSelect('Contrato')}
                style={{ padding: '2rem', background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
              >
                <div style={{ padding: '0.8rem', background: 'rgba(163, 230, 53, 0.1)', borderRadius: '10px', color: '#a3e635' }}><FileText size={24} /></div>
                <div style={{ fontWeight: 'bold', color: 'white' }}>Contratos</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Gestão e aditivos</div>
              </button>

              <button 
                onClick={() => handleDocTypeSelect('Historico')}
                style={{ padding: '2rem', background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
              >
                <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}><BadgePercent size={24} /></div>
                <div style={{ fontWeight: 'bold', color: 'white' }}>Históricos / CRA</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Acadêmicos, disciplinas, notas</div>
              </button>

              <button 
                onClick={() => handleDocTypeSelect('Certificado')}
                style={{ padding: '2rem', background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
              >
                <div style={{ padding: '0.8rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', color: '#8b5cf6' }}><FileText size={24} /></div>
                <div style={{ fontWeight: 'bold', color: 'white' }}>Certificados</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Conclusão, eventos, etc.</div>
              </button>

            </div>
          </div>
        )}

        {/* PASSO 2 - ARQUIVO & METADADOS (Dinâmico por Tipo) */}
        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {docType === 'Contrato' && '📝 Editor de Contrato (Criar do Zero)'}
              {docType === 'Historico' && '📊 Grade de Histórico / Fórmulas'}
              {docType === 'Certificado' && '🥇 Fundo do Certificado (Anexar)'}
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Título do Template:</label>
                <input 
                  type="text" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={`Ex: ${docType === 'Contrato' ? 'Contrato de Prestação de Serviços' : 'Histórico Acadêmico CP'}`}
                  style={{ width: '100%', padding: '0.85rem', background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white' }} 
                />
              </div>

              {/* EDITOR PARA CONTRATOS (Word Like) */}
              {docType === 'Contrato' && (
                <div style={{ background: 'white', color: '#333', borderRadius: '16px', padding: '2rem', minHeight: '600px', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', margin: '-2rem -2rem 1rem -2rem', padding: '1rem 2rem' }}>
                    <button style={{ padding: '6px 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}>B</button>
                    <button style={{ padding: '6px 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', fontStyle: 'italic' }}>I</button>
                    <button style={{ padding: '6px 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', textDecoration: 'underline' }}>U</button>
                    <select style={{ padding: '6px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}><option>Fonte: Times</option></select>
                    <button style={{ padding: '6px 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}>Tabela</button>
                  </div>
                  <div 
                    ref={editorRef}
                    contentEditable 
                    style={{ flex: 1, outline: 'none', fontFamily: 'times, serif', lineHeight: '1.6' }}
                  >

                    <p style={{ textAlign: 'center' }}><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</strong></p>
                    <p style={{ marginTop: '2rem' }}>Pelo presente instrumento particular, de um lado, <strong>FACULDADE INTERNACIONAL CIDADE VIVA</strong>, sediada em João Pessoa/PB...</p>
                    <p>E de outro lado, o Aluno(a) <strong>{"{{nome_aluno}}"}</strong>, portador do CPF <strong>{"{{cpf}}"}</strong>...</p>
                    <p style={{ marginTop: '3rem' }}>Assinatura do Contratante: __________________________</p>
                  </div>
                </div>
              )}

              {/* EDITOR PARA HISTÓRICOS (Planilha Like) */}
              {docType === 'Historico' && (
                <div style={{ background: '#1a1d20', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '500px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '1rem' }}>🧮 Construtor de Grade (Estruture as disciplinas e insira as fórmulas calculadas):</span>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sidebar)' }}>
                        <th style={{ border: '1px solid var(--border)', padding: '10px' }}>Disciplina</th>
                        <th style={{ border: '1px solid var(--border)', padding: '10px' }}>Carga Horária</th>
                        <th style={{ border: '1px solid var(--border)', padding: '10px' }}>Média Final</th>
                        <th style={{ border: '1px solid var(--border)', padding: '10px' }}>Aprovação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid var(--border)', padding: '10px' }}><input type="text" placeholder="Ex: Cosmovisão Cristã" style={{ width: '100%', padding: '4px', background: 'transparent', border: 'none', color: 'white' }} /></td>
                        <td style={{ border: '1px solid var(--border)', padding: '10px' }}><input type="text" placeholder="40h" style={{ width: '100%', padding: '4px', background: 'transparent', border: 'none', color: 'white' }} /></td>
                        <td style={{ border: '1px solid var(--border)', padding: '10px' }}><input type="text" placeholder="{{nota}}" style={{ width: '100%', padding: '4px', background: 'transparent', border: 'none', color: 'white' }} /></td>
                        <td style={{ border: '1px solid var(--border)', padding: '10px', color: '#10b981' }}>Média &gt;= 7.0</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <p style={{ fontSize: '0.85rem' }}>🧬 Fórmula Geral do C.R.A: <code style={{ color: '#10b981' }}>(Soma das Médias Finais / Total de Disciplinas)</code></p>
                  </div>
                </div>
              )}

              {/* UPLOAD APENAS PARA CERTIFICADOS (Fidelidade do Background) */}
              {docType === 'Certificado' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  
                  {/* 1. Upload de Fundo */}
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Fundo do Certificado (Papel Timbrado):</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        padding: '2rem', 
                        background: 'var(--sidebar)', 
                        border: '2px dashed #8b5cf6', 
                        borderRadius: '16px', 
                        textAlign: 'center', 
                        cursor: 'pointer' 
                      }}
                    >
                      <Upload style={{ margin: '0 auto 8px auto', color: '#8b5cf6' }} size={24} />
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Anexar imagem de fundo</p>
                      {selectedFile && <p style={{ color: '#10b981', marginTop: '8px', fontSize: '0.8rem' }}>✔️ {selectedFile.name}</p>}
                    </div>
                  </div>

                  {/* 2. Campo Título */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Título do Certificado:</label>
                    <input 
                      type="text" 
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: CERTIFICADO DE CONCLUSÃO"
                      style={{ width: '100%', padding: '0.85rem', background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '10px', color: 'white', fontFamily: 'system-ui, sans-serif', fontWeight: 'bold', textTransform: 'uppercase' }} 
                    />

                  </div>

                  {/* 3. Corpo do Texto (Rich Text) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Texto Central do Certificado:</label>
                    <div style={{ background: 'white', color: '#333', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', gap: '6px', padding: '8px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                        <button onClick={() => document.execCommand('bold')} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>B</button>
                        <button onClick={() => document.execCommand('italic')} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontStyle: 'italic', cursor: 'pointer' }}>I</button>
                        <button onClick={() => document.execCommand('underline')} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', textDecoration: 'underline', cursor: 'pointer' }}>U</button>
                        <span style={{ borderLeft: '1px solid #cbd5e1', margin: '0 4px' }}></span>
                        <button onClick={() => document.execCommand('justifyLeft')} style={{ padding: '4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Left</button>
                        <button onClick={() => document.execCommand('justifyCenter')} style={{ padding: '4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Center</button>
                      </div>
                      <div 
                        ref={editorRef}
                        contentEditable 

                        style={{ 
                          padding: '2rem', 
                          minHeight: '280px', 
                          outline: 'none', 
                          fontFamily: 'times, serif', 
                          fontSize: '0.92rem', 
                          lineHeight: '1.8',
                          textAlign: 'justify'
                        }}
                      >
                        <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}><strong>O Diretor da Faculdade Internacional Cidade Viva</strong>, no uso de suas atribuições e nos termos da Lei de Diretrizes e Bases da Educação Nacional - Lei nº 9.394/96, certifica que <strong>{"{{nome_aluno}}"}</strong>, portador(a) do documento de nº <strong>{"{{cpf}}"}</strong>, nascido(a) em <strong>{"{{data_nascimento}}"}</strong>, concluiu o curso de <strong>{"{{tipo_curso}}"}</strong>, ao nível de Especialização, intitulado <strong>{"{{nome_curso}}"}</strong>, com carga horária de <strong>{"{{carga_horaria}}"}</strong> horas, iniciado em <strong>{"{{data_inicio}}"}</strong> e concluído em <strong>{"{{data_conclusao}}"}</strong>, nesta Instituição de Ensino Superior credenciada pelo Ministério da Educação (MEC), segundo a Portaria nº 35 de 18 de janeiro de 2018, DOU de 19/01/2018.</p>

                        <p style={{ textAlign: 'center', marginTop: '2rem' }}>João Pessoa/PB, <strong>{"{{data_expedicao}}"}</strong></p>
                      </div>

                    </div>
                  </div>


                  {/* 4. Atalhos de Variáveis */}
                  <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💡 VARIÁVEIS DISPONÍVEIS (Clique p/ copiar):</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['{{nome_aluno}}', '{{cpf}}', '{{data_nascimento}}', '{{nome_curso}}', '{{data_inicio}}', '{{data_conclusao}}', '{{data_expedicao}}'].map(v => (
                        <span key={v} onClick={() => navigator.clipboard.writeText(v)} style={{ fontSize: '0.75rem', background: '#2d264a', color: '#c084fc', padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(167, 139, 246, 0.3)', cursor: 'pointer' }}>
                          {v}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '8px' }}>
                       * A variável {"{{data_expedicao}}"} sairá com a data/hora exata do momento da geração.
                    </p>

                  </div>

                </div>
              )}


            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button onClick={prevStep} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <button onClick={handleLoadVars} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
                Avançar para Variáveis <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}


        {/* PASSO 3 - MAPEAMENTO */}
        {step === 3 && (

          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start', position: 'relative' }}>
            
            {/* Lado Esquerdo: DocuSign Real Frame Viewer com Bounding Boxes */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '1rem' }}>
                <FileText size={20} />
                <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Definir Variáveis no Documento</h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                👉 Como fazer: Arraste o mouse sobre qualquer área do documento abaixa para "Desenhar" o local da variável (Ex: Nome, Notas...).
              </p>

              <div style={{ position: 'relative', width: '100%', height: '700px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid var(--border)' }}>
                {selectedFile ? (
                  selectedFile.type === 'application/pdf' ? (
                    <iframe src={URL.createObjectURL(selectedFile) + "#toolbar=0"} style={{ width: '100%', height: '100%', border: 'none' }} />
                  ) : (
                    <img src={URL.createObjectURL(selectedFile)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <p style={{ padding: '2rem', textAlign: 'center', color: '#333' }}>Nenhum arquivo anexado.</p>
                )}

                {/* Camada Transparente de Anotação Overlay */}
                <div 
                  id="canvas-overlay"
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    cursor: 'crosshair', background: 'rgba(0,0,0,0.02)', pointerEvents: 'auto' 
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    (window as any).__dragStart = { x, y };
                  }}
                  onMouseUp={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const endX = e.clientX - rect.left;
                    const endY = e.clientY - rect.top;
                    const drag = (window as any).__dragStart;
                    if (drag && Math.abs(endX - drag.x) > 20) {
                      const width = Math.abs(endX - drag.x);
                      const height = Math.abs(endY - drag.y);
                      const left = Math.min(drag.x, endX);
                      const top = Math.min(drag.y, endY);
                      setHighlightedText(`Campo_${selectedTags.length + 1}`);
                      setPopoverPos({ top: e.clientY, left: e.clientX, active: true });
                    }
                  }}
                />

                {/* Simular Tags Ativas como Overlays no Documento */}
                {selectedTags.includes('{{nome_aluno}}') && (
                  <div style={{ position: 'absolute', top: '40%', left: '20%', width: '200px', height: '30px', border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.65rem', color: '#10b981', background: '#14171A', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>nome_aluno</span>
                  </div>
                )}
                {selectedTags.includes('{{notas_disciplinas}}') && (
                  <div style={{ position: 'absolute', top: '70%', left: '70%', width: '60px', height: '25px', border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.65rem', color: '#10b981', background: '#14171A', padding: '1px 4px', borderRadius: '3px' }}>notas</span>
                  </div>
                )}
              </div>
            </div>






            {/* Lado Direito: Grid de Mapeamento */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Mapeamento de Variáveis</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                Defina os campos dinâmicos que o sistema deve preencher neste documento.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {selectedTags.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Nenhuma variável configurada.</p>
                    <p style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>Arraste o mouse sobre o texto à esquerda para (+) Adicionar!</p>
                  </div>
                ) : (
                  selectedTags.map((tag: string, index: number) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem', 
                      background: '#14171A', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: '1px solid #10b981',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.05)',
                      animation: 'slideIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase' }}>CAMPO VARIÁVEL MAQUEADO</span>
                        <button 
                          onClick={() => toggleTag(tag)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>
                          Remover
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <code style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>{tag}</code>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>NOME NO SISTEMA:</span>
                          <input 
                            type="text" 
                            placeholder="Ex: Nome do Aluno"
                            defaultValue={tag.replace('{{', '').replace('}}', '').toUpperCase()} 
                            style={{ width: '100%', padding: '0.85rem', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} 
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>CLASSIFICAÇÃO:</span>
                            <select style={{ width: '100%', padding: '0.85rem', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '0.85rem' }}>
                              <option value="variavel">✏️ Variável (Editável)</option>
                              <option value="metadado">🔒 Metadado (Fixo)</option>
                            </select>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>BUSCAR DADO DE:</span>
                            <select style={{ width: '100%', padding: '0.85rem', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '0.85rem' }}>
                              <option value="manual">Manual (Formulário)</option>
                              <option value="moodle">Integração Moodle</option>
                              <option value="cadastro">Banco Arkos</option>
                              <option value="calc">Cálculo Automático</option>
                              <option value="xlsx">Planilha (.xlsx) com Modelo</option>
                              <option value="mista">Mista (Composto)</option>
                            </select>

                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>


              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <button onClick={prevStep} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '10px', cursor: 'pointer' }}>
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button 
                  onClick={handleSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', border: 'none', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Check size={16} /> Salvar Template
                </button>
              </div>
            </div>

            {showSuccessModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', zIndex: 99999 }}>

                <div style={{ background: '#14171A', padding: '2.5rem', borderRadius: '24px', border: '1px solid #10b981', textAlign: 'center', maxWidth: '400px', boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)', animation: 'popUp 0.3s ease-out' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <CheckCircle size={32} style={{ color: '#10b981' }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Template Salvo com Sucesso!</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1.5rem' }}>O modelo <strong>{titulo || 'Histórico Acadêmico'}</strong> foi registrado no motor de contratos Arkos.</p>
                  <p style={{ fontSize: '0.75rem', color: '#10b981' }}>Redirecionando para a central de emissão...</p>
                </div>
              </div>
            )}

          </div>
        )}


      </div>
    </div>
  )
}

