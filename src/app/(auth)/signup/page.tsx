'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { School } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-blue)' }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', margin: '1rem', padding: '2.5rem', textAlign: 'center', borderRadius: 16 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--brand-blue)', marginBottom: '.5rem' }}>Conta criada!</h2>
          <p style={{ color: 'var(--text-s)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
            Verifique seu e-mail para confirmar a conta, ou tente fazer login diretamente.
          </p>
          <a href="/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            Ir para o Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-blue)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '2rem 2rem 1rem', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: 'var(--brand-orange)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <School size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-blue)' }}>Criar Conta</h1>
            <p style={{ fontSize: '.82rem', color: 'var(--text-s)' }}>We Make Gestão Comercial</p>
          </div>

          <div style={{ padding: '0 2rem 2rem' }}>
            {error && <div className="alert alert-error mb-4">{error}</div>}

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-control" value={name}
                  onChange={e => setName(e.target.value)} required placeholder="Seu nome" />
              </div>
              <div>
                <label className="form-label">E-mail</label>
                <input type="email" className="form-control" value={email}
                  onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <div>
                <label className="form-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-control" value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6}
                    style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{
                    position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.35)', padding: 0, display: 'flex',
                  }}>
                    {showPass
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '.75rem', marginTop: '.25rem' }} disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
              <a href="/login" style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--text-s)' }}>
                Já tem conta? Fazer login
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

