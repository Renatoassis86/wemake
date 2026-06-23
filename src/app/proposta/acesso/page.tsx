'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AcessoPropostaPage() {
  const router = useRouter()
  const [pin, setPin]       = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // auto-focus primeiro campo
  useEffect(() => { inputs.current[0]?.focus() }, [])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[i] = val
    setPin(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) {
      setPin(digits.split(''))
      inputs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = pin.join('')
    if (code.length < 6) { setError('Digite os 6 dígitos do PIN.'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/propostas/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'PIN inválido.')
        setLoading(false)
        return
      }

      setSuccess(`Olá, ${data.escola_nome}! Redirecionando...`)
      setTimeout(() => router.push(`/proposta/${data.token}`), 1200)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const C = {
    navy:  '#0b1f44',
    royal: '#4c8ade',
    mint:  '#76f3cd',
    amber: '#ffcc00',
    white: '#ffffff',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.navy,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Geist', 'Inter', sans-serif",
    }}>

      {/* Glow orbs decorativos */}
      <div style={{ position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(76,138,222,0.18) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(118,243,205,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 'clamp(28px, 5vw, 48px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Image src="/proposta/logo-white.png" alt="We Make" width={140} height={36} style={{ objectFit: 'contain', height: 'auto' }} />
        </div>

        {/* Eyebrow */}
        <p style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mint, marginBottom: 10 }}>
          Acesso exclusivo — escola parceira
        </p>

        {/* Título */}
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          color: C.white,
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          marginBottom: 8,
        }}>
          Ver minha proposta
        </h1>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.6 }}>
          Digite o PIN de 6 dígitos enviado pela equipe We Make
        </p>

        <form onSubmit={handleSubmit}>

          {/* Campos PIN */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }} onPaste={handlePaste}>
            {pin.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 52, height: 64,
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  fontFamily: "'Fraunces', serif",
                  background: d ? 'rgba(76,138,222,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${d ? 'rgba(76,138,222,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 12,
                  color: C.white,
                  outline: 'none',
                  transition: 'all 0.15s',
                  caretColor: C.mint,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.mint; e.currentTarget.style.background = 'rgba(118,243,205,0.08)' }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = pin[i] ? 'rgba(76,138,222,0.5)' : 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = pin[i] ? 'rgba(76,138,222,0.12)' : 'rgba(255,255,255,0.05)'
                }}
              />
            ))}
          </div>

          {/* Erro */}
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.78rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(118,243,205,0.1)', border: '1px solid rgba(118,243,205,0.3)', color: C.mint, fontSize: '0.78rem', textAlign: 'center' }}>
              {success}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || pin.join('').length < 6}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 999,
              border: 'none',
              cursor: loading || pin.join('').length < 6 ? 'not-allowed' : 'pointer',
              background: pin.join('').length === 6 && !loading
                ? 'radial-gradient(120% 140% at 50% -20%, #fff 0%, #cfe2ff 45%, #9fc1f5 100%)'
                : 'rgba(255,255,255,0.08)',
              color: pin.join('').length === 6 && !loading ? C.navy : 'rgba(255,255,255,0.3)',
              fontFamily: "'Geist', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              boxShadow: pin.join('').length === 6 && !loading ? '0 8px 32px rgba(96,165,250,0.4)' : 'none',
            }}
          >
            {loading ? 'Verificando...' : 'Acessar proposta →'}
          </button>
        </form>

        {/* Rodapé */}
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          Não recebeu seu PIN?{' '}
          <a href="https://wa.me/5583982301530" target="_blank" rel="noopener noreferrer" style={{ color: C.mint, textDecoration: 'none' }}>
            Fale com a We Make
          </a>
        </p>
      </div>

      {/* Voltar */}
      <a href="/" style={{ marginTop: 24, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 2 }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
      >
        ← Voltar ao início
      </a>
    </div>
  )
}
