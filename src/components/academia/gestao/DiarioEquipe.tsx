'use client'

import { useRef, useState, useTransition } from 'react'
import { adicionarAnotacaoEquipe } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import type { AnotacaoStaff } from '@/lib/diagnostico-staff'

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

/**
 * Diário de anotações, lado equipe: mostra o que a escola escreveu e o que a
 * equipe (Gabi e outros) escreveu, no mesmo histórico — mas só a equipe escreve
 * aqui; a escola nunca vê as entradas da equipe no portal dela (filtro no
 * meu-diagnostico/painel/page.tsx).
 */
export default function DiarioEquipe({ id, anotacoes, semSecao }: { id: string; anotacoes: AnotacaoStaff[]; semSecao?: boolean }) {
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
      const r = await adicionarAnotacaoEquipe(id, t)
      if (!r.ok) { setErro(r.erro ?? 'Não deu para salvar. Tente de novo.'); return }
      setLista(l => [{ id: crypto.randomUUID(), texto: t, criado_em: new Date().toISOString(), autor: 'equipe' }, ...l])
      setTexto('')
      areaRef.current?.focus()
    })
  }

  const corpo = (
    <>
      <div className="an-diario-form">
        <textarea
          ref={areaRef}
          rows={3}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escreva uma anotação (visível só pra equipe, não aparece no portal da escola)…"
          maxLength={2000}
          aria-label="Nova anotação da equipe"
          className="ac-cell-in"
        />
        <button type="button" className="ac-btn-sm" disabled={pending} onClick={enviar}>
          {pending ? 'Salvando…' : 'Salvar anotação'}
        </button>
        {erro ? <p className="ac-nota" style={{ color: '#b3261e' }}>{erro}</p> : null}
      </div>
      {lista.length ? (
        <ul className="an-diario-lista">
          {lista.map(a => (
            <li key={a.id}>
              <span className="an-diario-data">
                {dataHora(a.criado_em)} <em className="an-diario-autor" data-a={a.autor}>{a.autor === 'equipe' ? 'Equipe We Make' : 'Escola'}</em>
              </span>
              <p>{a.texto}</p>
            </li>
          ))}
        </ul>
      ) : <p className="ac-vazio">Nenhuma anotação ainda.</p>}
    </>
  )

  if (semSecao) return corpo
  return (
    <section id="an-diario" className="an-sec">
      <h3 className="ac-h3">Diário de anotações <small>escola e equipe We Make</small></h3>
      {corpo}
    </section>
  )
}
