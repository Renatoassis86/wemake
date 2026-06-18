'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Arquivo {
  name: string
  path: string
  url: string
  criado_em: string
  tamanho?: number
}

interface Props {
  registroId: string
}

export function RegistroAnexoUpload({ registroId }: Props) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [uploading, setUploading] = useState(false)
  const [tipoUpload, setTipoUpload] = useState<'proposta' | 'contraproposta'>('proposta')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [deletando, setDeletando] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const FOLDER = `registros/${registroId}`

  useEffect(() => {
    carregarArquivos()
  }, [registroId])

  async function carregarArquivos() {
    setCarregando(true)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('documentos-oficiais')
      .list(FOLDER, { sortBy: { column: 'created_at', order: 'desc' } })

    if (error) { setCarregando(false); return }

    const lista: Arquivo[] = (data ?? [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const path = `${FOLDER}/${f.name}`
        const { data: urlData } = supabase.storage.from('documentos-oficiais').getPublicUrl(path)
        return {
          name: f.name,
          path,
          url: urlData.publicUrl,
          criado_em: f.created_at ?? '',
          tamanho: f.metadata?.size,
        }
      })

    setArquivos(lista)
    setCarregando(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setErro('Arquivo muito grande. Máximo: 20 MB.'); return }

    setUploading(true); setErro(''); setOk('')
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const nomeOriginal = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40)
    const slug = `${FOLDER}/${tipoUpload}_${nomeOriginal}_${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('documentos-oficiais')
      .upload(slug, file, { upsert: false, contentType: file.type })

    if (upErr) { setErro(upErr.message); setUploading(false); return }

    setOk(`"${file.name}" enviado com sucesso!`)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    carregarArquivos()
  }

  async function handleDelete(arq: Arquivo) {
    if (!confirm(`Excluir "${arq.name}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(arq.name)
    const supabase = createClient()
    await supabase.storage.from('documentos-oficiais').remove([arq.path])
    setArquivos(prev => prev.filter(a => a.name !== arq.name))
    setDeletando(null)
  }

  function fmtSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function fmtData(iso: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  function labelTipo(name: string) {
    if (name.startsWith('proposta_')) return { label: 'Proposta', bg: '#eff6ff', cor: '#2563eb' }
    if (name.startsWith('contraproposta_')) return { label: 'Contraproposta', bg: '#fef3c7', cor: '#b45309' }
    return { label: 'Arquivo', bg: '#f8fafc', cor: '#64748b' }
  }

  function nomeExibicao(name: string) {
    return name
      .replace(/^(proposta|contraproposta)_/, '')
      .replace(/_\d{13}(\.[^.]+)$/, '$1')
      .replace(/_/g, ' ')
  }

  return (
    <div>
      {/* Seletor de tipo + botão upload */}
      <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          {(['proposta', 'contraproposta'] as const).map(t => (
            <button key={t} type="button"
              onClick={() => setTipoUpload(t)}
              style={{
                padding: '.45rem .9rem', border: 'none', cursor: 'pointer',
                background: tipoUpload === t ? '#4A7FDB' : '#f8fafc',
                color: tipoUpload === t ? '#fff' : '#475569',
                fontSize: '.75rem', fontWeight: 700,
                fontFamily: 'var(--font-montserrat,sans-serif)',
                textTransform: 'capitalize',
              }}>
              {t === 'proposta' ? 'Proposta Financeira' : 'Contraproposta'}
            </button>
          ))}
        </div>
        <button type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '.4rem',
            padding: '.45rem 1rem', borderRadius: 8,
            border: '1.5px solid #4A7FDB', background: uploading ? '#f8fafc' : '#eff6ff',
            color: '#2563eb', cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '.75rem', fontWeight: 700,
            fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          {uploading ? 'Enviando...' : `Anexar ${tipoUpload === 'proposta' ? 'Proposta' : 'Contraproposta'}`}
        </button>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
          style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
      </div>

      {erro && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.55rem .85rem', marginBottom: '.75rem', fontSize: '.78rem', color: '#dc2626' }}>
          {erro}
        </div>
      )}
      {ok && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '.55rem .85rem', marginBottom: '.75rem', fontSize: '.78rem', color: '#16a34a' }}>
          {ok}
        </div>
      )}

      {carregando ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '.78rem' }}>Carregando...</div>
      ) : arquivos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '.78rem', fontStyle: 'italic' }}>
          Nenhum arquivo anexado ainda
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
          {arquivos.map(arq => {
            const tag = labelTipo(arq.name)
            return (
              <div key={arq.name} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.7rem 1rem', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 10,
              }}>
                <span style={{
                  padding: '.2rem .55rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 800,
                  background: tag.bg, color: tag.cor,
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>{tag.label}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.8rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nomeExibicao(arq.name)}
                  </div>
                  {(arq.criado_em || arq.tamanho) && (
                    <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '.1rem' }}>
                      {fmtData(arq.criado_em)}{arq.tamanho ? ` · ${fmtSize(arq.tamanho)}` : ''}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                  <a href={arq.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                    padding: '.3rem .65rem', borderRadius: 7,
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    color: '#475569', textDecoration: 'none',
                    fontSize: '.7rem', fontWeight: 600,
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Baixar
                  </a>
                  <button type="button"
                    onClick={() => handleDelete(arq)}
                    disabled={deletando === arq.name}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 7,
                      border: '1px solid #fca5a5', background: '#fef2f2',
                      color: '#dc2626', cursor: deletando === arq.name ? 'not-allowed' : 'pointer',
                      opacity: deletando === arq.name ? .5 : 1,
                    }}
                    title="Excluir arquivo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
