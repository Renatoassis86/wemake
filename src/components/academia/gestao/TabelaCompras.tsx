'use client'

import { useCallback, useRef, useState } from 'react'
import type { Recurso, Respostas } from '@/lib/diagnostico'
import { salvarCompras } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'

/**
 * Comparação de compras por item (onde comprar, preço, link) — a camada por
 * escola que falta no catálogo (academia_diag_itens tem um link de
 * referência só, igual pra toda escola). "Melhor opção" é o que aparece em
 * destaque pra escola no Portal do Diagnóstico (/meu-diagnostico); os
 * outros campos ficam de apoio, pra comparação.
 */
export default function TabelaCompras({ id, anchorId, titulo, itens, inicial }: { id: string; anchorId: string; titulo: string; itens: Recurso[]; inicial: Respostas }) {
  const [c, setC] = useState<Respostas>(inicial)
  const [salvo, setSalvo] = useState<'ok' | 'salvando' | 'erro'>('ok')
  const sujo = useRef<Respostas>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const descarregar = useCallback(async () => {
    const patch = sujo.current
    if (!Object.keys(patch).length) return
    sujo.current = {}
    setSalvo('salvando')
    const r = await salvarCompras(id, patch)
    if (r.ok) setSalvo('ok')
    else { sujo.current = { ...patch, ...sujo.current }; setSalvo('erro'); timer.current = setTimeout(descarregar, 6000) }
  }, [id])

  const set = (k: string, v: string) => {
    setC(a => ({ ...a, [k]: v }))
    sujo.current[k] = v
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(descarregar, 900)
  }

  const formatarPreco = (k: string) => {
    const v = c[k]
    if (!v) return
    const n = Number(v.replace(',', '.'))
    if (Number.isNaN(n)) return
    set(k, n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const campoPreco = (k: string, label: string) => (
    <input
      className="ac-cell-in an-num" inputMode="decimal" placeholder="0,00"
      value={c[k] ?? ''} onChange={e => set(k, e.target.value)} onBlur={() => formatarPreco(k)}
      aria-label={label}
    />
  )

  const campoLink = (k: string, label: string) => {
    const v = c[k] ?? ''
    const trim = v.trim()
    /* O campo aceita link colado sem "http(s)://" na frente — sem isso o navegador
     * trata como caminho relativo do próprio site e o ícone "abrir" não sai daqui. */
    const href = trim && !/^https?:\/\//i.test(trim) ? `https://${trim}` : trim
    return (
      <div className="an-link-cell">
        <input className="ac-cell-in is-link" value={v} onChange={e => set(k, e.target.value)} placeholder="https://…" aria-label={label} spellCheck={false} />
        {trim ? <a className="an-link-open" href={href} target="_blank" rel="noopener noreferrer" title="Abrir link para conferir" aria-label={`Abrir ${label}`}>↗</a> : null}
      </div>
    )
  }

  return (
    <section id={anchorId} className="an-sec">
      <h3 className="ac-h3">{titulo} <small>onde comprar · We Make preenche</small></h3>
      <span className="an-salvo" data-e={salvo} style={{ display: 'block', marginBottom: '.5rem' }}>
        {salvo === 'salvando' ? 'Salvando…' : salvo === 'erro' ? 'Erro ao salvar. Tentando de novo.' : 'Salvo'}
      </span>
      <div className="ac-table-wrap is-wide" tabIndex={0} role="region" aria-label={titulo}>
        <table className="ac-table an-rec an-rec-compras">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Situação</th>
              <th scope="col">Melhor opção (loja)</th>
              <th scope="col">Preço</th>
              <th scope="col">Link (comprar)</th>
              <th scope="col">Mercado Livre: preço</th>
              <th scope="col">Mercado Livre: link</th>
              <th scope="col">Amazon: preço</th>
              <th scope="col">Amazon: link</th>
              <th scope="col">Link original</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(i => (
              <tr key={i.key}>
                <td><b>{i.item}</b><span className="an-spec">{i.spec}</span></td>
                <td><input className="ac-cell-in" value={c[i.key + '.situacao'] ?? ''} onChange={e => set(i.key + '.situacao', e.target.value)} aria-label={`Situação: ${i.item}`} /></td>
                <td><input className="ac-cell-in" value={c[i.key + '.melhor_loja'] ?? ''} onChange={e => set(i.key + '.melhor_loja', e.target.value)} aria-label={`Melhor opção: ${i.item}`} /></td>
                <td>{campoPreco(i.key + '.melhor_preco', `Preço: ${i.item}`)}</td>
                <td>{campoLink(i.key + '.melhor_link', `Link: ${i.item}`)}</td>
                <td>{campoPreco(i.key + '.ml_preco', `Mercado Livre preço: ${i.item}`)}</td>
                <td>{campoLink(i.key + '.ml_link', `Mercado Livre link: ${i.item}`)}</td>
                <td>{campoPreco(i.key + '.amazon_preco', `Amazon preço: ${i.item}`)}</td>
                <td>{campoLink(i.key + '.amazon_link', `Amazon link: ${i.item}`)}</td>
                <td>{campoLink(i.key + '.link_original_url', `Link original: ${i.item}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
