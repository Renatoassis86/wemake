'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { salvarTranscricao, deletarTranscricao } from './transcricao-actions'

interface Escola { id: string; nome: string; cidade: string | null; estado: string | null }

interface Transcricao {
  id: string
  escola_id: string
  data_reuniao: string
  titulo: string | null
  participantes: string | null
  plataforma: string
  transcricao: string | null
  arquivo_transcricao_nome: string | null
  arquivo_transcricao_path: string | null
  arquivo_transcricao_size: number | null
  arquivo_midia_nome: string | null
  arquivo_midia_path: string | null
  arquivo_midia_size: number | null
  arquivo_midia_tipo: string | null
  created_at: string
  escola?: { nome: string } | null
  criador?: { full_name: string } | null
}

interface Props {
  escolas: Escola[]
  transcricoes: Transcricao[]
  userId: string
}

const PLATAFORMAS = [
  { value: 'meet',        label: 'Google Meet',     cor: '#0d9488' },
  { value: 'zoom',        label: 'Zoom',            cor: '#2563eb' },
  { value: 'teams',       label: 'Microsoft Teams', cor: '#7c3aed' },
  { value: 'presencial',  label: 'Presencial',      cor: '#d97706' },
  { value: 'outro',       label: 'Outro',           cor: '#64748b' },
]

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtData(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function PlataformaIcon({ plat }: { plat: string }) {
  const icons: Record<string, React.ReactNode> = {
    meet: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    zoom: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    teams: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    presencial: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    outro: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }
  return <>{icons[plat] ?? icons.outro}</>
}

export function TranscricaoForm({ escolas, transcricoes: inicial, userId }: Props) {
  const [mostrarForm,   setMostrarForm]   = useState(false)
  const [transcricoes,  setTranscricoes]  = useState<Transcricao[]>(inicial)
  const [saving,        setSaving]        = useState(false)
  const [erro,          setErro]          = useState('')
  const [ok,            setOk]            = useState('')
  const [expandido,     setExpandido]     = useState<string | null>(null)

  // Form state
  const [escolaId,      setEscolaId]      = useState('')
  const [dataReuniao,   setDataReuniao]   = useState('')
  const [titulo,        setTitulo]        = useState('')
  const [participantes, setParticipantes] = useState('')
  const [plataforma,    setPlataforma]    = useState('meet')
  const [transcricao,   setTranscricao]   = useState('')

  // Upload refs
  const refTranscricao = useRef<HTMLInputElement>(null)
  const refMidia       = useRef<HTMLInputElement>(null)
  const [arqTranscricao, setArqTranscricao] = useState<File | null>(null)
  const [arqMidia,       setArqMidia]       = useState<File | null>(null)
  const [uploadando,     setUploadando]     = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  function resetForm() {
    setEscolaId(''); setDataReuniao(''); setTitulo('')
    setParticipantes(''); setPlataforma('meet'); setTranscricao('')
    setArqTranscricao(null); setArqMidia(null)
    if (refTranscricao.current) refTranscricao.current.value = ''
    if (refMidia.current) refMidia.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!escolaId || !dataReuniao) { setErro('Escola e data são obrigatórios'); return }
    setSaving(true); setErro(''); setOk('')

    const fd = new FormData()
    fd.set('escola_id', escolaId)
    fd.set('data_reuniao', dataReuniao)
    fd.set('titulo', titulo)
    fd.set('participantes', participantes)
    fd.set('plataforma', plataforma)
    fd.set('transcricao', transcricao)

    const result = await salvarTranscricao(fd)
    if (!result.success) { setErro(result.error ?? 'Erro ao salvar'); setSaving(false); return }

    // Upload arquivos se houver
    if (result.id && (arqTranscricao || arqMidia)) {
      setUploadando(true)
      const supabase = createClient()
      const updates: Record<string, string | number> = {}

      if (arqTranscricao) {
        const path = `transcricoes/${result.id}/transcricao_${Date.now()}.${arqTranscricao.name.split('.').pop()}`
        await supabase.storage.from('documentos-oficiais').upload(path, arqTranscricao)
        updates.arquivo_transcricao_path = path
        updates.arquivo_transcricao_nome = arqTranscricao.name
        updates.arquivo_transcricao_size = arqTranscricao.size
      }

      if (arqMidia) {
        const path = `transcricoes/${result.id}/midia_${Date.now()}.${arqMidia.name.split('.').pop()}`
        await supabase.storage.from('documentos-oficiais').upload(path, arqMidia)
        updates.arquivo_midia_path = path
        updates.arquivo_midia_nome = arqMidia.name
        updates.arquivo_midia_size = arqMidia.size
        updates.arquivo_midia_tipo = arqMidia.type.startsWith('audio') ? 'audio' : 'video'
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('transcricoes_reunioes').update(updates).eq('id', result.id)
      }
      setUploadando(false)
    }

    setOk('Transcrição salva com sucesso!')
    setSaving(false)
    setMostrarForm(false)
    resetForm()
    window.location.reload()
  }

  async function handleDeletar(id: string) {
    if (!confirm('Excluir esta transcrição?')) return
    await deletarTranscricao(id)
    setTranscricoes(prev => prev.filter(t => t.id !== id))
  }

  const platAtual = PLATAFORMAS.find(p => p.value === plataforma)

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '.68rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.06em',
    color: '#64748b', marginBottom: '.35rem',
    fontFamily: 'var(--font-montserrat,sans-serif)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '.7rem .9rem', fontSize: '.875rem',
    fontFamily: 'var(--font-inter,sans-serif)',
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    background: '#f8fafc', color: '#0f172a', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div>
      {/* ── Header + botão novo ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {transcricoes.length} transcrição{transcricoes.length !== 1 ? 'ões' : ''} registrada{transcricoes.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '.75rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
            Histórico completo de reuniões com escolas parceiras
          </div>
        </div>
        <button onClick={() => { setMostrarForm(true); setErro(''); setOk('') }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          padding: '.55rem 1.25rem', borderRadius: 9999, border: 'none',
          background: 'linear-gradient(135deg, #d97706, #b45309)',
          color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
          fontFamily: 'var(--font-montserrat,sans-serif)',
          boxShadow: '0 4px 14px rgba(217,119,6,.35)',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Transcrição
        </button>
      </div>

      {ok && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.82rem', color: '#16a34a', fontFamily: 'var(--font-inter,sans-serif)' }}>
          {ok}
        </div>
      )}

      {/* ── Modal de formulário ─────────────────────────── */}
      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setMostrarForm(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,.18)',
          }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '1.25rem 1.5rem', borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#d97706', marginBottom: '.2rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  ✦ Nova Transcrição
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                  Registrar Reunião
                </div>
              </div>
              <button onClick={() => setMostrarForm(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Escola + Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Escola *</label>
                  <select value={escolaId} onChange={e => setEscolaId(e.target.value)} required style={{ ...inp, background: '#fff' }}>
                    <option value="">Selecione a escola...</option>
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}{e.cidade ? ` — ${e.cidade}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Data da Reunião *</label>
                  <input type="date" value={dataReuniao} onChange={e => setDataReuniao(e.target.value)} required style={inp} />
                </div>
              </div>

              {/* Título + Plataforma */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Título da Reunião</label>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Apresentação Parceria Educacional" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Plataforma</label>
                  <select value={plataforma} onChange={e => setPlataforma(e.target.value)} style={{ ...inp, background: '#fff' }}>
                    {PLATAFORMAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Participantes */}
              <div>
                <label style={lbl}>Participantes</label>
                <input value={participantes} onChange={e => setParticipantes(e.target.value)}
                  placeholder="Ex: João Silva (diretor), Maria Costa (coordenadora), Renato Assis (We Make)"
                  style={inp} />
              </div>

              {/* Transcrição em texto */}
              <div>
                <label style={lbl}>Transcrição da Reunião (texto)</label>
                <textarea value={transcricao} onChange={e => setTranscricao(e.target.value)}
                  rows={6}
                  placeholder="Cole aqui a transcrição gerada pelo Google Meet, Zoom ou outra ferramenta..."
                  style={{ ...inp, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} />
                <div style={{ fontSize: '.65rem', color: '#94a3b8', marginTop: '.3rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Dica: No Google Meet, acesse a reunião → Menu ⋮ → "Transcrição" para copiar o texto.
                </div>
              </div>

              {/* Upload arquivos */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#475569', marginBottom: '.85rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Arquivos (opcional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* Arquivo de transcrição */}
                  <div>
                    <label style={{ ...lbl, color: '#0d9488' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '.3rem' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Arquivo de Transcrição
                    </label>
                    <div
                      onClick={() => refTranscricao.current?.click()}
                      style={{
                        border: `2px dashed ${arqTranscricao ? '#0d9488' : '#e2e8f0'}`,
                        borderRadius: 8, padding: '.85rem',
                        textAlign: 'center', cursor: 'pointer',
                        background: arqTranscricao ? '#f0fdfa' : '#fff',
                        transition: 'all .15s',
                      }}
                    >
                      <input ref={refTranscricao} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
                        onChange={e => setArqTranscricao(e.target.files?.[0] ?? null)} />
                      {arqTranscricao ? (
                        <div>
                          <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#0d9488', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{arqTranscricao.name.slice(0, 28)}</div>
                          <div style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmtSize(arqTranscricao.size)}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>PDF, DOC, TXT</div>
                          <div style={{ fontSize: '.65rem', color: '#cbd5e1', fontFamily: 'var(--font-inter,sans-serif)' }}>Clique para selecionar</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arquivo de mídia */}
                  <div>
                    <label style={{ ...lbl, color: '#7c3aed' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '.3rem' }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                      Áudio ou Vídeo da Reunião
                    </label>
                    <div
                      onClick={() => refMidia.current?.click()}
                      style={{
                        border: `2px dashed ${arqMidia ? '#7c3aed' : '#e2e8f0'}`,
                        borderRadius: 8, padding: '.85rem',
                        textAlign: 'center', cursor: 'pointer',
                        background: arqMidia ? '#f5f3ff' : '#fff',
                        transition: 'all .15s',
                      }}
                    >
                      <input ref={refMidia} type="file" accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm" style={{ display: 'none' }}
                        onChange={e => setArqMidia(e.target.files?.[0] ?? null)} />
                      {arqMidia ? (
                        <div>
                          <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#7c3aed', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{arqMidia.name.slice(0, 28)}</div>
                          <div style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmtSize(arqMidia.size)}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>MP3, MP4, WAV, M4A</div>
                          <div style={{ fontSize: '.65rem', color: '#cbd5e1', fontFamily: 'var(--font-inter,sans-serif)' }}>Clique para selecionar</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {erro && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.6rem .9rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  {erro}
                </div>
              )}

              <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
                <button type="submit" disabled={saving || uploadando} style={{
                  flex: 1, padding: '.75rem', borderRadius: 9999, border: 'none',
                  background: (saving || uploadando) ? '#e2e8f0' : 'linear-gradient(135deg, #d97706, #b45309)',
                  color: (saving || uploadando) ? '#94a3b8' : '#fff',
                  fontWeight: 700, fontSize: '.875rem', cursor: (saving || uploadando) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  boxShadow: (saving || uploadando) ? 'none' : '0 4px 14px rgba(217,119,6,.35)',
                }}>
                  {uploadando ? 'Enviando arquivos...' : saving ? 'Salvando...' : 'Salvar Transcrição'}
                </button>
                <button type="button" onClick={() => setMostrarForm(false)} style={{
                  padding: '.75rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '.875rem',
                  cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lista de transcrições ───────────────────────── */}
      {transcricoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', color: '#0f172a', marginBottom: '.4rem' }}>Nenhuma transcrição registrada</div>
          <div style={{ fontSize: '.82rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', maxWidth: 420, margin: '0 auto .85rem' }}>
            Após cada reunião, registre aqui a transcrição e o áudio/vídeo para manter o histórico completo da negociação.
          </div>
          <button onClick={() => setMostrarForm(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.55rem 1.25rem', borderRadius: 9999, border: 'none',
            background: '#d97706', color: '#fff', fontWeight: 700, fontSize: '.82rem',
            cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            Registrar Primeira Transcrição
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {transcricoes.map(t => {
            const plat    = PLATAFORMAS.find(p => p.value === t.plataforma) ?? PLATAFORMAS[4]
            const aberto  = expandido === t.id

            return (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
                {/* Card header */}
                <div
                  onClick={() => setExpandido(aberto ? null : t.id)}
                  style={{
                    padding: '1rem 1.25rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    borderLeft: `4px solid ${plat.cor}`,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  {/* Plataforma */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: plat.cor + '18', border: `1px solid ${plat.cor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plat.cor, flexShrink: 0 }}>
                    <PlataformaIcon plat={t.plataforma} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.875rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>
                      {t.titulo ?? `Reunião com ${t.escola?.nome ?? '—'}`}
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {fmtData(t.data_reuniao)}
                      </span>
                      <span style={{ fontSize: '.68rem', background: plat.cor + '15', color: plat.cor, border: `1px solid ${plat.cor}30`, padding: '.1rem .4rem', borderRadius: 99, fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {plat.label}
                      </span>
                      {t.escola?.nome && (
                        <span style={{ fontSize: '.68rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '.1rem .4rem', borderRadius: 99, fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {t.escola.nome}
                        </span>
                      )}
                      {/* Badges de arquivos */}
                      {t.arquivo_transcricao_nome && (
                        <span style={{ fontSize: '.62rem', background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', padding: '.1rem .4rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                          📄 Transcrição
                        </span>
                      )}
                      {t.arquivo_midia_nome && (
                        <span style={{ fontSize: '.62rem', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '.1rem .4rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                          {t.arquivo_midia_tipo === 'audio' ? '🎵 Áudio' : '🎥 Vídeo'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Conteúdo expandido */}
                {aberto && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>

                    {/* Participantes */}
                    {t.participantes && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Participantes</div>
                        <div style={{ fontSize: '.82rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)' }}>{t.participantes}</div>
                      </div>
                    )}

                    {/* Transcrição texto */}
                    {t.transcricao && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Transcrição</div>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', maxHeight: 280, overflowY: 'auto', fontSize: '.82rem', color: '#334155', lineHeight: 1.7, fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'pre-wrap' }}>
                          {t.transcricao}
                        </div>
                      </div>
                    )}

                    {/* Downloads */}
                    {(t.arquivo_transcricao_path || t.arquivo_midia_path) && (
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {t.arquivo_transcricao_path && (
                          <a href={`${supabaseUrl}/storage/v1/object/public/documentos-oficiais/${t.arquivo_transcricao_path}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .9rem', borderRadius: 8, background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', textDecoration: 'none', fontSize: '.75rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t.arquivo_transcricao_nome ?? 'Transcrição'} {t.arquivo_transcricao_size ? `(${fmtSize(t.arquivo_transcricao_size)})` : ''}
                          </a>
                        )}
                        {t.arquivo_midia_path && (
                          <a href={`${supabaseUrl}/storage/v1/object/public/documentos-oficiais/${t.arquivo_midia_path}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .9rem', borderRadius: 8, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', textDecoration: 'none', fontSize: '.75rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t.arquivo_midia_nome ?? 'Mídia'} {t.arquivo_midia_size ? `(${fmtSize(t.arquivo_midia_size)})` : ''}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDeletar(t.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                        padding: '.35rem .75rem', borderRadius: 7,
                        border: '1px solid #fca5a5', background: '#fef2f2',
                        color: '#dc2626', fontSize: '.72rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

