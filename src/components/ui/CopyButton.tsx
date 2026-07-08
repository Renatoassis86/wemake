'use client'

import { useState } from 'react'

export function CopyButton({ text, label = 'Copiar', absolute = false }: { text: string; label?: string; absolute?: boolean }) {
  const [copiado, setCopiado] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        const value = absolute ? `${window.location.origin}${text}` : text
        navigator.clipboard.writeText(value)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 1500)
      }}
      style={{
        padding: '.4rem .8rem', borderRadius: 7,
        border: `1.5px solid ${copiado ? '#86efac' : '#e2e8f0'}`,
        background: copiado ? '#f0fdf4' : '#fff',
        color: copiado ? '#16a34a' : '#475569',
        fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
        fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
      }}
    >
      {copiado ? 'Copiado ✓' : label}
    </button>
  )
}
