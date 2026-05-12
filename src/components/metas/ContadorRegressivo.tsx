'use client'

import { useState, useEffect } from 'react'

const PRAZO = new Date('2026-08-31T23:59:59')

function calcular() {
  const agora = new Date()
  const diff  = Math.max(0, PRAZO.getTime() - agora.getTime())
  return {
    dias:     Math.floor(diff / 86400000),
    horas:    Math.floor((diff % 86400000) / 3600000),
    minutos:  Math.floor((diff % 3600000)  / 60000),
    segundos: Math.floor((diff % 60000)    / 1000),
    encerrado: diff <= 0,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function ContadorRegressivo() {
  const [tempo, setTempo] = useState(calcular())

  useEffect(() => {
    const id = setInterval(() => setTempo(calcular()), 1000)
    return () => clearInterval(id)
  }, [])

  if (tempo.encerrado) {
    return (
      <div style={{
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 12, padding: '1rem 1.25rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#16a34a', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
          Prazo Encerrado
        </div>
        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
          Agosto 2026
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
      borderRadius: 12, padding: '1rem 1.1rem',
    }}>
      {/* Label */}
      <div style={{
        fontSize: '.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
        color: '#d97706', marginBottom: '.65rem', textAlign: 'center',
        fontFamily: 'var(--font-montserrat,sans-serif)',
      }}>
        ✦ Prazo — Agosto 2026
      </div>

      {/* Dígitos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.35rem' }}>
        {[
          { val: tempo.dias,     label: 'dias'  },
          { val: tempo.horas,    label: 'horas' },
          { val: tempo.minutos,  label: 'min'   },
          { val: tempo.segundos, label: 'seg'   },
        ].map(({ val, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(217,119,6,.25)', border: '1px solid rgba(217,119,6,.35)',
              borderRadius: 8, padding: '.4rem .2rem',
              fontFamily: 'var(--font-cormorant,serif)',
              fontSize: label === 'dias' ? '1.5rem' : '1.25rem',
              fontWeight: 800, lineHeight: 1, color: '#fbbf24',
              letterSpacing: '.02em',
            }}>
              {pad(val)}
            </div>
            <div style={{
              fontSize: '.52rem', color: 'rgba(255,255,255,.35)',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
              marginTop: '.2rem',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progresso do período */}
      <div style={{ marginTop: '.75rem' }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
          {(() => {
            const inicio = new Date('2026-01-01').getTime()
            const fim    = PRAZO.getTime()
            const total  = fim - inicio
            const passado = Math.max(0, Date.now() - inicio)
            const pct    = Math.min(100, Math.round((passado / total) * 100))
            return (
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #d97706, #f59e0b)', borderRadius: 3 }} />
            )
          })()}
        </div>
        <div style={{ fontSize: '.52rem', color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.3rem', textAlign: 'right' }}>
          31/08/2026
        </div>
      </div>
    </div>
  )
}
