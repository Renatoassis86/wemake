'use client'

import { useState, useCallback } from 'react'

interface Lead {
  id: string
  fonte: string
  nome: string | null
  email: string | null
  tel_celular: string | null
  tel_fixo: string | null
  cidade: string | null
  uf: string | null
  endereco: string | null
  bairro: string | null
  cep: string | null
  tipo_inscricao: string | null
  cargo: string | null
  escola_nome: string | null
  escola_cnpj: string | null
  // Campos extras do cadastro de escola
  qtd_alunos_total: number | null
  qtd_infantil: number | null
  qtd_fund1: number | null
  qtd_fund2: number | null
  qtd_medio: number | null
  lote: string | null
  data_inscricao: string | null
  dados_extras: Record<string, any> | null
}

interface Props {
  leads: Lead[]
  total: number
  pagina: number
  totalPaginas: number
  q: string
  fonte: string
  tipo: string
  uf: string
}

// ── Helpers ──────────────────────────────────────────────────
const FONTE_COR: Record<string, { label: string; cor: string; bg: string; border: string }> = {
  ciecc_2025: { label: '1º CIECC 2025', cor: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ciecc_2026: { label: '2º CIECC 2026', cor: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  crm:        { label: 'CRM Education', cor: '#4A7FDB', bg: '#fffbeb', border: '#fde68a' },
  oikos:      { label: 'Oikos Live',    cor: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  outro:      { label: 'Outro',         cor: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}

const TIPO_DECISOR = (t: string | null) => {
  if (!t) return false
  const v = t.toLowerCase()
  return v.includes('gestor') || v.includes('diretor') || v.includes('mantenedor') || v.includes('coordenador')
}

const TIPO_COR = (t: string | null) => {
  if (!t) return '#64748b'
  const v = t.toLowerCase()
  if (v.includes('gestor'))      return '#7c3aed'
  if (v.includes('diretor'))     return '#2563eb'
  if (v.includes('mantenedor'))  return '#4A7FDB'
  if (v.includes('coordenador')) return '#0d9488'
  return '#64748b'
}

// ── Modal de edição ───────────────────────────────────────────
function ModalEditar({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (lead: Lead) => void }) {
  const [form, setForm] = useState({ ...lead })
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k: keyof Lead, v: string) => setForm(prev => ({ ...prev, [k]: v || null }))

  async function handleSave() {
    setSaving(true); setErro('')
    const { id, dados_extras, fonte, ...updates } = form
    const res = await fetch('/api/leads-universal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error ?? 'Erro ao salvar'); setSaving(false); return }
    onSaved(form)
    onClose()
  }

  const lbl: React.CSSProperties = { display: 'block', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)' }
  const inp: React.CSSProperties = { width: '100%', padding: '.6rem .85rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '1.1rem 1.5rem', borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '.58rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>Editar Lead</div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{lead.nome ?? 'Sem nome'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* ── Responsável / Contato ── */}
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.6rem', paddingBottom: '.4rem', borderBottom: '2px solid #fde68a' }}>
              Contato Principal
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>Nome completo</label>
                <input value={form.nome ?? ''} onChange={e => set('nome', e.target.value)} style={inp} placeholder="Nome do responsável" />
              </div>
              <div>
                <label style={lbl}>Tipo / Cargo</label>
                <select value={form.tipo_inscricao ?? ''} onChange={e => set('tipo_inscricao', e.target.value)} style={{ ...inp, background: '#fff' }}>
                  <option value="">Selecione...</option>
                  {['Gestor de escola','Gestora de escola','Diretor de escola','Diretora de escola','Mantenedor de escola','Mantenedora de escola','Coordenador de escola','Coordenadora de escola','Professor de outra Instituição de Ensino','Pai/Mãe de Escola parceira We Make','Colaborador do Sistema Cidade Viva','Outro'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Cargo (detalhado)</label>
                <input value={form.cargo ?? ''} onChange={e => set('cargo', e.target.value)} style={inp} placeholder="Ex: Diretor Pedagógico" />
              </div>
              <div>
                <label style={lbl}>E-mail</label>
                <input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} style={inp} placeholder="email@escola.com.br" />
              </div>
              <div>
                <label style={lbl}>Telefone / WhatsApp</label>
                <input value={form.tel_celular ?? ''} onChange={e => set('tel_celular', e.target.value)} style={inp} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label style={lbl}>Telefone Fixo</label>
                <input value={form.tel_fixo ?? ''} onChange={e => set('tel_fixo', e.target.value)} style={inp} placeholder="(00) 0000-0000" />
              </div>
            </div>
          </div>

          {/* ── Escola / Instituição ── */}
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2563eb', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.6rem', paddingBottom: '.4rem', borderBottom: '2px solid #bfdbfe' }}>
              Escola / Instituição
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>Nome da Escola / Instituição</label>
                <input value={form.escola_nome ?? ''} onChange={e => set('escola_nome', e.target.value)} style={inp} placeholder="Nome completo da escola" />
              </div>
              <div>
                <label style={lbl}>CNPJ</label>
                <input value={form.escola_cnpj ?? ''} onChange={e => set('escola_cnpj', e.target.value)} style={inp} placeholder="00.000.000/0001-00" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.5rem' }}>
                <div>
                  <label style={lbl}>Cidade</label>
                  <input value={form.cidade ?? ''} onChange={e => set('cidade', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>UF</label>
                  <input value={form.uf ?? ''} onChange={e => set('uf', e.target.value)} maxLength={2} style={{ ...inp, width: 60, textTransform: 'uppercase' }} placeholder="SP" />
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>Endereço</label>
                <input value={form.endereco ?? ''} onChange={e => set('endereco', e.target.value)} style={inp} placeholder="Rua, número" />
              </div>
              <div>
                <label style={lbl}>Bairro</label>
                <input value={form.bairro ?? ''} onChange={e => set('bairro', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>CEP</label>
                <input value={form.cep ?? ''} onChange={e => set('cep', e.target.value)} style={inp} placeholder="00000-000" />
              </div>
            </div>
          </div>

          {/* ── Alunos por segmento ── */}
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.6rem', paddingBottom: '.4rem', borderBottom: '2px solid #86efac' }}>
              Quantidade de Alunos por Segmento
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
              {[
                { campo: 'qtd_infantil', label: 'Ed. Infantil', cor: '#f97316', bg: '#fff7ed' },
                { campo: 'qtd_fund1',    label: 'Fund. I',      cor: '#2563eb', bg: '#eff6ff' },
                { campo: 'qtd_fund2',    label: 'Fund. II',     cor: '#7c3aed', bg: '#f5f3ff' },
                { campo: 'qtd_medio',    label: 'Ens. Médio',   cor: '#dc2626', bg: '#fef2f2' },
              ].map(seg => (
                <div key={seg.campo} style={{ background: seg.bg, border: `1px solid ${seg.cor}30`, borderRadius: 10, padding: '.65rem .75rem', textAlign: 'center' }}>
                  <label style={{ ...lbl, color: seg.cor, textAlign: 'center', display: 'block', marginBottom: '.35rem' }}>{seg.label}</label>
                  <input
                    type="number" min="0"
                    value={(form as any)[seg.campo] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [seg.campo]: parseInt(e.target.value) || 0 }))}
                    style={{ ...inp, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 800, padding: '.45rem', background: '#fff' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.6rem .9rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

          <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '.7rem', borderRadius: 9999, border: 'none', background: saving ? '#e2e8f0' : 'linear-gradient(135deg, #4A7FDB, #2563b8)', color: saving ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '.875rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: saving ? 'none' : '0 4px 14px rgba(74,127,219,.35)' }}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button onClick={onClose} style={{ padding: '.7rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal de e-mail ───────────────────────────────────────────
function ModalEmail({ destinatarios, onClose }: {
  destinatarios: { email: string; nome: string | null }[]
  onClose: () => void
}) {
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo]     = useState('')
  const [isHtml, setIsHtml]   = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro]       = useState('')

  async function handleEnviar() {
    if (!assunto.trim()) { setErro('Informe o assunto'); return }
    if (!corpo.trim())   { setErro('Informe o corpo do e-mail'); return }
    setEnviando(true); setErro('')
    const res = await fetch('/api/enviar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatarios, assunto, corpo, isHtml }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error ?? 'Erro ao enviar'); setEnviando(false); return }
    setResultado(data); setEnviando(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '1.1rem 1.5rem', borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '.58rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>
              Enviar E-mail
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {destinatarios.length} destinatário{destinatarios.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {resultado ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>
                {resultado.erros?.length === 0 ? '✅' : '⚠️'}
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>
                {resultado.enviados} e-mail{resultado.enviados !== 1 ? 's' : ''} enviado{resultado.enviados !== 1 ? 's' : ''}
              </div>
              {resultado.erros?.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.75rem', fontSize: '.75rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)', textAlign: 'left', marginTop: '.5rem' }}>
                  <strong>Erros:</strong><br />
                  {resultado.erros.slice(0, 5).join('\n')}
                </div>
              )}
              <button onClick={onClose} style={{ marginTop: '1rem', padding: '.65rem 2rem', borderRadius: 9999, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Fechar</button>
            </div>
          ) : (
            <>
              {/* Destinatários */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.75rem 1rem', maxHeight: 100, overflowY: 'auto' }}>
                <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Para:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
                  {destinatarios.map(d => (
                    <span key={d.email} style={{ fontSize: '.68rem', background: '#e2e8f0', color: '#334155', padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {d.nome ? `${d.nome} <${d.email}>` : d.email}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assunto */}
              <div>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Assunto *</label>
                <input value={assunto} onChange={e => setAssunto(e.target.value)} style={inp} placeholder="Ex: Apresentação do Parceria Educacional — We Make Education" />
              </div>

              {/* Toggle HTML/Texto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.78rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  <input type="checkbox" checked={isHtml} onChange={e => setIsHtml(e.target.checked)} style={{ accentColor: '#4A7FDB' }} />
                  Formato HTML
                </label>
                {isHtml && (
                  <span style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    Use {'{{nome}}'} para personalizar com o nome do destinatário
                  </span>
                )}
              </div>

              {/* Corpo */}
              <div>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                  {isHtml ? 'Corpo (HTML)' : 'Mensagem'} *
                </label>
                <textarea
                  value={corpo}
                  onChange={e => setCorpo(e.target.value)}
                  rows={isHtml ? 14 : 8}
                  placeholder={isHtml
                    ? '<h2>Olá {{nome}},</h2>\n<p>Somos a We Make...</p>'
                    : 'Olá {{nome}},\n\nGostaríamos de apresentar...'
                  }
                  style={{ ...inp, resize: 'vertical', fontFamily: isHtml ? 'monospace' : 'var(--font-inter,sans-serif)', fontSize: isHtml ? '.78rem' : '.82rem', lineHeight: 1.7 }}
                />
                {!isHtml && (
                  <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.3rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    Use {'{{nome}}'} para personalizar · Ex: "Olá {'{{nome}}'}, gostaríamos de..."
                  </div>
                )}
              </div>

              {/* Templates rápidos */}
              <div>
                <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Templates rápidos:</div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Apresentação', assunto: 'Apresentação We Make Education — Parceria Educacional', corpo: `Olá {{nome}},\n\nMeu nome é da equipe comercial da We Make.\n\nGostaríamos de apresentar o Parceria Educacional, nosso sistema de ensino cristão clássico que já transforma a educação em diversas escolas parceiras.\n\nPodemos agendar uma conversa para apresentar nossa proposta?\n\nAtenciosamente,\nEquipe Comercial We Make Education` },
                    { label: 'Follow-up', assunto: 'Retomando contato — We Make Education', corpo: `Olá {{nome}},\n\nEstou retomando nosso contato para saber se teria interesse em conhecer mais sobre o Parceria Educacional.\n\nFico à disposição!\n\nAtenciosamente,\nEquipe Comercial We Make Education` },
                    { label: 'Demo Paideia', assunto: 'Acesso à plataforma de demonstração — Parceria Educacional', corpo: `Olá {{nome}},\n\nSegue o acesso à nossa plataforma de demonstração do Parceria Educacional:\n\n🔗 Link: https://hub.cidadeviva.education/hub/login?t=professor\n📧 Login: demonstracao.plataforma.paideia@cidadeviva.org\n🔑 Senha: 12345678\n\n⏱ Disponível por 48 horas.\n\nQualquer dúvida, estou à disposição!\n\nAtenciosamente,\nEquipe Comercial We Make Education` },
                  ].map(t => (
                    <button key={t.label} onClick={() => { setAssunto(t.assunto); setCorpo(t.corpo); setIsHtml(false) }}
                      style={{ padding: '.3rem .75rem', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {erro && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.65rem .9rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>{erro}</div>}

              <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
                <button onClick={handleEnviar} disabled={enviando} style={{ flex: 1, padding: '.75rem', borderRadius: 9999, border: 'none', background: enviando ? '#e2e8f0' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: enviando ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '.875rem', cursor: enviando ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: enviando ? 'none' : '0 4px 14px rgba(37,99,235,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                  {enviando ? (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Enviando...</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Enviar para {destinatarios.length} destinatário{destinatarios.length !== 1 ? 's' : ''}</>
                  )}
                </button>
                <button onClick={onClose} style={{ padding: '.75rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Cancelar</button>
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export function LeadsTable({ leads: initialLeads, total, pagina, totalPaginas, q, fonte, tipo, uf }: Props) {
  const [leads, setLeads]           = useState<Lead[]>(initialLeads)
  const [editando, setEditando]     = useState<Lead | null>(null)
  const [deletando, setDeletando]   = useState<string | null>(null)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [modalEmail, setModalEmail] = useState<{ email: string; nome: string | null }[] | null>(null)

  const fonteInfo = (f: string) => FONTE_COR[f] ?? FONTE_COR.outro

  // Seleção
  function toggleSelecionar(id: string) {
    setSelecionados(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function selecionarTodos() {
    const comEmail = leads.filter(l => l.email).map(l => l.id)
    setSelecionados(prev => prev.size === comEmail.length ? new Set() : new Set(comEmail))
  }

  // Destinatários para e-mail em massa
  function abrirEmailMassa() {
    const dest = leads
      .filter(l => selecionados.has(l.id) && l.email)
      .map(l => ({ email: l.email!, nome: l.nome }))
    if (dest.length === 0) { alert('Nenhum lead selecionado com e-mail'); return }
    setModalEmail(dest)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o lead "${nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(id)
    const res = await fetch(`/api/leads-universal?id=${id}`, { method: 'DELETE' })
    if (res.ok) setLeads(prev => prev.filter(l => l.id !== id))
    setDeletando(null)
  }

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ q, fonte, tipo, uf, pagina: String(pagina), ...params })
    return `/leads-banco?${p.toString()}`
  }

  const fmtTel = (t: string | null) => t ? t.replace(/\D/g, '') : ''

  const leadsComEmail = leads.filter(l => l.email)
  const todosSelecionados = leadsComEmail.length > 0 && leadsComEmail.every(l => selecionados.has(l.id))

  return (
    <div>
      {/* ── Barra de seleção em massa ─── */}
      {selecionados.size > 0 && (
        <div style={{ background: '#0f172a', borderRadius: 12, padding: '.75rem 1.25rem', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            {selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}
          </span>
          <button onClick={abrirEmailMassa} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.4rem 1rem', borderRadius: 7, border: 'none', background: '#2563eb', color: '#fff', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Enviar E-mail para {leads.filter(l => selecionados.has(l.id) && l.email).length} com e-mail
          </button>
          <button onClick={() => setSelecionados(new Set())} style={{ padding: '.4rem .85rem', borderRadius: 7, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: '.72rem', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Limpar seleção
          </button>
        </div>
      )}

      {/* ── Tabela ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.05)' }}>
        {/* Header da tabela */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {/* Checkbox selecionar todos */}
                <th style={{ padding: '.65rem .75rem', width: 36 }}>
                  <input type="checkbox" checked={todosSelecionados} onChange={selecionarTodos}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#4A7FDB' }}
                    title="Selecionar todos com e-mail" />
                </th>
                {['#', 'Nome', 'Tipo / Cargo', 'Escola', 'Contato', 'Cidade/UF', 'Fonte', 'Ações'].map((col, i) => (
                  <th key={col} style={{
                    padding: '.65rem .9rem', textAlign: i === 0 ? 'center' : 'left',
                    fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.07em', color: 'rgba(255,255,255,.6)',
                    whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', fontSize: '.875rem' }}>
                    Nenhum lead encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : leads.map((lead, idx) => {
                const fi   = fonteInfo(lead.fonte)
                const tc   = TIPO_COR(lead.tipo_inscricao)
                const isD  = TIPO_DECISOR(lead.tipo_inscricao)
                const tel  = fmtTel(lead.tel_celular)
                const isDel = deletando === lead.id

                const isSel = selecionados.has(lead.id)

                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSel ? '#fffbeb' : idx % 2 === 0 ? '#fff' : '#fafafa', opacity: isDel ? 0.4 : 1, transition: 'all .1s' }}>

                    {/* Checkbox */}
                    <td style={{ padding: '.7rem .75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {lead.email ? (
                        <input type="checkbox" checked={isSel} onChange={() => toggleSelecionar(lead.id)}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#4A7FDB' }} />
                      ) : (
                        <span style={{ color: '#e2e8f0', fontSize: '.6rem' }}>—</span>
                      )}
                    </td>

                    {/* Nº */}
                    <td style={{ padding: '.7rem .9rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '.65rem', fontWeight: 700, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {(pagina - 1) * 50 + idx + 1}
                      </div>
                    </td>

                    {/* Nome */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle', maxWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {lead.nome ?? <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontWeight: 400 }}>Sem nome</span>}
                      </div>
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle', maxWidth: 160 }}>
                      {lead.tipo_inscricao ? (
                        <span style={{ fontSize: '.62rem', fontWeight: isD ? 700 : 500, background: isD ? tc + '12' : '#f8fafc', color: tc, border: `1px solid ${tc}30`, padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isD && <span style={{ marginRight: '.2rem' }}>★</span>}
                          {lead.tipo_inscricao.length > 28 ? lead.tipo_inscricao.slice(0, 28) + '…' : lead.tipo_inscricao}
                        </span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '.72rem' }}>—</span>}
                    </td>

                    {/* Escola */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle', maxWidth: 160 }}>
                      <div style={{ fontSize: '.75rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {lead.escola_nome ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    </td>

                    {/* Contato */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} style={{ fontSize: '.68rem', color: '#2563eb', textDecoration: 'none', fontFamily: 'var(--font-inter,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, display: 'block' }}>
                            {lead.email}
                          </a>
                        )}
                        {lead.tel_celular && (
                          <span style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {lead.tel_celular}
                          </span>
                        )}
                        {!lead.email && !lead.tel_celular && <span style={{ color: '#cbd5e1', fontSize: '.72rem' }}>—</span>}
                      </div>
                    </td>

                    {/* Cidade/UF */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {lead.cidade ?? ''}{lead.cidade && lead.uf ? '/' : ''}{lead.uf ?? ''}
                        {!lead.cidade && !lead.uf && <span style={{ color: '#cbd5e1' }}>—</span>}
                      </span>
                    </td>

                    {/* Fonte */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '.6rem', fontWeight: 700, background: fi.bg, color: fi.cor, border: `1px solid ${fi.border}`, padding: '.15rem .5rem', borderRadius: 99, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap' }}>
                        {fi.label}
                      </span>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '.7rem .9rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>

                        {/* Editar */}
                        <button onClick={() => setEditando(lead)} title="Editar lead" style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>

                        {/* Email — abre modal de envio */}
                        {lead.email && (
                          <button onClick={() => setModalEmail([{ email: lead.email!, nome: lead.nome }])}
                            title={`Enviar e-mail para ${lead.email}`}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          </button>
                        )}

                        {/* WhatsApp */}
                        {tel.length >= 10 && (
                          <a href={`https://wa.me/55${tel}`} target="_blank" rel="noopener noreferrer" title={`WhatsApp: ${lead.tel_celular}`} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #86efac', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          </a>
                        )}

                        {/* Excluir */}
                        <button onClick={() => handleDelete(lead.id, lead.nome ?? 'este lead')} disabled={isDel} title="Excluir lead" style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: isDel ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: isDel ? 0.5 : 1 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>

                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer com paginação, total e exportação */}
        <div style={{ padding: '.85rem 1.25rem', background: '#fafafa', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '.72rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
              Mostrando <strong style={{ color: '#0f172a' }}>{leads.length}</strong> de <strong style={{ color: '#0f172a' }}>{total.toLocaleString('pt-BR')}</strong> leads
              {pagina > 1 && <> · Página {pagina} de {totalPaginas}</>}
            </div>
            {/* Botão download inline */}
            <a
              href={`/api/leads-export?q=${encodeURIComponent(q)}&fonte=${fonte}&tipo=${tipo}&uf=${uf}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                padding: '.3rem .75rem', borderRadius: 7,
                border: '1.5px solid #86efac', background: '#f0fdf4',
                color: '#16a34a', textDecoration: 'none',
                fontSize: '.68rem', fontWeight: 700,
                fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
              }}
              title={`Exportar ${total.toLocaleString('pt-BR')} registros para Excel`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar {total.toLocaleString('pt-BR')} registros (.xlsx)
            </a>
          </div>
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
              {pagina > 1 && (
                <a href={buildUrl({ pagina: String(pagina - 1) })} style={{ padding: '.35rem .75rem', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '.72rem', color: '#475569', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                  ← Anterior
                </a>
              )}
              {/* Números de páginas */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                const p = Math.max(1, Math.min(pagina - 2, totalPaginas - 4)) + i
                if (p < 1 || p > totalPaginas) return null
                return (
                  <a key={p} href={buildUrl({ pagina: String(p) })} style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${pagina === p ? '#4A7FDB' : '#e2e8f0'}`, background: pagina === p ? '#4A7FDB' : '#fff', color: pagina === p ? '#fff' : '#475569', fontSize: '.72rem', fontWeight: pagina === p ? 700 : 400, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p}
                  </a>
                )
              })}
              {pagina < totalPaginas && (
                <a href={buildUrl({ pagina: String(pagina + 1) })} style={{ padding: '.35rem .75rem', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '.72rem', color: '#475569', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>
                  Próxima →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editando && (
        <ModalEditar
          lead={editando}
          onClose={() => setEditando(null)}
          onSaved={updated => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))}
        />
      )}

      {/* Modal de e-mail */}
      {modalEmail && (
        <ModalEmail
          destinatarios={modalEmail}
          onClose={() => setModalEmail(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

