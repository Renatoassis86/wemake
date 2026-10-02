'use client'

import { useState } from 'react'

/** Login da plataforma (mesma rota usada na tela de login) que leva direto à página inicial do módulo. */
export default function LoginModulo({ destino }: { destino: string }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      })
      const r = await res.json()
      if (r.error) { setErro(r.error); setCarregando(false); return }
      window.location.href = destino
    } catch {
      setErro('Não foi possível entrar agora (falha de conexão). Tente novamente.')
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={entrar} className="md-form">
      <label htmlFor="md-email">Usuário ou e-mail</label>
      <input id="md-email" type="text" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
      <label htmlFor="md-senha">Senha</label>
      <div className="md-senha">
        <input id="md-senha" type={ver ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required />
        <button type="button" onClick={() => setVer(v => !v)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}>{ver ? 'Ocultar' : 'Mostrar'}</button>
      </div>
      {erro ? <p role="alert" className="md-erro">{erro}</p> : null}
      <button type="submit" className="md-botao" disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar'}</button>
    </form>
  )
}
