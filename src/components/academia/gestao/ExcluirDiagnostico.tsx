'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { excluirDiagnostico } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'

export default function ExcluirDiagnostico({ id, escola }: { id: string; escola: string }) {
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState('')

  function excluir() {
    if (!window.confirm(`Excluir o diagnóstico de "${escola}"?\n\nAs respostas, o parecer e todos os arquivos enviados serão apagados. Isso não pode ser desfeito.`)) return
    setErro('')
    iniciar(async () => {
      const r = await excluirDiagnostico(id)
      if (!r.ok) setErro(r.erro ?? 'Não foi possível excluir.')
    })
  }

  return (
    <>
      <button type="button" onClick={excluir} disabled={pendente} className="ac-btn-sm ac-btn-excluir" title={`Excluir o diagnóstico de ${escola}`} aria-label={`Excluir o diagnóstico de ${escola}`}>
        <Trash2 size={14} aria-hidden="true" />
      </button>
      {erro ? <span role="alert" className="ac-erro-linha">{erro}</span> : null}
    </>
  )
}
