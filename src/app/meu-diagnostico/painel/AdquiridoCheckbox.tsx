'use client'

import { useState, useTransition } from 'react'
import { marcarAdquirido } from '../actions'

/** Checkbox "já comprei" por item — controle da própria escola, não mexe no parecer do staff. */
export default function AdquiridoCheckbox({ itemKey, inicial }: { itemKey: string; inicial: boolean }) {
  const [marcado, setMarcado] = useState(inicial)
  const [pending, start] = useTransition()

  return (
    <label className="pt-adquirido">
      <input
        type="checkbox"
        checked={marcado}
        disabled={pending}
        onChange={e => {
          const v = e.target.checked
          setMarcado(v)
          start(async () => {
            const r = await marcarAdquirido(itemKey, v)
            if (!r.ok) setMarcado(!v)
          })
        }}
        aria-label="Já adquirimos este item"
      />
      <span>Adquirido</span>
    </label>
  )
}
