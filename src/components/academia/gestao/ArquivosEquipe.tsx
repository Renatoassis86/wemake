'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BUCKET } from '@/lib/diagnostico'
import { confirmarUploadEquipe, pedirUploadEquipe, removerArquivoEquipe, type CategoriaArquivoEquipe } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import type { ArquivoEquipeStaff } from '@/lib/diagnostico-staff'

const tamanhoLabel = (b: number | null) => (!b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`)

/**
 * Documentos da equipe (plantas, memoriais, pareceres da Gabi e de outros) por
 * diagnóstico — cada envio pede um título antes do arquivo, pra listar pelo que
 * o documento é (ex.: "Planta baixa — térreo"), não pelo nome cru do arquivo.
 * Mesmo bucket e padrão de URL assinada do upload da escola, só a pasta muda
 * (equipe/<categoria>/ em vez do id da sessão).
 */
export default function ArquivosEquipe({ id, inicial, categoria = 'arquitetura' }: { id: string; inicial: ArquivoEquipeStaff[]; categoria?: CategoriaArquivoEquipe }) {
  const [arquivos, setArquivos] = useState(inicial)
  const [formAberto, setFormAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function fechar() {
    setFormAberto(false)
    setTitulo('')
    setErro(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function anexar() {
    const nome = titulo.trim()
    const arq = inputRef.current?.files?.[0]
    if (!nome) { setErro('Dê um título ao documento antes de anexar.'); return }
    if (!arq) { setErro('Escolha o arquivo.'); return }

    setErro(null)
    setEnviando(true)
    try {
      const supabase = createClient()
      const mime = arq.type || 'application/octet-stream'
      const pedido = await pedirUploadEquipe(id, { mime, tamanho: arq.size, categoria })
      if (!pedido.ok) { setErro(pedido.erro); return }
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(pedido.path, pedido.token, arq, { contentType: mime })
      if (error) { setErro('O envio falhou. Verifique a conexão e tente de novo.'); return }
      const conf = await confirmarUploadEquipe(id, { path: pedido.path, nome, mime, categoria })
      if (!conf.ok || !conf.arquivo) { setErro(conf.erro ?? 'Não foi possível registrar o documento.'); return }
      setArquivos(a => [{ ...conf.arquivo!, url: null }, ...a])
      fechar()
    } catch {
      setErro('O envio falhou. Verifique a conexão e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  async function apagar(fileId: string) {
    if (!confirm('Remover este documento?')) return
    const r = await removerArquivoEquipe(fileId)
    if (r.ok) setArquivos(a => a.filter(x => x.id !== fileId))
  }

  return (
    <div className="an-arq-equipe">
      {arquivos.length ? (
        <ul className="an-arq-equipe-lista">
          {arquivos.map(a => (
            <li key={a.id}>
              {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a> : <span>{a.nome}</span>}
              <small>{tamanhoLabel(a.tamanho)}{a.enviado_por ? ` · ${a.enviado_por}` : ''}</small>
              <button type="button" className="ac-btn-excluir" onClick={() => apagar(a.id)} aria-label={`Remover ${a.nome}`}>✕</button>
            </li>
          ))}
        </ul>
      ) : <p className="ac-vazio">Nenhum documento enviado ainda.</p>}

      {formAberto ? (
        <div className="an-arq-novo">
          <input
            type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Título do documento (ex.: Planta baixa — térreo)"
            aria-label="Título do documento" autoFocus
          />
          <input
            ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
            aria-label="Escolher o arquivo do documento"
          />
          <div className="an-arq-novo-acoes">
            <button type="button" className="ac-btn-sm" disabled={enviando} onClick={anexar}>{enviando ? 'Enviando…' : 'Anexar'}</button>
            <button type="button" className="ac-btn-sm is-ghost" disabled={enviando} onClick={fechar}>Cancelar</button>
          </div>
          {erro ? <p className="ac-nota" style={{ color: '#b3261e', margin: '.4rem 0 0' }}>{erro}</p> : null}
        </div>
      ) : (
        <button type="button" className="ac-btn-sm" onClick={() => setFormAberto(true)}>+ Adicionar documento</button>
      )}
    </div>
  )
}
