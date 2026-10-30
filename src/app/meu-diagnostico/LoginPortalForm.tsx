'use client'

import { useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import { entrarComPortal } from './actions'

const C = {
  navy:  '#0b1f44',
  royal: '#4c8ade',
  mint:  '#76f3cd',
  white: '#ffffff',
}

export default function LoginPortalForm() {
  const [estado, acao, pendente] = useActionState(entrarComPortal, undefined)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const mudar = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...senha]
    next[i] = v
    setSenha(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  const teclado = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !senha[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const colar = (e: React.ClipboardEvent) => {
    const digitos = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digitos.length === 6) {
      setSenha(digitos.split(''))
      inputs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const senhaCompleta = senha.join('')

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
      <div style={{ position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,138,222,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(118,243,205,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="surface-glass" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 420,
        padding: 'clamp(28px, 5vw, 48px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} style={{ objectFit: 'contain', height: 36, width: 'auto' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mint, marginBottom: 10 }}>
          Acesso exclusivo — escola parceira
        </p>

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
          Meu diagnóstico
        </h1>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.6 }}>
          Entre com o e-mail e a senha de 6 números enviados pela equipe We Make
        </p>

        <form action={acao}>
          <label htmlFor="email" style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            E-mail da escola
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            placeholder="escola@exemplo.com.br"
            style={{
              width: '100%', padding: '.8rem 1rem', marginBottom: '1.4rem',
              background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 10,
              outline: 'none', color: C.white, fontSize: '.9rem', fontFamily: "'Geist', sans-serif",
            }}
          />

          <input type="hidden" name="senha" value={senhaCompleta} />
          <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Senha (6 números)
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 2vw, 10px)', marginBottom: 28, width: '100%' }} onPaste={colar}>
            {senha.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => mudar(i, e.target.value)}
                onKeyDown={e => teclado(i, e)}
                aria-label={`Dígito ${i + 1} da senha`}
                style={{
                  flex: '1 1 0', minWidth: 0, maxWidth: 52,
                  height: 'clamp(50px, 14vw, 64px)',
                  textAlign: 'center',
                  fontSize: 'clamp(1.15rem, 5.5vw, 1.6rem)',
                  fontWeight: 700,
                  fontFamily: "'Fraunces', serif",
                  background: d ? 'rgba(76,138,222,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${d ? 'rgba(76,138,222,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 12,
                  color: C.white,
                  outline: 'none',
                  caretColor: C.mint,
                }}
              />
            ))}
          </div>

          {estado?.erro && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.78rem', textAlign: 'center' }}>
              {estado.erro}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={pendente || !email || senhaCompleta.length < 6}
          >
            {pendente ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          Não recebeu seu acesso?{' '}
          <a href="https://wa.me/5583982301530" target="_blank" rel="noopener noreferrer" style={{ color: C.mint, textDecoration: 'none' }}>
            Fale com a We Make
          </a>
        </p>
      </div>

      <a href="/" style={{ marginTop: 24, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', position: 'relative', zIndex: 2 }}>
        ← Voltar ao início
      </a>
    </div>
  )
}
