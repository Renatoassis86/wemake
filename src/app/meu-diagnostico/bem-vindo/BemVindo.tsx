'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import './bemvindo.css'

export default function BemVindo({ escola }: { escola: string }) {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/meu-diagnostico/painel')
    const t = setTimeout(() => router.push('/meu-diagnostico/painel'), 3400)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="bv">
      <div className="bv-orb bv-orb-a" />
      <div className="bv-orb bv-orb-b" />
      <div className="bv-card">
        <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} className="bv-logo" style={{ objectFit: 'contain', height: 32, width: 'auto' }} />

        <span className="bv-check" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="52" height="52">
            <circle className="bv-check-circle" cx="26" cy="26" r="24" fill="none" />
            <path className="bv-check-mark" fill="none" d="M14 27l7 7 17-17" />
          </svg>
        </span>

        <p className="bv-eyebrow">Bem-vindo(a) à We Make</p>
        <h1 className="bv-escola">{escola}</h1>
        <p className="bv-sub">Seu diagnóstico do Espaço Maker está pronto.</p>

        <a href="/meu-diagnostico/painel" className="bv-btn">Ver meu diagnóstico →</a>
      </div>
    </div>
  )
}
