'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { enviarFormularioPublico } from '@/lib/actions'
import { ChevronDown } from 'lucide-react'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

const SEGMENTOS = ['Infantil', 'Fundamental 1', 'Fundamental 2', 'Ensino Médio']

function Section({ title, children, index }: { title: string; children: React.ReactNode; index?: number }) {
  const [expanded, setExpanded] = useState(true) // All sections expanded by default

  return (
    <div style={{ marginBottom: '1.5rem', border: '1.5px solid #94a3b8', borderRadius: 12, overflow: 'hidden' }} className="form-section">
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '1rem 1.25rem',
          background: expanded ? '#f1f5f9' : '#fff',
          border: 'none',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all .2s',
        }}
        onMouseEnter={e => {
          if (!expanded) e.currentTarget.style.background = '#f8fafc'
        }}
        onMouseLeave={e => {
          if (!expanded) e.currentTarget.style.background = '#fff'
        }}
      >
        <div style={{ fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4a8fe7', textAlign: 'left' }}>
          {title}
        </div>
        <ChevronDown
          size={18}
          style={{
            color: '#4a8fe7',
            transition: 'transform .3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {expanded && (
        <div style={{ padding: '1.25rem', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>{children}</div>
}

function Field({ label, name, type = 'text', required, options, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; options?: string[]; placeholder?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#4A5568', marginBottom: '.4rem' }}>
        {label}{required && ' *'}
      </label>
      {options ? (
        <select name={name} required={required} autoComplete="off" style={{ width: '100%', padding: '.65rem .85rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 8, background: '#fff', outline: 'none', transition: 'border-color .15s, box-shadow .15s' }} onFocus={e => { e.target.style.borderColor = '#4a8fe7'; e.target.style.boxShadow = '0 0 0 3px rgba(74,143,231,.15)' }} onBlur={e => { e.target.style.borderColor = '#94a3b8'; e.target.style.boxShadow = 'none' }}>
          <option value="">Selecione...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea name={name} rows={3} placeholder={placeholder} autoComplete="off" style={{ width: '100%', padding: '.65rem .85rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 8, resize: 'vertical', outline: 'none', transition: 'border-color .15s, box-shadow .15s' }} onFocus={e => { e.target.style.borderColor = '#4a8fe7'; e.target.style.boxShadow = '0 0 0 3px rgba(74,143,231,.15)' }} onBlur={e => { e.target.style.borderColor = '#94a3b8'; e.target.style.boxShadow = 'none' }} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} autoComplete="off"
          style={{ width: '100%', padding: '.65rem .85rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 8, outline: 'none', transition: 'border-color .15s, box-shadow .15s' }}
          onFocus={e => { e.target.style.borderColor = '#4a8fe7'; e.target.style.boxShadow = '0 0 0 3px rgba(74,143,231,.15)' }}
          onBlur={e => { e.target.style.borderColor = '#94a3b8'; e.target.style.boxShadow = 'none' }} />
      )}
    </div>
  )
}

export default function FormularioPublico() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)

  // GARANTE QUE DADOS NUNCA SOMEM - Recupera do localStorage ao carregar página
  useEffect(() => {
    const formElement = document.querySelector('form')
    if (!formElement) return

    // Tenta recuperar rascunho salvo
    const savedData = localStorage.getItem('formulario_rascunho_auto')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        Object.entries(data).forEach(([key, value]) => {
          const input = formElement.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          if (input) {
            if (input.type === 'checkbox') {
              (input as HTMLInputElement).checked = true
            } else {
              input.value = value as string
            }
          }
        })
        console.log('✅ Dados recuperados do rascunho')
      } catch (e) {
        console.error('Erro ao recuperar rascunho:', e)
      }
    }
  }, [])

  // AUTO-SAVE a cada 1 segundo - GARANTE que dados estão SEMPRE salvos IMEDIATAMENTE
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const formElement = document.querySelector('form')
      if (formElement) {
        const formData = new FormData(formElement)
        const data: Record<string, any> = {}
        for (let [key, value] of formData.entries()) {
          data[key] = value
        }
        localStorage.setItem('formulario_rascunho_auto', JSON.stringify(data))
      }
    }, 1000) // A cada 1 segundo

    return () => clearInterval(autoSaveInterval)
  }, [])

  // Previne que página saia sem salvar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const formElement = document.querySelector('form')
      if (formElement) {
        const formData = new FormData(formElement)
        let hasData = false
        for (let [_, value] of formData.entries()) {
          if (value) {
            hasData = true
            break
          }
        }
        if (hasData && !loading) {
          e.preventDefault()
          e.returnValue = ''
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [loading])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Log dos dados sendo enviados
      console.log('📝 Enviando formulário...')
      console.log('Dados do formulário:')
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`)
      }

      const result = await enviarFormularioPublico(formData)

      console.log('📤 Resultado do servidor:', result)

      if (result && result.success) {
        setLoading(false)
        setFeedback({
          type: 'success',
          message: '✅ Recebemos seu pré-cadastro com sucesso. Nossa equipe comercial entrará em contato em breve para apresentar a proposta personalizada We Make.'
        })

        console.log('✅ SUCESSO! Dados salvos no banco de dados')

        // Aguarda 8 segundos para usuario ver a mensagem
        setTimeout(() => {
          window.location.href = '/formulario/obrigado'
        }, 8000)
      } else {
        setLoading(false)
        const errorMsg = result?.error || 'Erro desconhecido ao salvar'
        setFeedback({
          type: 'error',
          message: `❌ Erro ao enviar: ${errorMsg}`
        })
        console.error('❌ Erro:', errorMsg)
      }
    } catch (error: any) {
      setLoading(false)
      console.error('❌ Erro na requisição:', error)
      setFeedback({
        type: 'error',
        message: `❌ Erro ao enviar formulário: ${error?.message || 'Erro desconhecido'}`
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(1rem, 3vw, 1.5rem)', colorScheme: 'light' }}>
      {/* Logo + Botão de voltar */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Image
          src="/images/we-make-1.png"
          alt="We Make"
          width={120}
          height={32}
          style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: 32 }}
          priority
        />
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: 'transparent',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            padding: 'clamp(0.5rem, 2vw, 0.65rem) clamp(0.85rem, 3vw, 1.25rem)',
            borderRadius: '9999px',
            cursor: 'pointer',
            fontSize: 'clamp(0.8rem, 2vw, 0.85rem)',
            fontWeight: 600,
            fontFamily: 'var(--font-montserrat, sans-serif)',
            transition: 'all .2s',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f1f5f9'
            e.currentTarget.style.borderColor = '#5FE3D0'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = '#cbd5e1'
          }}
        >
          ← Voltar
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            background: 'rgba(74,143,231,.1)', border: '1px solid rgba(74,143,231,.3)',
            borderRadius: 9999, padding: 'clamp(0.3rem, 1vw, 0.4rem) clamp(0.8rem, 2vw, 1rem)', marginBottom: '1rem',
            fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', fontWeight: 700, color: '#4a8fe7',
            textTransform: 'uppercase', letterSpacing: '.08em',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            ✦ Formulário de Pré-Cadastro
          </div>

          <h1 style={{
            fontFamily: 'var(--font-cormorant, "Georgia", serif)',
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
            fontWeight: 700, color: '#0f172a', lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}>
            Parceria Educacional<br />
            <span style={{ color: '#4a8fe7' }}>We Make</span>
          </h1>

          <p style={{
            color: '#64748b', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', lineHeight: 1.6,
            maxWidth: 620, margin: '0 auto',
            fontFamily: 'var(--font-inter, sans-serif)',
            padding: '0 0.5rem',
          }}>
            Preencha o formulário abaixo com os dados de sua escola. Nossa equipe comercial entrará em contato para apresentar a proposta personalizada We Make.
          </p>
        </div>

        {feedback && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '90%',
            width: '600px',
            background: feedback.type === 'success' ? '#10b981' : '#ef4444',
            border: 'none',
            color: '#fff',
            padding: '1.25rem 1.75rem',
            borderRadius: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-inter, sans-serif)',
            fontSize: '1rem',
            boxShadow: feedback.type === 'success'
              ? '0 10px 30px rgba(16,185,129,.3)'
              : '0 10px 30px rgba(239,68,68,.3)',
            animation: 'slideDown 0.3s ease-out',
          }}>
            {feedback.message}
          </div>
        )}

        {/* Estilos globais para animação */}
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}</style>

        <form
          onSubmit={handleSubmit}
          onChange={() => setIsFormDirty(true)}
          autoComplete="off"
          spellCheck="false"
        >
          <div style={{ background: '#fff', borderRadius: 'clamp(12px, 3vw, 16px)', padding: 'clamp(1.25rem, 4vw, 2.5rem)', boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: '1.5rem', border: '1.5px solid #94a3b8' }}>

            <Section title="1. Responsável pelo Preenchimento" index={0}>
              <Field label="E-mail" name="resp_email" type="email" required placeholder="seu@escola.org" />
            </Section>

            <Section title="2. Dados da Escola" index={1}>
              <Row>
                <Field label="CNPJ" name="cnpj" required placeholder="00.000.000/0000-00" />
                <div style={{ gridColumn: 'span 1' }}><Field label="Razão Social" name="razao_social" required /></div>
              </Row>
              <Row>
                <div style={{ gridColumn: 'span 2' }}><Field label="Nome Fantasia" name="nome_fantasia" required /></div>
              </Row>
              <Row>
                <div style={{ gridColumn: 'span 2' }}><Field label="Rua" name="rua" required /></div>
                <Field label="Número" name="numero" required />
              </Row>
              <Row>
                <Field label="Bairro" name="bairro" required />
                <Field label="CEP" name="cep" required placeholder="00000-000" />
              </Row>
              <Row>
                <Field label="Cidade" name="cidade" required />
                <Field label="Estado (UF)" name="estado" options={ESTADOS_BR} required />
              </Row>
              <Row>
                <Field label="E-mail Institucional (Comunicação)" name="email_institucional" type="email" required placeholder="contato@escola.org" />
              </Row>
            </Section>

            <Section title="3. Informações Acadêmicas" index={2}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#334155', marginBottom: '.75rem' }}>Quais segmentos adotarão?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" name="seg_infantil" id="seg_infantil" style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#5FE3D0' }} />
                    <label htmlFor="seg_infantil" style={{ marginLeft: '.5rem', fontSize: '.85rem', color: '#475569', cursor: 'pointer' }}>Infantil</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" name="seg_fundamental_1" id="seg_fundamental_1" style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#5FE3D0' }} />
                    <label htmlFor="seg_fundamental_1" style={{ marginLeft: '.5rem', fontSize: '.85rem', color: '#475569', cursor: 'pointer' }}>Fundamental 1</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" name="seg_fundamental_2" id="seg_fundamental_2" style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#5FE3D0' }} />
                    <label htmlFor="seg_fundamental_2" style={{ marginLeft: '.5rem', fontSize: '.85rem', color: '#475569', cursor: 'pointer' }}>Fundamental 2</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" name="seg_ensino_medio" id="seg_ensino_medio" style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#5FE3D0' }} />
                    <label htmlFor="seg_ensino_medio" style={{ marginLeft: '.5rem', fontSize: '.85rem', color: '#475569', cursor: 'pointer' }}>Ensino Médio</label>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#334155', marginBottom: '.75rem' }}>Quantidade de alunos por segmento</div>
                <Row>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#64748b', marginBottom: '.3rem' }}>Infantil</label>
                    <input name="alunos_infantil" type="number" min="0" defaultValue="0" placeholder="0"
                      style={{ width: '100%', padding: '.55rem .75rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 6, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#64748b', marginBottom: '.3rem' }}>Fundamental 1</label>
                    <input name="alunos_fundamental_1" type="number" min="0" defaultValue="0" placeholder="0"
                      style={{ width: '100%', padding: '.55rem .75rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 6, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#64748b', marginBottom: '.3rem' }}>Fundamental 2</label>
                    <input name="alunos_fundamental_2" type="number" min="0" defaultValue="0" placeholder="0"
                      style={{ width: '100%', padding: '.55rem .75rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 6, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#64748b', marginBottom: '.3rem' }}>Ensino Médio</label>
                    <input name="alunos_ensino_medio" type="number" min="0" defaultValue="0" placeholder="0"
                      style={{ width: '100%', padding: '.55rem .75rem', fontSize: '.875rem', border: '1.5px solid #94a3b8', borderRadius: 6, outline: 'none' }} />
                  </div>
                </Row>
              </div>

              <Row>
                <Field label="Previsão de Início do Ano Letivo 2027" name="data_inicio_letivo" type="date" required />
                <Field label="Previsão de Término do Ano Letivo 2027" name="data_fim_letivo" type="date" required />
              </Row>
              <Row>
                <Field label="Formato do Ano Letivo" name="formato_ano_letivo" options={['Bimestre', 'Trimestre', 'Semestral']} required />
              </Row>
              <Field label="Observações Adicionais" name="observacoes" type="textarea" placeholder="Informações complementares sobre a escola" />
            </Section>

            <Section title="4. Representante Legal" index={3}>
              <Row>
                <div style={{ gridColumn: 'span 2' }}><Field label="Nome Completo" name="legal_nome" required /></div>
                <Field label="CPF" name="legal_cpf" required placeholder="000.000.000-00" />
              </Row>
              <Row>
                <Field label="E-mail (Assinatura)" name="legal_email" type="email" required />
                <Field label="WhatsApp" name="legal_whatsapp" required placeholder="(00) 00000-0000" />
              </Row>
              <Row>
                <div style={{ gridColumn: 'span 2' }}><Field label="Rua" name="legal_rua" required /></div>
                <Field label="Número" name="legal_numero" required />
              </Row>
              <Row>
                <Field label="Complemento" name="legal_complemento" placeholder="Apto, sala, etc" />
                <Field label="Bairro" name="legal_bairro" required />
              </Row>
              <Row>
                <Field label="Cidade" name="legal_cidade" required />
                <Field label="Estado (UF)" name="legal_estado" options={ESTADOS_BR} required />
                <Field label="CEP" name="legal_cep" required placeholder="00000-000" />
              </Row>
            </Section>

            <Section title="5. Financeiro e Faturamento" index={4}>
              <Row>
                <Field label="E-mail (Cobrança e Envio de NF)" name="fin_email_cobranca" type="email" required placeholder="financeiro@escola.org" />
              </Row>
              <Row>
                <Field label="Valor do Ticket Médio da Escola" name="ticket_medio" type="text" required placeholder="R$ 0,00" />
              </Row>
            </Section>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={(e) => {
                  const form = (e.target as HTMLButtonElement).closest('form')
                  if (form) {
                    const formData = new FormData(form)
                    const data: Record<string, any> = {}
                    for (let [key, value] of formData.entries()) {
                      data[key] = value
                    }
                    localStorage.setItem('formulario_rascunho', JSON.stringify(data))
                    alert('✅ Rascunho salvo localmente! Você pode continuar depois.')
                  }
                }}
                style={{
                  flex: 1,
                  padding: '.75rem',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 9999,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-montserrat, sans-serif)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#e2e8f0' }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#f1f5f9' }}
              >
                💾 Salvar Rascunho
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%',
                padding: 'clamp(0.75rem, 2vw, 0.95rem)',
                background: loading ? '#cbd5e1' : '#5FE3D0',
                color: loading ? '#64748b' : '#0f172a',
                fontWeight: 700,
                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                border: 'none',
                borderRadius: 9999,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                letterSpacing: '.02em',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(95,227,208,.3)',
                transition: 'all .2s',
                opacity: loading ? 0.7 : 1,
                minHeight: 44,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#4A7FDB'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#5FE3D0'
                  e.currentTarget.style.color = '#0f172a'
                }
              }}>
              {loading ? 'Enviando...' : 'Enviar Formulário'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#94a3b8', padding: '0 0.5rem' }}>
          We Make © {new Date().getFullYear()} · Gestão Comercial para Educação · Após envio, nossa equipe entrará em contato.
        </p>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        /* Force light theme on form inputs regardless of browser/OS dark mode */
        form input, form select, form textarea {
          color-scheme: light !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #94a3b8 !important;
        }
        form input::placeholder, form textarea::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        form input:focus, form select:focus, form textarea:focus {
          border-color: #4a8fe7 !important;
          box-shadow: 0 0 0 3px rgba(74,143,231,.15) !important;
        }
        /* Section card borders */
        .form-section {
          border-color: #94a3b8 !important;
        }

        /* Mobile form styling */
        @media (max-width: 768px) {
          .form-section {
            margin-bottom: 0.75rem !important;
          }

          input, select, textarea {
            font-size: 16px !important; /* Prevents zoom on iOS */
            padding: 0.65rem 0.85rem !important;
          }

          label {
            font-size: 0.8rem !important;
            margin-bottom: 0.35rem !important;
          }
        }

        @media (max-width: 480px) {
          form {
            padding: 0 0.5rem !important;
          }

          input, select, textarea {
            font-size: 16px !important;
          }
        }

        /* Touch-friendly buttons and inputs */
        button, input, select, textarea {
          min-height: 44px;
        }

        /* Ensure proper spacing in mobile */
        @media (max-width: 768px) {
          div[style*="display: 'grid'"][style*="gap:"] {
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  )
}
