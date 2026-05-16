'use client'

import { useState, useRef } from 'react'

const FONTES = [
  { value: 'ciecc_2026', label: '2º CIECC 2026',  cor: '#2563eb', desc: 'Banco_Unificado_CIECC_2026.xlsx' },
  { value: 'ciecc_2025', label: '1º CIECC 2025',  cor: '#7c3aed', desc: 'Prover 2025.xlsx' },
  { value: 'crm',        label: 'CRM Education',  cor: '#4A7FDB', desc: 'Education_CRM_FINAL.xlsx' },
  { value: 'oikos',      label: 'Oikos Live',      cor: '#0d9488', desc: 'Leads captados via RD Station' },
  { value: 'outro',      label: 'Outra planilha',  cor: '#64748b', desc: 'Qualquer planilha .xlsx/.csv' },
]

interface ColInfo {
  campo: string
  tipo: 'fixo' | 'extra'
}

interface PreviewData {
  abas: string[]
  colunas: string[]
  mapeadas: Record<string, ColInfo>
  presel: string[]
  preview: Record<string, any>[]
  total: number
  totalSemFiltro?: number
  filtrosAplicados?: string[]
  tiposDisponiveis?: { tipo: string; n: number }[]
  colTipoAtiva?: string | null
}

interface Resultado { inseridos: number; atualizados: number; erros: number; ignorados: number; total: number }

export function ImportacaoClient() {
  const [etapa,        setEtapa]       = useState<'config' | 'colunas' | 'resultado'>('config')
  const [fonte,        setFonte]       = useState('ciecc_2026')
  const [abaIdx,       setAbaIdx]      = useState(0)
  const [arquivo,      setArquivo]     = useState<File | null>(null)
  const [loading,      setLoading]     = useState(false)
  const [preview,      setPreview]     = useState<PreviewData | null>(null)
  const [colSel,       setColSel]      = useState<Set<string>>(new Set())
  const [busca,        setBusca]       = useState('')
  const [resultado,    setResultado]   = useState<Resultado | null>(null)
  const [erro,         setErro]        = useState('')
  // Filtro de tipos: Set com os tipos exatos selecionados (vazio = todos)
  const [tiposSel,     setTiposSel]    = useState<Set<string>>(new Set())
  // Se a fonte é CIECC, mostra o filtro de tipos
  const isCIECC = fonte === 'ciecc_2025' || fonte === 'ciecc_2026'
  const inputRef = useRef<HTMLInputElement>(null)

  const fonteAtual = FONTES.find(f => f.value === fonte)!

  // ── Fase 1 — Analisar planilha ────────────────────────────
  async function handleAnalisar() {
    if (!arquivo) { setErro('Selecione um arquivo primeiro'); return }
    setLoading(true); setErro('')
    const fd = new FormData()
    fd.set('file', arquivo); fd.set('acao', 'preview')
    fd.set('fonte', fonte);  fd.set('aba', String(abaIdx))
    fd.set('filtros_tipo', JSON.stringify([...tiposSel]))
    fd.set('colunas_sel', '[]')

    try {
      const res  = await fetch('/api/importar-planilha', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao analisar'); setLoading(false); return }
      setPreview(data)
      setColSel(new Set(data.presel))  // pré-seleciona colunas com mapeamento fixo
      setEtapa('colunas')
    } catch { setErro('Erro ao processar o arquivo') }
    setLoading(false)
  }

  // ── Fase 2 — Importar ─────────────────────────────────────
  async function handleImportar() {
    if (!arquivo || colSel.size === 0) { setErro('Selecione ao menos uma coluna'); return }
    setLoading(true); setErro('')
    const fd = new FormData()
    fd.set('file', arquivo); fd.set('acao', 'importar')
    fd.set('fonte', fonte);  fd.set('aba', String(abaIdx))
    fd.set('filtros_tipo', JSON.stringify([...tiposSel]))
    fd.set('colunas_sel', JSON.stringify([...colSel]))

    try {
      const res  = await fetch('/api/importar-planilha', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao importar'); setLoading(false); return }
      setResultado(data); setEtapa('resultado')
    } catch { setErro('Erro na importação') }
    setLoading(false)
  }

  function toggleCol(col: string) {
    setColSel(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n })
  }

  function selecionarGrupo(tipo: 'fixo' | 'extra' | 'todos' | 'nenhum') {
    if (!preview) return
    if (tipo === 'todos')   { setColSel(new Set(preview.colunas)); return }
    if (tipo === 'nenhum')  { setColSel(new Set()); return }
    const grupo = preview.colunas.filter(c => preview.mapeadas[c]?.tipo === tipo)
    setColSel(prev => {
      const n = new Set(prev)
      grupo.forEach(c => n.add(c))
      return n
    })
  }

  const colunasFiltradas = preview?.colunas.filter(c =>
    !busca || c.toLowerCase().includes(busca.toLowerCase())
  ) ?? []

  const fixasSelecionadas  = preview ? [...colSel].filter(c => preview.mapeadas[c]?.tipo === 'fixo').length : 0
  const extrasSelecionadas = preview ? [...colSel].filter(c => preview.mapeadas[c]?.tipo === 'extra').length : 0

  // Estilos
  const lbl: React.CSSProperties = { display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }
  const inp: React.CSSProperties = { width: '100%', padding: '.65rem .9rem', fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        {[
          { id: 'config',    n: 1, label: 'Fonte e Arquivo' },
          { id: 'colunas',   n: 2, label: 'Selecionar Colunas' },
          { id: 'resultado', n: 3, label: 'Importado' },
        ].map((s, i) => {
          const ativo   = etapa === s.id
          const passado = (etapa === 'colunas' && i === 0) || etapa === 'resultado'
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: ativo ? fonteAtual.cor : passado ? '#16a34a' : '#e2e8f0', color: ativo || passado ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                  {passado ? '✓' : s.n}
                </div>
                <span style={{ fontSize: '.75rem', fontWeight: ativo ? 700 : 400, color: ativo ? '#0f172a' : '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: passado ? '#16a34a' : '#e2e8f0', margin: '0 .75rem' }} />}
            </div>
          )
        })}
      </div>

      {/* ═══ ETAPA 1 — CONFIGURAÇÃO ═══ */}
      {etapa === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Fonte */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
            <label style={lbl}>Fonte dos dados</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.65rem' }}>
              {FONTES.map(f => (
                <div key={f.value} onClick={() => setFonte(f.value)} style={{ padding: '.85rem', borderRadius: 10, cursor: 'pointer', border: `2px solid ${fonte === f.value ? f.cor : '#e2e8f0'}`, background: fonte === f.value ? f.cor + '10' : '#fafafa', transition: 'all .15s' }}>
                  <div style={{ fontWeight: 700, fontSize: '.78rem', color: fonte === f.value ? f.cor : '#1e293b', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>{f.label}</div>
                  <div style={{ fontSize: '.62rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro de tipo — APENAS para CIECC 2025 / 2026 */}
          {isCIECC && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
                <div>
                  <label style={lbl}>Filtrar por tipo de inscrição</label>
                  <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                    Selecione um ou mais tipos. Os tipos exatos serão lidos da planilha após o upload.
                    {tiposSel.size === 0 && <span style={{ color: '#4A7FDB', marginLeft: '.3rem' }}>Nenhum selecionado = importa todos os tipos.</span>}
                  </div>
                </div>
                {tiposSel.size > 0 && (
                  <button onClick={() => setTiposSel(new Set())} style={{ padding: '.3rem .75rem', borderRadius: 7, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Limpar filtros ({tiposSel.size})
                  </button>
                )}
              </div>

              {/* Atalhos rápidos para os tipos mais comuns */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#94a3b8', marginBottom: '.5rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Seleção rápida — tipos mais relevantes para o CRM:
                </div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Gestores de escola',      termo: 'gestor',      cor: '#7c3aed' },
                    { label: 'Diretores de escola',     termo: 'diretor',     cor: '#2563eb' },
                    { label: 'Mantenedores de escola',  termo: 'mantenedor',  cor: '#4A7FDB' },
                    { label: 'Coordenadores',           termo: 'coordenador', cor: '#0d9488' },
                  ].map(({ label, termo, cor }) => {
                    // Verificar quais tipos da planilha contém esse termo
                    const ativo = [...tiposSel].some(t => t.toLowerCase().includes(termo))
                    return (
                      <button key={termo} onClick={() => {
                        // Selecionar/deselecionar todos os tipos que contém esse termo
                        // (os tipos reais serão carregados depois — aqui usamos como marcador temporário)
                        setTiposSel(prev => {
                          const n = new Set(prev)
                          if (ativo) {
                            // Remove todos que contêm o termo
                            prev.forEach(t => { if (t.toLowerCase().includes(termo)) n.delete(t) })
                          } else {
                            // Adiciona o termo como placeholder (será substituído pelos tipos reais)
                            n.add(`__kw:${termo}`)
                          }
                          return n
                        })
                      }} style={{
                        padding: '.35rem .85rem', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${ativo ? cor : '#e2e8f0'}`,
                        background: ativo ? cor + '12' : '#fafafa',
                        color: ativo ? cor : '#475569',
                        fontSize: '.72rem', fontWeight: ativo ? 700 : 400,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                        display: 'flex', alignItems: 'center', gap: '.35rem',
                        transition: 'all .15s',
                      }}>
                        {ativo && <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        {label}
                      </button>
                    )
                  })}
                  <button onClick={() => setTiposSel(new Set(['__kw:gestor','__kw:diretor','__kw:mantenedor','__kw:coordenador']))} style={{ padding: '.35rem .85rem', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #dc2626', background: '#fef2f2', color: '#dc2626', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Todos os decisores
                  </button>
                  <button onClick={() => setTiposSel(new Set())} style={{ padding: '.35rem .85rem', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '.72rem', fontWeight: 400, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Importar todos
                  </button>
                </div>
              </div>

              {/* Status atual do filtro */}
              {tiposSel.size > 0 ? (
                <div style={{ padding: '.65rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: '.72rem', color: '#15803d', fontFamily: 'var(--font-inter,sans-serif)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  <span>
                    Filtrando por <strong>{tiposSel.size} critério{tiposSel.size > 1 ? 's' : ''}</strong>:
                    {' '}{[...tiposSel].map(t => t.startsWith('__kw:') ? t.replace('__kw:', '') : `"${t}"`).join(', ')}
                    . Os tipos exatos da planilha que contenham esses termos serão importados.
                  </span>
                </div>
              ) : (
                <div style={{ padding: '.65rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Sem filtro ativo — todos os tipos de inscrição serão importados.
                </div>
              )}
            </div>
          )}

          {/* Upload */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
            <label style={lbl}>Arquivo Excel ou CSV</label>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = fonteAtual.cor }}
              onDragLeave={e => { e.currentTarget.style.borderColor = arquivo ? fonteAtual.cor : '#e2e8f0' }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setArquivo(f) }}
              style={{ border: `2px dashed ${arquivo ? fonteAtual.cor : '#e2e8f0'}`, borderRadius: 12, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: arquivo ? fonteAtual.cor + '06' : '#fafafa', transition: 'all .15s' }}>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
              {arquivo ? (
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: fonteAtual.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: fonteAtual.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{arquivo.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>{(arquivo.size / (1024*1024)).toFixed(1)} MB · clique para trocar</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.75rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                  </div>
                  <div style={{ fontWeight: 600, color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>Arraste ou clique para selecionar</div>
                  <div style={{ fontSize: '.72rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>.xlsx, .xls, .csv</div>
                </div>
              )}
            </div>
          </div>

          {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

          <button onClick={handleAnalisar} disabled={!arquivo || loading} style={{ padding: '.85rem', borderRadius: 9999, border: 'none', background: !arquivo || loading ? '#e2e8f0' : `linear-gradient(135deg, ${fonteAtual.cor}, ${fonteAtual.cor}cc)`, color: !arquivo || loading ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '.9rem', cursor: !arquivo || loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: !arquivo || loading ? 'none' : `0 4px 14px ${fonteAtual.cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            {loading ? <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analisando...</> : 'Analisar Planilha →'}
          </button>
        </div>
      )}

      {/* ═══ ETAPA 2 — SELEÇÃO DE COLUNAS (ESTILO POWER BI) ═══ */}
      {etapa === 'colunas' && preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Barra superior compacta ── */}
          <div style={{ background: '#0f172a', borderRadius: 14, padding: '.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Info arquivo */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {arquivo?.name}
              </div>
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem' }}>
                {preview.total.toLocaleString('pt-BR')} registros
                {preview.totalSemFiltro && preview.totalSemFiltro !== preview.total && (
                  <> · <span style={{ color: '#f87171' }}>{tiposSel.size} filtro{tiposSel.size > 1 ? 's' : ''}</span> de {preview.totalSemFiltro.toLocaleString('pt-BR')} total</>
                )}
                {' '}· {preview.colunas.length} colunas · {fonteAtual.label}
              </div>
            </div>
            {/* Contadores em linha */}
            <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { n: colSel.size,                            label: 'Sel.',       cor: fonteAtual.cor },
                { n: fixasSelecionadas,                      label: 'Mapeadas',   cor: '#16a34a' },
                { n: extrasSelecionadas,                     label: 'Extras',     cor: '#f59e0b' },
                { n: preview.colunas.length - colSel.size,   label: 'Desmarcadas',cor: '#64748b' },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '.35rem .65rem', textAlign: 'center', minWidth: 58 }}>
                  <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 800, color: k.cor, lineHeight: 1 }}>{k.n}</div>
                  <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '.1rem' }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Controles: busca + botões + aba ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '.85rem 1.25rem', display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
            {/* Busca */}
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar coluna..." style={{ ...inp, paddingLeft: '2.1rem', fontSize: '.78rem' }} />
            </div>
            {/* Botões de seleção rápida */}
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Selecionar Todos',  action: () => selecionarGrupo('todos'),                                        cor: '#0f172a' },
                { label: 'Só Mapeadas',        action: () => { setColSel(new Set()); setTimeout(() => selecionarGrupo('fixo'), 0) },   cor: '#16a34a' },
                { label: 'Só Extras',          action: () => { setColSel(new Set()); setTimeout(() => selecionarGrupo('extra'), 0) },  cor: '#4A7FDB' },
                { label: 'Desmarcar Todos',    action: () => setColSel(new Set()),                                           cor: '#dc2626' },
              ].map(b => (
                <button key={b.label} onClick={b.action} style={{ padding: '.35rem .85rem', borderRadius: 7, border: `1.5px solid ${b.cor}25`, background: b.cor + '10', color: b.cor, fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                  {b.label}
                </button>
              ))}
            </div>
            {/* Seletor de aba */}
            {preview.abas.length > 1 && (
              <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                <span style={{ fontSize: '.65rem', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Aba:</span>
                {preview.abas.map((aba, i) => (
                  <button key={i} onClick={() => { setAbaIdx(i); setEtapa('config') }} style={{ padding: '.3rem .7rem', borderRadius: 6, border: `1.5px solid ${abaIdx === i ? fonteAtual.cor : '#e2e8f0'}`, background: abaIdx === i ? fonteAtual.cor + '12' : '#fff', color: abaIdx === i ? fonteAtual.cor : '#475569', fontSize: '.65rem', fontWeight: abaIdx === i ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {aba.length > 20 ? aba.slice(0, 20) + '…' : aba}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tipos reais da planilha com contagem — só para CIECC */}
          {isCIECC && preview.tiposDisponiveis && preview.tiposDisponiveis.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ padding: '.75rem 1.25rem', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 700, color: '#fff' }}>
                    Tipos de inscrição encontrados na planilha
                  </div>
                  <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem' }}>
                    {preview.colTipoAtiva ? `Coluna: "${preview.colTipoAtiva}"` : 'Coluna não detectada'} · {preview.totalSemFiltro?.toLocaleString('pt-BR')} total · clique para filtrar
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button onClick={() => {
                    // Selecionar todos os tipos que são decisores
                    const decisores = (preview.tiposDisponiveis ?? [])
                      .filter(({ tipo }) => {
                        const t = tipo.toLowerCase()
                        return t.includes('gestor') || t.includes('diretor') || t.includes('mantenedor') || t.includes('coordenador')
                      })
                      .map(({ tipo }) => tipo)
                    setTiposSel(new Set(decisores))
                  }} style={{ padding: '.3rem .75rem', borderRadius: 7, border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.15)', color: '#fca5a5', fontSize: '.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Só Decisores
                  </button>
                  <button onClick={() => setTiposSel(new Set((preview.tiposDisponiveis ?? []).map(t => t.tipo)))} style={{ padding: '.3rem .75rem', borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', fontSize: '.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Todos
                  </button>
                  <button onClick={() => setTiposSel(new Set())} style={{ padding: '.3rem .75rem', borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: '.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                    Limpar
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.35rem', padding: '1rem 1.25rem', maxHeight: 340, overflowY: 'auto' }}>
                {preview.tiposDisponiveis.map(({ tipo, n }) => {
                  const sel = tiposSel.has(tipo)
                  const t   = tipo.toLowerCase()
                  const isDecisor = t.includes('gestor') || t.includes('diretor') || t.includes('mantenedor') || t.includes('coordenador')
                  const cor = isDecisor ? '#dc2626' : '#64748b'
                  const pct = preview.totalSemFiltro ? Math.round(n / preview.totalSemFiltro * 100) : 0
                  return (
                    <div key={tipo} onClick={() => {
                      setTiposSel(prev => {
                        const next = new Set(prev)
                        next.has(tipo) ? next.delete(tipo) : next.add(tipo)
                        return next
                      })
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: '.6rem',
                      padding: '.5rem .75rem', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${sel ? cor : '#e2e8f0'}`,
                      background: sel ? cor + '08' : '#fafafa',
                      transition: 'all .1s',
                      userSelect: 'none' as const,
                    }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = cor + '60' }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#e2e8f0' }}>
                      {/* Checkbox */}
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${sel ? cor : '#d1d5db'}`, background: sel ? cor : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {/* Label + barra */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                          <span style={{ fontSize: '.72rem', fontWeight: sel ? 700 : 400, color: sel ? '#0f172a' : '#334155', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '.4rem' }}>
                            {tipo}
                          </span>
                          <span style={{ fontSize: '.65rem', fontWeight: 700, color: cor, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                            {n.toLocaleString('pt-BR')}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}> ({pct}%)</span>
                          </span>
                        </div>
                        {/* Mini barra */}
                        <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: sel ? cor : '#cbd5e1', width: `${pct}%`, borderRadius: 2, transition: 'background .15s' }} />
                        </div>
                      </div>
                      {/* Badge decisor */}
                      {isDecisor && (
                        <div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} title="Decisor comercial" />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Resumo da seleção */}
              {tiposSel.size > 0 && (
                <div style={{ padding: '.65rem 1.25rem', background: '#f0fdf4', borderTop: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  <span style={{ fontSize: '.72rem', color: '#15803d', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    <strong>{tiposSel.size} tipo{tiposSel.size > 1 ? 's' : ''} selecionado{tiposSel.size > 1 ? 's' : ''}</strong> →
                    importando <strong>{preview.total.toLocaleString('pt-BR')}</strong> registros de {preview.totalSemFiltro?.toLocaleString('pt-BR')} total
                  </span>
                  <button onClick={() => setTiposSel(new Set())} style={{ marginLeft: 'auto', padding: '.2rem .6rem', borderRadius: 6, border: '1px solid #86efac', background: 'transparent', color: '#16a34a', fontSize: '.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Limpar filtro
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PAINEL PRINCIPAL DE SELEÇÃO (estilo Power BI) ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>

            {/* Legenda */}
            <div style={{ padding: '.65rem 1.25rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: '#16a34a' }} />
                <span style={{ fontSize: '.68rem', color: '#1e293b', fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Mapeado</strong> — coluna própria no banco</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: '#4A7FDB' }} />
                <span style={{ fontSize: '.68rem', color: '#1e293b', fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Extra</strong> — salvo em JSON pesquisável</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: '.68rem', color: '#2563eb', fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Pré-marcados</strong> = campos do cadastro de escola (nome, contato, cidade, alunos, cargo)</span>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                {colunasFiltradas.length} {busca ? 'encontradas' : 'colunas'} · clique para marcar/desmarcar
              </span>
            </div>

            {/* Grid de checkboxes — estilo Power BI */}
            <div style={{ padding: '1rem 1.25rem' }}>

              {/* Grupo: Campos Mapeados */}
              {colunasFiltradas.some(c => preview.mapeadas[c]?.tipo === 'fixo') && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem', paddingBottom: '.5rem', borderBottom: '2px solid #dcfce7' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      Campos mapeados → banco de dados ({colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'fixo').length})
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '.35rem' }}>
                    {colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'fixo').map(col => {
                      const sel  = colSel.has(col)
                      const info = preview.mapeadas[col]
                      return (
                        <div key={col} onClick={() => toggleCol(col)} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.45rem .7rem', cursor: 'pointer', borderRadius: 8, border: `1.5px solid ${sel ? '#86efac' : '#e2e8f0'}`, background: sel ? '#f0fdf4' : '#fafafa', transition: 'all .1s', userSelect: 'none' as const }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac' } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e2e8f0' } }}>
                          <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${sel ? '#16a34a' : '#d1d5db'}`, background: sel ? '#16a34a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .1s' }}>
                            {sel && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.72rem', fontWeight: sel ? 600 : 400, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</div>
                            <div style={{ fontSize: '.58rem', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700 }}>→ {info.campo}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Grupo: Campos Extras */}
              {colunasFiltradas.some(c => preview.mapeadas[c]?.tipo === 'extra') && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem', paddingBottom: '.5rem', borderBottom: '2px solid #fde68a' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4A7FDB' }} />
                    <span style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      Campos extras → dados JSON ({colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'extra').length})
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '.35rem' }}>
                    {colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'extra').map(col => {
                      const sel = colSel.has(col)
                      return (
                        <div key={col} onClick={() => toggleCol(col)} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.45rem .7rem', cursor: 'pointer', borderRadius: 8, border: `1.5px solid ${sel ? '#fcd34d' : '#e2e8f0'}`, background: sel ? '#fffbeb' : '#fafafa', transition: 'all .1s', userSelect: 'none' as const }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fcd34d' } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e2e8f0' } }}>
                          <div style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${sel ? '#4A7FDB' : '#d1d5db'}`, background: sel ? '#4A7FDB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .1s' }}>
                            {sel && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.72rem', fontWeight: sel ? 600 : 400, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Preview da tabela ── */}
          {colSel.size > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
              <div style={{ padding: '.75rem 1.25rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  Pré-visualização — {colSel.size} colunas selecionadas
                </span>
                <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  5 de {preview.total.toLocaleString('pt-BR')} registros
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      {[...colSel].slice(0, 8).map(col => {
                        const info = preview.mapeadas[col]
                        return (
                          <th key={col} style={{ padding: '.55rem .8rem', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.6rem', letterSpacing: '.04em', borderRight: '1px solid rgba(255,255,255,.06)' }}>
                            <div>{col.length > 20 ? col.slice(0, 20) + '…' : col}</div>
                            {info?.tipo === 'fixo' && <div style={{ color: '#4ade80', fontSize: '.54rem', fontWeight: 700 }}>→ {info.campo}</div>}
                            {info?.tipo === 'extra' && <div style={{ color: '#fbbf24', fontSize: '.54rem', fontWeight: 700 }}>JSON</div>}
                          </th>
                        )
                      })}
                      {colSel.size > 8 && <th style={{ padding: '.55rem .8rem', color: 'rgba(255,255,255,.3)', fontSize: '.6rem', whiteSpace: 'nowrap' }}>+{colSel.size - 8} cols</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        {[...colSel].slice(0, 8).map(col => (
                          <td key={col} style={{ padding: '.5rem .8rem', color: '#1e293b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)', borderRight: '1px solid #f1f5f9' }}>
                            {row[col] != null && String(row[col]).trim() !== '' && String(row[col]) !== 'null'
                              ? String(row[col]).slice(0, 45)
                              : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                        ))}
                        {colSel.size > 8 && <td style={{ padding: '.5rem .8rem', color: '#cbd5e1' }}>…</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

          {/* Botões de ação — sticky na base */}
          <div style={{
            display: 'flex', gap: '.75rem',
            position: 'sticky', bottom: 0,
            background: 'var(--bg)',
            paddingTop: '.75rem', paddingBottom: '.75rem',
            borderTop: '1px solid #e2e8f0',
            zIndex: 10,
          }}>
            <button onClick={() => setEtapa('config')} style={{
              padding: '.75rem 1.25rem', borderRadius: 9999, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              ← Voltar
            </button>
            <button onClick={handleImportar} disabled={colSel.size === 0 || loading} style={{
              flex: 1, padding: '.8rem', borderRadius: 9999, border: 'none',
              background: colSel.size === 0 || loading ? '#e2e8f0' : `linear-gradient(135deg, ${fonteAtual.cor}, ${fonteAtual.cor}cc)`,
              color: colSel.size === 0 || loading ? '#94a3b8' : '#fff',
              fontWeight: 700, fontSize: '.875rem',
              cursor: colSel.size === 0 || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: colSel.size === 0 || loading ? 'none' : `0 4px 14px ${fonteAtual.cor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              minWidth: 0,
            }}>
              {loading ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Importando {preview.total.toLocaleString('pt-BR')} registros...</span></>
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Importar {preview.total.toLocaleString('pt-BR')} registros · {colSel.size} colunas →
                </span>
              )}
            </button>
          </div>

          {/* bloco antigo removido */}
          <div style={{ display: 'none' }}><div>

            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', background: '#0f172a', color: '#fff' }}>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '.35rem' }}>
                Campos da Planilha
              </div>
              <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-inter,sans-serif)' }}>
                {preview.total.toLocaleString('pt-BR')} registros · {preview.colunas.length} colunas disponíveis
              </div>

              {/* Contadores */}
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.65rem' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 7, padding: '.4rem .6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: fonteAtual.cor, fontFamily: 'var(--font-cormorant,serif)', lineHeight: 1 }}>{colSel.size}</div>
                  <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.06em' }}>selecionadas</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 7, padding: '.4rem .6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-cormorant,serif)', lineHeight: 1 }}>{fixasSelecionadas}</div>
                  <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.06em' }}>mapeadas</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 7, padding: '.4rem .6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-cormorant,serif)', lineHeight: 1 }}>{extrasSelecionadas}</div>
                  <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.06em' }}>extras</div>
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div style={{ padding: '.65rem .85rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Selecionar Todos',  action: () => selecionarGrupo('todos'),   cor: '#0f172a' },
                { label: 'Só Mapeadas',        action: () => { setColSel(new Set()); selecionarGrupo('fixo') },  cor: '#16a34a' },
                { label: 'Só Extras',          action: () => { setColSel(new Set()); selecionarGrupo('extra') }, cor: '#4A7FDB' },
                { label: 'Desmarcar Todos',    action: () => setColSel(new Set()),       cor: '#dc2626' },
              ].map(b => (
                <button key={b.label} onClick={b.action} style={{ padding: '.25rem .7rem', borderRadius: 6, border: `1px solid ${b.cor}30`, background: b.cor + '10', color: b.cor, fontSize: '.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Busca */}
            <div style={{ padding: '.65rem .85rem', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '1.35rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar coluna..." style={{ ...inp, paddingLeft: '2rem', fontSize: '.78rem', background: '#fff' }} />
            </div>

            {/* Lista de colunas */}
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {/* Separador: Mapeadas */}
              {colunasFiltradas.some(c => preview.mapeadas[c]?.tipo === 'fixo') && (
                <div style={{ padding: '.45rem .85rem', background: '#f0fdf4', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Campos mapeados → banco de dados
                  </span>
                </div>
              )}
              {colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'fixo').map(col => {
                const sel = colSel.has(col)
                const info = preview.mapeadas[col]
                return (
                  <div key={col} onClick={() => toggleCol(col)} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.55rem .85rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: sel ? '#f0fdf4' : '#fff', transition: 'background .1s' }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = '#fff' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#16a34a' : '#d1d5db'}`, background: sel ? '#16a34a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.75rem', fontWeight: sel ? 600 : 400, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</div>
                      <div style={{ fontSize: '.6rem', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>→ {info.campo}</div>
                    </div>
                  </div>
                )
              })}

              {/* Separador: Extras */}
              {colunasFiltradas.some(c => preview.mapeadas[c]?.tipo === 'extra') && (
                <div style={{ padding: '.45rem .85rem', background: '#fffbeb', borderTop: '1px solid #fde68a', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A7FDB' }} />
                  <span style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Campos extras → dados_extras (JSONB)
                  </span>
                </div>
              )}
              {colunasFiltradas.filter(c => preview.mapeadas[c]?.tipo === 'extra').map(col => {
                const sel = colSel.has(col)
                return (
                  <div key={col} onClick={() => toggleCol(col)} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.55rem .85rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: sel ? '#fffbeb' : '#fff', transition: 'background .1s' }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = '#fff' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#4A7FDB' : '#d1d5db'}`, background: sel ? '#4A7FDB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.75rem', fontWeight: sel ? 600 : 400, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Painel direito — preview + aba + ações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Seletor de aba */}
            {preview.abas.length > 1 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
                <label style={lbl}>Aba da planilha</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {preview.abas.map((aba, i) => (
                    <button key={i} onClick={() => { setAbaIdx(i); setEtapa('config') }} style={{ padding: '.4rem .9rem', borderRadius: 7, border: `1.5px solid ${abaIdx === i ? fonteAtual.cor : '#e2e8f0'}`, background: abaIdx === i ? fonteAtual.cor + '12' : '#fff', color: abaIdx === i ? fonteAtual.cor : '#475569', fontSize: '.72rem', fontWeight: abaIdx === i ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      {aba.length > 28 ? aba.slice(0, 28) + '…' : aba}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legenda */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(15,23,42,.04)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a' }} />
                <span style={{ fontSize: '.72rem', color: '#1e293b', fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Campo mapeado</strong> — vai para coluna própria no banco</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#4A7FDB' }} />
                <span style={{ fontSize: '.72rem', color: '#1e293b', fontFamily: 'var(--font-inter,sans-serif)' }}><strong>Campo extra</strong> — armazenado como JSON (pesquisável)</span>
              </div>
            </div>

            {/* Preview da tabela */}
            {colSel.size > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
                <div style={{ padding: '.75rem 1.25rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    Pré-visualização — {colSel.size} colunas selecionadas
                  </span>
                  <span style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    5 de {preview.total.toLocaleString('pt-BR')} registros
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.72rem' }}>
                    <thead>
                      <tr style={{ background: '#0f172a' }}>
                        {[...colSel].slice(0, 7).map(col => {
                          const info = preview.mapeadas[col]
                          return (
                            <th key={col} style={{ padding: '.55rem .8rem', textAlign: 'left', color: 'rgba(255,255,255,.8)', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.6rem', letterSpacing: '.04em' }}>
                              <div>{col.length > 18 ? col.slice(0, 18) + '…' : col}</div>
                              {info?.tipo === 'fixo' && <div style={{ color: '#16a34a', fontSize: '.55rem', fontWeight: 700 }}>→ {info.campo}</div>}
                            </th>
                          )
                        })}
                        {colSel.size > 7 && <th style={{ padding: '.55rem .8rem', color: 'rgba(255,255,255,.3)', fontSize: '.6rem' }}>+{colSel.size - 7}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {[...colSel].slice(0, 7).map(col => (
                            <td key={col} style={{ padding: '.5rem .8rem', color: '#1e293b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>
                              {row[col] != null && String(row[col]).trim() !== ''
                                ? String(row[col]).slice(0, 40)
                                : <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                          ))}
                          {colSel.size > 7 && <td style={{ padding: '.5rem .8rem', color: '#cbd5e1' }}>…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

          </div></div>
        </div>
      )}

      {/* ═══ ETAPA 3 — RESULTADO ═══ */}
      {etapa === 'resultado' && resultado && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: resultado.erros === 0 ? '#f0fdf4' : '#fffbeb', border: `3px solid ${resultado.erros === 0 ? '#16a34a' : '#4A7FDB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {resultado.erros === 0
                ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A7FDB" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>
            {resultado.erros === 0 ? 'Importação concluída!' : 'Importação com alertas'}
          </h2>
          <p style={{ fontSize: '.875rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '1.5rem' }}>
            Fonte: <strong>{fonteAtual.label}</strong> · {colSel.size} colunas importadas
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', maxWidth: 680, margin: '0 auto 2rem' }}>
            {[
              { label: 'Total',       val: resultado.total,               cor: '#64748b' },
              { label: 'Inseridos',   val: resultado.inseridos,            cor: '#16a34a' },
              { label: 'Atualizados', val: resultado.atualizados ?? 0,     cor: '#2563eb' },
              { label: 'Ignorados',   val: resultado.ignorados ?? 0,       cor: '#4A7FDB' },
              { label: 'Erros',       val: resultado.erros,                cor: resultado.erros > 0 ? '#dc2626' : '#94a3b8' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: `1.5px solid ${k.cor}30`, borderTop: `3px solid ${k.cor}`, borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: k.cor, fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{k.label}</div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{k.val.toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
            <button onClick={() => { setEtapa('config'); setArquivo(null); setPreview(null); setResultado(null); setColSel(new Set()) }} style={{ padding: '.65rem 1.75rem', borderRadius: 9999, border: 'none', background: `linear-gradient(135deg, ${fonteAtual.cor}, ${fonteAtual.cor}cc)`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: `0 4px 14px ${fonteAtual.cor}44` }}>
              Nova Importação
            </button>
            <a href="/pesquisa-mercado" style={{ padding: '.65rem 1.75rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Ver Pesquisa CIECC →
            </a>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
