'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  escolaId: string
  escolaNome: string
  arquivosExistentes: { id: string; nome: string; url: string; criado_em: string; tamanho?: number }[]
}

export function ContratoUpload({ escolaId, escolaNome, arquivosExistentes }: Props) {
  const [arquivos, setArquivos] = useState(arquivosExistentes)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [deletando, setDeletando] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const slugNome = escolaNome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setErro('Arquivo muito grande. Máximo: 20 MB.'); return }

    setUploading(true); setErro(''); setOk('')
    const supabase = createClient()

    const ext  = file.name.split('.').pop()
    const slug = `contratos/${escolaId}/${slugNome}_${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('documentos-oficiais')
      .upload(slug, file, { upsert: false, contentType: file.type })

    if (upErr) { setErro(upErr.message); setUploading(false); return }

    // Registrar na tabela contratos_arquivos
    const { data: doc, error: dbErr } = await supabase
      .from('contratos_arquivos')
      .insert({
        escola_id: escolaId,
        nome:      file.name,
        path:      slug,
        tamanho:   file.size,
        tipo:      file.type,
      })
      .select('id, nome, path, created_at, tamanho')
      .single()

    if (dbErr) { setErro(dbErr.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documentos-oficiais').getPublicUrl(slug)

    setArquivos(prev => [{
      id:         doc.id,
      nome:       doc.nome,
      url:        urlData.publicUrl,
      criado_em:  doc.created_at,
      tamanho:    doc.tamanho,
    }, ...prev])

    setOk(`"${file.name}" enviado com sucesso!`)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(arq: { id: string; nome: string; url: string; criado_em: string; tamanho?: number }) {
    if (!confirm(`Excluir "${arq.nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(arq.id)
    const supabase = createClient()

    // Buscar path do documento
    const { data: doc } = await supabase
      .from('documentos_oficiais')
      .select('path')
      .eq('id', arq.id)
      .single()

    if (doc?.path) {
      await supabase.storage.from('documentos-oficiais').remove([doc.path])
    }
    await supabase.from('contratos_arquivos').delete().eq('id', arq.id)

    setArquivos(prev => prev.filter(a => a.id !== arq.id))
    setDeletando(null)
  }

  function fmtSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function fmtData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  function iconeArquivo(nome: string) {
    const ext = nome.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
      </svg>
    )
    if (['doc','docx'].includes(ext ?? '')) return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    )
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  }

  return (
    <div>
      {/* Área de upload */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed #e2e8f0', borderRadius: 12,
          padding: '1.75rem 1.5rem', textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: uploading ? '#f8fafc' : '#fafafa',
          transition: 'all .15s',
          marginBottom: '1rem',
        }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#d97706' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={handleUpload}
          disabled={uploading}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.65rem' }}>
          {uploading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: '.82rem', fontWeight: 600, color: uploading ? '#d97706' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>
          {uploading ? 'Enviando arquivo...' : 'Clique para selecionar o arquivo'}
        </div>
        <div style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
          PDF, DOC, DOCX, PNG, JPG — máximo 20 MB
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.6rem .9rem', marginBottom: '.75rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>
          {erro}
        </div>
      )}
      {ok && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '.6rem .9rem', marginBottom: '.75rem', fontSize: '.78rem', color: '#16a34a', fontFamily: 'var(--font-inter,sans-serif)' }}>
          {ok}
        </div>
      )}

      {/* Lista de arquivos */}
      {arquivos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {arquivos.map(arq => (
            <div key={arq.id} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.75rem 1rem', background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: 10,
              transition: 'all .15s',
            }}>
              <div style={{ flexShrink: 0 }}>{iconeArquivo(arq.nome)}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {arq.nome}
                </div>
                <div style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                  {fmtData(arq.criado_em)}{arq.tamanho ? ` · ${fmtSize(arq.tamanho)}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                <a href={arq.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                  padding: '.35rem .75rem', borderRadius: 7,
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  color: '#475569', textDecoration: 'none',
                  fontSize: '.72rem', fontWeight: 600,
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Baixar
                </a>
                <button
                  onClick={() => handleDelete(arq)}
                  disabled={deletando === arq.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 7,
                    border: '1px solid #fca5a5', background: '#fef2f2',
                    color: '#dc2626', cursor: deletando === arq.id ? 'not-allowed' : 'pointer',
                    opacity: deletando === arq.id ? .5 : 1,
                  }}
                  title="Excluir arquivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
          Nenhum arquivo enviado ainda para esta escola
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
