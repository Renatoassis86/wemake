'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { enviarContatosComerciais } from './actions'
import { AREAS_CONTATO_COMERCIAL, type PessoaContatoComercial } from './schema'

const C = { navy: '#0b1f44', royal: '#4c8ade', mint: '#76f3cd', white: '#ffffff' }

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const PESSOA_VAZIA: PessoaContatoComercial = { nome: '', area: '', email: '', telefone: '' }

const rotuloStyle: React.CSSProperties = {
  display: 'block', fontSize: '.68rem', fontWeight: 700, color: 'rgba(255,255,255,.45)',
  marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'Geist', sans-serif",
}
const campoStyle: React.CSSProperties = {
  width: '100%', padding: '.75rem .9rem', background: 'rgba(255,255,255,.06)',
  border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 10, outline: 'none',
  color: C.white, fontSize: '.88rem', fontFamily: "'Geist', sans-serif", colorScheme: 'dark',
}
// <select> próprio, mais enxuto que campoStyle: no Chrome/Windows o padding do
// <select> também é aplicado a cada <option> do menu nativo — um padding grande
// como o de campoStyle infla a lista inteira (menu gigante, quase em branco).
// appearance:none + seta própria porque a seta nativa não respeita o padding menor.
const selectStyle: React.CSSProperties = {
  ...campoStyle,
  padding: '.6rem 2.1rem .6rem .85rem',
  appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='white' stroke-width='1.6'%3E%3Cpath d='M5 7l5 5 5-5'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right .75rem center', backgroundSize: '14px',
  cursor: 'pointer',
}
// Chrome honra cor/fundo do <option> no menu nativo (Windows); sem isso o menu
// abre branco, fora da identidade escura da página.
const opcaoStyle: React.CSSProperties = { backgroundColor: C.navy, color: C.white }

function Campo({ label, value, onChange, type = 'text', required, placeholder, options }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
  required?: boolean; placeholder?: string; options?: readonly string[]
}) {
  return (
    <div>
      <label style={rotuloStyle}>{label}{required && ' *'}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} required={required} style={selectStyle}>
          <option value="" style={opcaoStyle}>Selecione...</option>
          {options.map(o => <option key={o} value={o} style={opcaoStyle}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} type={type} required={required} placeholder={placeholder} autoComplete="off" style={campoStyle} />
      )}
    </div>
  )
}

export default function ContatosComerciaisPage() {
  const [escolaNome, setEscolaNome] = useState('')
  const [escolaCidade, setEscolaCidade] = useState('')
  const [escolaEstado, setEscolaEstado] = useState('')
  const [respondenteNome, setRespondenteNome] = useState('')
  const [respondenteCargo, setRespondenteCargo] = useState('')
  const [pessoas, setPessoas] = useState<PessoaContatoComercial[]>([{ ...PESSOA_VAZIA }])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; mensagens: string[] } | null>(null)
  const feedbackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (feedback) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [feedback])

  function atualizarPessoa(i: number, campo: keyof PessoaContatoComercial, valor: string) {
    setPessoas(ps => ps.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)
    try {
      const result = await enviarContatosComerciais({ escolaNome, escolaCidade, escolaEstado, respondenteNome, respondenteCargo, pessoas })
      if (result.ok) {
        setFeedback({ type: 'success', mensagens: ['Recebemos os dados. Obrigado! Vamos cadastrar essas pessoas pra receberem o material comercial da We Make.'] })
        setEscolaNome(''); setEscolaCidade(''); setEscolaEstado('')
        setRespondenteNome(''); setRespondenteCargo('')
        setPessoas([{ ...PESSOA_VAZIA }])
      } else {
        setFeedback({ type: 'error', mensagens: result.erros })
      }
    } catch (err) {
      setFeedback({ type: 'error', mensagens: [err instanceof Error ? err.message : 'Erro ao enviar. Tente de novo.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: C.navy, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 'clamp(2rem, 5vw, 3.5rem) 1.5rem', position: 'relative',
      overflow: 'hidden', fontFamily: "'Geist', 'Inter', sans-serif",
    }}>
      <div style={{ position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,138,222,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(118,243,205,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 780 }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} style={{ objectFit: 'contain', height: 36, width: 'auto' }} priority />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mint, marginBottom: 10 }}>
          Ativação comercial We Make
        </p>

        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic',
          fontSize: 'clamp(1.7rem, 4.5vw, 2.5rem)', color: C.white, textAlign: 'center',
          lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 14,
        }}>
          Quem vai receber o material comercial da We Make?
        </h1>

        <p style={{ textAlign: 'center', fontSize: '.84rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 2.25rem' }}>
          Pra treinar a equipe certa e mandar o manual de marca pras pessoas que de fato vão apresentar a We Make
          às famílias, precisamos que a escola aponte quem são elas. Pode ser mais de uma pessoa — coordenação,
          secretaria/matrículas, marketing, comercial ou direção.
        </p>

        {feedback && (
          <div ref={feedbackRef} role="status" aria-live="polite" style={{
            marginBottom: '1.5rem', padding: '1rem 1.3rem', borderRadius: 12,
            background: feedback.type === 'success' ? 'rgba(118,243,205,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(118,243,205,0.3)' : 'rgba(239,68,68,0.25)'}`,
            color: feedback.type === 'success' ? C.mint : '#fca5a5',
            fontWeight: 600, fontSize: '.84rem', lineHeight: 1.6,
          }}>
            {feedback.mensagens.map((m, i) => <div key={i}>{feedback.type === 'error' ? '• ' : ''}{m}</div>)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="surface-glass" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>

            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: C.mint, marginBottom: '1rem' }}>
              Sua escola
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <Campo label="Nome da escola" value={escolaNome} onChange={setEscolaNome} required />
              <Campo label="Cidade" value={escolaCidade} onChange={setEscolaCidade} />
              <Campo label="Estado (UF)" value={escolaEstado} onChange={setEscolaEstado} options={ESTADOS_BR} />
            </div>

            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: C.mint, marginBottom: '1rem' }}>
              Quem está preenchendo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <Campo label="Seu nome" value={respondenteNome} onChange={setRespondenteNome} required />
              <Campo label="Seu cargo" value={respondenteCargo} onChange={setRespondenteCargo} placeholder="Ex.: Coordenadora pedagógica" />
            </div>

            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: C.mint, marginBottom: '1rem' }}>
              Pessoas autorizadas a receber o material
            </div>

            {pessoas.map((p, i) => (
              <div key={i} style={{ padding: '1.1rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, marginBottom: '.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem' }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: C.white, fontFamily: "'Geist', sans-serif" }}>Pessoa {i + 1}</span>
                  {pessoas.length > 1 && (
                    <button type="button" onClick={() => setPessoas(ps => ps.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist', sans-serif" }}>
                      Remover
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '.85rem' }}>
                  <Campo label="Nome" value={p.nome} onChange={v => atualizarPessoa(i, 'nome', v)} required />
                  <Campo label="Área" value={p.area} onChange={v => atualizarPessoa(i, 'area', v)} options={AREAS_CONTATO_COMERCIAL} required />
                  <Campo label="E-mail" value={p.email} onChange={v => atualizarPessoa(i, 'email', v)} type="email" required />
                  <Campo label="Telefone/WhatsApp" value={p.telefone} onChange={v => atualizarPessoa(i, 'telefone', v)} placeholder="(00) 00000-0000" />
                </div>
              </div>
            ))}

            <button type="button" onClick={() => setPessoas(ps => [...ps, { ...PESSOA_VAZIA }])}
              style={{
                width: '100%', padding: '.75rem', marginBottom: '1.75rem',
                background: 'transparent', border: '1.5px dashed rgba(255,255,255,.2)', borderRadius: 10,
                color: C.mint, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'Geist', sans-serif",
              }}>
              + Adicionar outra pessoa
            </button>

            <aside style={{
              margin: '0 0 1.5rem', padding: '1rem 1.2rem', borderRadius: 10,
              background: 'rgba(255,255,255,.03)', borderLeft: `3px solid ${C.mint}`,
              fontSize: '.78rem', lineHeight: 1.65, color: 'rgba(255,255,255,.55)',
            }}>
              <b style={{ display: 'block', marginBottom: '.25rem', color: C.white }}>Como usamos esses dados</b>
              Os e-mails informados aqui são usados só pra enviar o treinamento de ativação comercial e o manual de marca da We Make.
              Quem acessa é a equipe da We Make. Pra corrigir ou remover algum contato, escreva para contato@wemake.tec.br.
            </aside>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '.68rem', color: 'rgba(255,255,255,.2)' }}>
          We Make © {new Date().getFullYear()} · Ativação Comercial
        </p>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <a href="/" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            ← Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}
