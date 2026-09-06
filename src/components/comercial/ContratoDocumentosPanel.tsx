'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { adicionarNotaContrato } from '@/lib/actions'

interface Arquivo { id: string; nome: string; url: string; criadoEm: string; categoria: string }
interface Nota { texto: string; autor: string; criadoEm: string }

const CATEGORIAS = [
  { key: 'minuta', label: 'Minuta', cor: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'contrato_final', label: 'Versão final p/ assinatura', cor: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'contrato_assinado', label: 'Assinado por ambas as partes', cor: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
] as const

function tempoRelativo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

// Painel completo de Minuta/Contrato no Funil de Contratação: anexa novas
// versões por fase (minuta → versão final → assinado) sem nunca sobrescrever
// a anterior (cada upload é uma linha nova em contratos_arquivos), e reúne
// os comentários sobre o andamento da negociação — mesmo padrão visual dos
// outros popovers da tabela (AnotacaoContatoInline/PrioridadeInline), só
// maior por ter mais conteúdo.
export function ContratoDocumentosPanel({ escolaId, escolaNome, arquivos: arquivosIniciais, notas: notasIniciais }: {
  escolaId: string; escolaNome: string; arquivos: Arquivo[]; notas: Nota[]
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [texto, setTexto] = useState('')
  const [uploadingCat, setUploadingCat] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function abrir() {
    const rect = gatilhoRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 380)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 460)
      setPos({ top: Math.max(8, top), left: Math.max(8, left) })
    }
    setAberto(true)
  }

  useEffect(() => {
    if (!aberto) return
    function handleClick(e: MouseEvent) {
      if (
        painelRef.current && !painelRef.current.contains(e.target as Node) &&
        gatilhoRef.current && !gatilhoRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aberto])

  async function handleUpload(categoria: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.type.includes('word')) {
      alert('Selecione um PDF ou documento Word.')
      return
    }
    if (file.size > 20 * 1024 * 1024) { alert('Arquivo muito grande. Máximo: 20 MB.'); return }

    setUploadingCat(categoria)
    const supabase = createClient()
    const slugNome = escolaNome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    const ext = file.name.split('.').pop()
    const path = `contratos/${escolaId}/${categoria}_${slugNome}_${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('documentos-oficiais')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (upErr) { alert(upErr.message); setUploadingCat(null); return }

    const { error: dbErr } = await supabase.from('contratos_arquivos').insert({
      escola_id: escolaId, nome: file.name, path, tamanho: file.size, tipo: file.type, categoria,
    })

    if (dbErr) { alert(dbErr.message); setUploadingCat(null); return }

    const input = inputRefs.current[categoria]
    if (input) input.value = ''
    router.refresh()
    setUploadingCat(null)
  }

  function salvarComentario() {
    if (!texto.trim()) return
    startTransition(async () => {
      const res = await adicionarNotaContrato(escolaId, texto)
      if (res.success) { setTexto(''); router.refresh() }
    })
  }

  const totalItens = arquivosIniciais.length + notasIniciais.length

  return (
    <>
      <button
        ref={gatilhoRef}
        onClick={abrir}
        title="Minuta e contrato — anexos e negociação"
        style={{
          position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
          border: `1.5px solid ${totalItens ? '#7c3aed' : '#c4b5fd'}`, background: totalItens ? '#6d28d9' : '#f5f3ff',
          color: totalItens ? '#fff' : '#6d28d9', boxShadow: totalItens ? '0 0 0 3px rgba(109,40,217,.15)' : 'none',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
        {totalItens > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 99,
            background: '#f59e0b', color: '#fff', fontSize: '.58rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            fontFamily: 'var(--font-montserrat,sans-serif)', border: '1.5px solid #fff',
          }}>
            {totalItens}
          </span>
        )}
      </button>

      {aberto && pos && (
        <div ref={painelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 2000,
          width: 380, maxHeight: 480, overflowY: 'auto', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,23,42,.18)', padding: '1rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.15rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Minuta e Contrato
          </div>
          <div style={{ fontSize: '.7rem', color: '#94a3b8', marginBottom: '.75rem' }}>{escolaNome}</div>

          {/* ── Upload por fase ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '.9rem' }}>
            {CATEGORIAS.map(cat => (
              <div key={cat.key}>
                <input
                  ref={el => { inputRefs.current[cat.key] = el }}
                  type="file"
                  accept="application/pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={e => handleUpload(cat.key, e)}
                  disabled={uploadingCat === cat.key}
                />
                <button
                  type="button"
                  onClick={() => inputRefs.current[cat.key]?.click()}
                  disabled={!!uploadingCat}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.5rem .65rem', borderRadius: 8, border: `1.5px solid ${cat.border}`,
                    background: cat.bg, color: cat.cor, cursor: uploadingCat ? 'wait' : 'pointer',
                    fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}
                >
                  <span>Anexar {cat.label}</span>
                  {uploadingCat === cat.key ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* ── Lista de versões já enviadas ────────────────── */}
          {arquivosIniciais.length > 0 && (
            <div style={{ marginBottom: '.9rem' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94a3b8', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Versões enviadas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {arquivosIniciais.map(a => {
                  const cat = CATEGORIAS.find(c => c.key === a.categoria)
                  return (
                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem',
                      padding: '.4rem .55rem', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9',
                      textDecoration: 'none',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '.68rem', fontWeight: 700, color: cat?.cor ?? '#334155' }}>{cat?.label ?? a.categoria}</div>
                        <div style={{ fontSize: '.66rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                      </div>
                      <span style={{ fontSize: '.6rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{tempoRelativo(a.criadoEm)}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Comentários da negociação ────────────────────── */}
          <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94a3b8', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Comentários da negociação
          </div>
          {notasIniciais.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 130, overflowY: 'auto', marginBottom: '.6rem' }}>
              {notasIniciais.map((n, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '.5rem .6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.15rem' }}>
                    <span style={{ fontSize: '.64rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n.autor}</span>
                    <span style={{ fontSize: '.58rem', color: '#94a3b8' }}>{tempoRelativo(n.criadoEm)}</span>
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#334155', lineHeight: 1.4 }}>{n.texto}</div>
                </div>
              ))}
            </div>
          )}
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Como está o andamento da negociação do contrato?"
            rows={3}
            style={{ width: '100%', padding: '.5rem .6rem', fontSize: '.76rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box', resize: 'vertical', marginBottom: '.5rem', fontFamily: 'var(--font-inter,sans-serif)' }}
          />
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={salvarComentario} disabled={pending || !texto.trim()} style={{
              flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#6d28d9', color: '#fff', fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
              opacity: !texto.trim() ? .6 : 1,
            }}>
              {pending ? 'Salvando...' : 'Adicionar comentário'}
            </button>
            <button onClick={() => setAberto(false)} style={{
              padding: '.5rem .75rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Fechar
            </button>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  )
}
