'use client'

import { useActionState, useState } from 'react'
import { entrarComPin } from './actions'

/** Campo único com máscara XXXX-XXXX (aceita colar com ou sem hífen). */
export default function PinForm() {
  const [estado, acao, pendente] = useActionState(entrarComPin, undefined)
  const [valor, setValor] = useState('')

  function formatar(bruto: string) {
    const limpo = bruto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setValor(limpo.length > 4 ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : limpo)
  }

  return (
    <form action={acao} className="dg-pin-form" autoComplete="off">
      <label htmlFor="pin">PIN de acesso</label>
      <input
        id="pin"
        name="pin"
        value={valor}
        onChange={e => formatar(e.target.value)}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="XXXX-XXXX"
        maxLength={9}
        required
        aria-describedby={estado?.erro ? 'pin-erro' : undefined}
        aria-invalid={estado?.erro ? true : undefined}
      />
      {estado?.erro ? <p id="pin-erro" role="alert" className="dg-erro">{estado.erro}</p> : null}
      <button type="submit" disabled={pendente || valor.replace('-', '').length < 8}>
        {pendente ? 'Verificando…' : 'Entrar'}
      </button>
    </form>
  )
}
