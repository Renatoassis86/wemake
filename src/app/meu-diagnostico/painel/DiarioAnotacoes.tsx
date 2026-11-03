'use client'

import { useRef, useState, useTransition } from 'react'
import { adicionarAnotacao, type Anotacao } from '../actions'

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

/**
 * Diário de anotações da escola: observações informais sobre a jornada de
 * implantação e sobre os materiais, registradas ao longo do tempo — não um
 * campo único, um histórico que a We Make acompanha pra tomar decisão.
 */
export default function DiarioAnotacoes({ anotacoes }: { anotacoes: Anotacao[] }) {
  const [lista, setLista] = useState(anotacoes)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const areaRef = useRef<HTMLTextAreaElement>(null)

  function enviar() {
    const t = texto.trim()
    if (!t) { setErro('Escreva algo antes de salvar.'); return }
    setErro(null)
    start(async () => {
      const r = await adicionarAnotacao(t)
      if (!r.ok) { setErro(r.erro ?? 'Não deu para salvar. Tente de novo.'); return }
      setLista(l => [{ id: crypto.randomUUID(), texto: t, criado_em: new Date().toISOString() }, ...l])
      setTexto('')
      areaRef.current?.focus()
    })
  }

  return (
    <section className="pt-sec">
      <h2>Diário de anotações</h2>
      <p className="pt-hint">
        Registre aqui observações sobre a implantação e sobre os materiais — atrasos, dúvidas, decisões, o que for útil.
        A equipe We Make acompanha este histórico.
      </p>
      <div className="pt-diario-form">
        <textarea
          ref={areaRef}
          rows={3}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escreva uma anotação…"
          maxLength={2000}
          aria-label="Nova anotação"
        />
        <button type="button" className="pt-botao" disabled={pending} onClick={enviar}>
          {pending ? 'Salvando…' : 'Salvar anotação'}
        </button>
        {erro ? <p className="pt-erro" role="alert">{erro}</p> : null}
      </div>
      {lista.length ? (
        <ul className="pt-diario-lista">
          {lista.map(a => (
            <li key={a.id}>
              <span className="pt-diario-data">{dataHora(a.criado_em)}</span>
              <p>{a.texto}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
