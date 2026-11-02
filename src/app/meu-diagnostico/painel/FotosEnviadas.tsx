'use client'

import { useState } from 'react'

export interface ArquivoPortal {
  id: string
  nome: string
  mime: string | null
  tamanho: number | null
  url: string | null
}

export interface GrupoFotos {
  chave: string
  label: string
  arquivos: ArquivoPortal[]
}

const ehImagem = (mime: string | null) => !!mime && mime.startsWith('image/')

const tamanhoLegivel = (b: number | null) =>
  !b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`

export default function FotosEnviadas({ grupos }: { grupos: GrupoFotos[] }) {
  const [foto, setFoto] = useState<ArquivoPortal | null>(null)
  const comArquivo = grupos.filter(g => g.arquivos.length)
  if (!comArquivo.length) return null

  return (
    <section className="pt-sec">
      <h2>O que vocês enviaram</h2>
      <ul className="pt-evid">
        {comArquivo.map(g => (
          <li key={g.chave}>
            <b>{g.label}</b>
            <div className="pt-fotos">
              {g.arquivos.map(a => (ehImagem(a.mime) && a.url ? (
                <button key={a.id} type="button" className="pt-foto-min" onClick={() => setFoto(a)} title={a.nome}>
                  <img src={a.url} alt={a.nome} loading="lazy" />
                </button>
              ) : (
                <a key={a.id} className="pt-arq-outro" href={a.url ?? undefined} target="_blank" rel="noopener noreferrer">
                  {a.nome}<small>{tamanhoLegivel(a.tamanho)}</small>
                </a>
              )))}
            </div>
          </li>
        ))}
      </ul>

      {foto ? (
        <div className="pt-lightbox" role="dialog" aria-modal="true" aria-label={foto.nome} onClick={() => setFoto(null)}>
          <button type="button" className="pt-lightbox-x" onClick={() => setFoto(null)} aria-label="Fechar">✕</button>
          {foto.url ? <img src={foto.url} alt={foto.nome} onClick={e => e.stopPropagation()} /> : null}
          <p className="pt-lightbox-legenda" onClick={e => e.stopPropagation()}>{foto.nome}</p>
        </div>
      ) : null}
    </section>
  )
}
