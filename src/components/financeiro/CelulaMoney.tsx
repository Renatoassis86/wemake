'use client'

import { useState } from 'react'

const cellMoney: React.CSSProperties = {
  width: '100%', minWidth: '5.5rem', boxSizing: 'border-box', border: '1px solid transparent', borderRadius: 6,
  padding: '.3rem .35rem', font: 'inherit', fontVariantNumeric: 'tabular-nums', textAlign: 'right',
  background: 'transparent', color: 'inherit',
}

export function numeroOuZero(v: string) {
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Máscara de moeda enquanto digita: trata cada dígito novo como centavo entrando pela direita (ex.: "2000000" -> "20.000,00"). */
export function mascararDigitandoComoMoeda(valorDigitado: string) {
  const digitos = valorDigitado.replace(/\D/g, '')
  if (!digitos) return ''
  const centavos = parseInt(digitos, 10)
  const reais = Math.floor(centavos / 100)
  return `${reais.toLocaleString('pt-BR')},${String(centavos % 100).padStart(2, '0')}`
}

/** Input de valor monetário reutilizado em toda tabela editável do financeiro — formata em pt-BR
 *  (sem cifrão) conforme o usuário digita e só chama onSalvar quando o campo perde o foco. */
export default function CelulaMoney({ valor, aria, onSalvar, style }: {
  valor: number; aria: string; onSalvar: (novo: number) => void; style?: React.CSSProperties
}) {
  const [texto, setTexto] = useState(valor ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
  return (
    <input
      type="text" inputMode="decimal" value={texto} placeholder="0,00" style={{ ...cellMoney, ...style }} aria-label={aria}
      onChange={e => setTexto(mascararDigitandoComoMoeda(e.target.value))}
      onBlur={() => onSalvar(numeroOuZero(texto))}
    />
  )
}
