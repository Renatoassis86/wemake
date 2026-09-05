'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Botão compacto (mesmo slot do ícone verde de baixar PDF, no Funil de
// Contratação) pra escolas que não têm proposta_id (não foi gerada pela
// Calculadora) — anexa manualmente o PDF que já foi enviado à escola por
// fora da plataforma. Mesmo bucket/tabela já usados em ContratoUpload.tsx,
// só marcando categoria:'proposta' pra essa listagem achar o arquivo certo.
export function AnexarPropostaPdf({ escolaId, escolaNome }: { escolaId: string; escolaNome: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Selecione um arquivo PDF.'); return }
    if (file.size > 20 * 1024 * 1024) { alert('Arquivo muito grande. Máximo: 20 MB.'); return }

    setUploading(true)
    const supabase = createClient()

    const slugNome = escolaNome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    const path = `propostas/${escolaId}/${slugNome}_${Date.now()}.pdf`

    const { error: upErr } = await supabase.storage
      .from('documentos-oficiais')
      .upload(path, file, { upsert: false, contentType: 'application/pdf' })

    if (upErr) { alert(upErr.message); setUploading(false); return }

    const { error: dbErr } = await supabase.from('contratos_arquivos').insert({
      escola_id: escolaId,
      nome: file.name,
      path,
      tamanho: file.size,
      tipo: file.type,
      categoria: 'proposta',
    })

    if (dbErr) { alert(dbErr.message); setUploading(false); return }

    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleUpload}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Anexar PDF da proposta enviada"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 7, flexShrink: 0, border: 'none',
          background: '#eff6ff', color: '#2563eb', cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        {uploading ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
