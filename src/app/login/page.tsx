'use client'

import styles from './login.module.css'
import { signIn, signUp } from '../actions'
import { useState, useEffect } from 'react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: any
}) {
  const [view, setView] = useState<'signin' | 'signup'>('signin')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Pegar erro da URL de forma segura no client
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setErrorMsg(err)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.brandingCol}>
        <div className={styles.sloganSmall}>A ARKOS É SUA SOLUÇÃO</div>
        <div className={styles.sloganBig}>
          Inteligência <span className={styles.dot}>.</span>
        </div>
        <p className={styles.sloganDesc}>
          A infraestrutura de decisão estratégica da nova economia.
        </p>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Arkos<span className={styles.accent}>Suite</span></h1>
          <p style={{ maxWidth: '400px', margin: '8px auto', color: '#8A8F99' }}>Acesse o Hub de Inteligência Arkos e seus módulos contratados.</p>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner}>
            ⚠️ {errorMsg}
          </div>
        )}

        {view === 'signin' ? (
          /* FORMULÁRIO DE LOGIN */
          <form action={signIn} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">E-mail</label>
              <input type="email" id="email" name="email" required placeholder="renato@arkosintelligence.com" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Senha</label>
              <input type="password" id="password" name="password" required placeholder="••••••••" />
            </div>

            <button type="submit" className={styles.loginBtn}>Entrar</button>

            <p className="text-center text-xs text-slate-500 mt-2">
              Não tem uma conta?{' '}
              <span onClick={() => setView('signup')} className="text-emerald-500 font-bold cursor-pointer hover:underline">
                Cadastre-se
              </span>
            </p>
          </form>
        ) : (
          /* FORMULÁRIO DE CADASTRO */
          <form action={signUp} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Nome Completo</label>
              <input type="text" id="name" name="name" required placeholder="Seu Nome" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email_up">E-mail</label>
              <input type="email" id="email_up" name="email" required placeholder="seu@email.com" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password_up">Senha</label>
              <input type="password" id="password_up" name="password" required placeholder="••••••••" />
            </div>

            <button type="submit" className={styles.loginBtn}>Criar Conta</button>

            <p className="text-center text-xs text-slate-500 mt-2">
              Já tem uma conta?{' '}
              <span onClick={() => setView('signin')} className="text-emerald-500 font-bold cursor-pointer hover:underline">
                Acesse aqui
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}


