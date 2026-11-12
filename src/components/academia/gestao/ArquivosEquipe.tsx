'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BUCKET } from '@/lib/diagnostico'
import { confirmarUploadEquipe, pedirUploadEquipe, removerArquivoEquipe, type CategoriaArquivoEquipe } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import type { ArquivoEquipeStaff } from '@/lib/diagnostico-staff'

const tamanhoLabel = (b: number | null) => (!b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`)

/**
 * Arquivos da equipe (plantas, memoriais, pareceres da Gabi e de outros) por
 * diagnóstico — mesmo bucket e padrão de envio por URL assinada do upload da
 * escola, só a pasta muda (equipe/ em vez do id da sessão).
 */
export default function ArquivosEquipe({ id, inicial, categoria = 'arquitetura' }: { id: string; inicial: ArquivoEquipeStaff[]; categoria?: CategoriaArquivoEquipe }) {
  const [arquivos, setArquivos] = useState(inicial)
  const [enviando, setEnviando] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function enviar(lista: FileList | null) {
    if (!lista?.length) return
    setErro(null)
    const supabase = createClient()
    for (const arq of Array.from(lista)) {
      setEnviando(n => n + 1)
      try {
        const mime = arq.type || 'application/octet-stream'
        const pedido = await pedirUploadEquipe(id, { mime, tamanho: arq.size, categoria })
        if (!pedido.ok) { setErro(pedido.erro); continue }
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(pedido.path, pedido.token, arq, { contentType: mime })
        if (error) { setErro('O envio falhou. Verifique a conexão e tente de novo.'); continue }
        const conf = await confirmarUploadEquipe(id, { path: pedido.path, nome: arq.name, mime, categoria })
        if (!conf.ok || !conf.arquivo) { setErro(conf.erro ?? 'Não foi possível registrar o arquivo.'); continue }
        setArquivos(a => [{ ...conf.arquivo!, url: null }, ...a])
      } catch {
        setErro('O envio falhou. Verifique a conexão e tente de novo.')
      } finally {
        setEnviando(n => Math.max(0, n - 1))
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function apagar(fileId: string) {
    if (!confirm('Remover este arquivo?')) return
    const r = await removerArquivoEquipe(fileId)
    if (r.ok) setArquivos(a => a.filter(x => x.id !== fileId))
  }

  return (
    <div className="an-arq-equipe">
      <div className="ac-form-a">
        <input
          ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
          onChange={e => enviar(e.target.files)} aria-label="Enviar arquivo da equipe"
        />
        {enviando ? <span className="ac-hint">Enviando {enviando}…</span> : null}
      </div>
      {erro ? <p className="ac-nota" style={{ color: '#b3261e' }}>{erro}</p> : null}
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
      ) : <p className="ac-vazio">Nenhum arquivo enviado ainda.</p>}
    </div>
  )
}
