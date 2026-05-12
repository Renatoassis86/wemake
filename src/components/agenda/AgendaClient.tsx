'use client'

import { useState, useCallback } from 'react'
import { criarEvento, editarEvento, deletarEvento } from './agenda-actions'

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Participante {
  id: string
  profile_id: string | null
  email: string
  nome: string | null
  status: 'pendente' | 'aceito' | 'recusado' | 'talvez'
}

interface Evento {
  id: string
  titulo: string
  descricao: string | null
  local: string | null
  tipo: string
  cor: string
  data_inicio: string
  data_fim: string
  dia_inteiro: boolean
  escola_id: string | null
  escola?: { nome: string } | null
  criado_por: string
  recorrencia?: string | null
  participantes: Participante[]
}

interface Profile { id: string; email: string; full_name: string }

interface Props {
  eventos: Evento[]
  profiles: Profile[]
  userId: string
  userEmail: string
  escolas: { id: string; nome: string }[]
}

// ── Constantes ─────────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DIAS_SEMANA_FULL  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const HORAS = Array.from({ length: 24 }, (_, i) => i)

const TIPOS = [
  { value: 'reuniao',   label: 'Reunião',         cor: '#2563eb' },
  { value: 'ligacao',   label: 'Ligação',          cor: '#7c3aed' },
  { value: 'visita',    label: 'Visita Presencial', cor: '#d97706' },
  { value: 'interno',   label: 'Interno We Make',      cor: '#16a34a' },
  { value: 'outro',     label: 'Outro',            cor: '#64748b' },
]

const CORES = ['#2563eb','#7c3aed','#d97706','#16a34a','#dc2626','#0891b2','#db2777','#ea580c','#64748b']

// ── Helpers ────────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }
function isoDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function isoTime(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

function fmtHora(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtDataCurta(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`
}
function fmtDataLonga(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function diasNoMes(ano: number, mes: number) { return new Date(ano, mes + 1, 0).getDate() }
function primeiroDiaSemana(ano: number, mes: number) { return new Date(ano, mes, 1).getDay() }

function eventosNoDia(eventos: Evento[], ano: number, mes: number, dia: number) {
  const alvo = `${ano}-${pad(mes+1)}-${pad(dia)}`
  return eventos.filter(e => {
    const di = e.data_inicio.slice(0, 10)
    const df = e.data_fim.slice(0, 10)
    return di <= alvo && alvo <= df
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'aceito':   return { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' }
    case 'recusado': return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' }
    case 'talvez':   return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
    default:         return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
  }
}

// ── Modal de criação/edição ────────────────────────────────────────────────────
function ModalEvento({
  onClose, profiles, escolas, userId, userEmail,
  diaInicial, eventoEditar,
}: {
  onClose: (atualizar?: boolean) => void
  profiles: Profile[]
  escolas: { id: string; nome: string }[]
  userId: string
  userEmail: string
  diaInicial?: string
  eventoEditar?: Evento
}) {
  const isEdicao = !!eventoEditar
  const hoje = isoDate(new Date())
  const e = eventoEditar

  const [titulo,      setTitulo]      = useState(e?.titulo ?? '')
  const [descricao,   setDescricao]   = useState(e?.descricao ?? '')
  const [local,       setLocal]       = useState(e?.local ?? '')
  const [tipo,        setTipo]        = useState(e?.tipo ?? 'reuniao')
  const [cor,         setCor]         = useState(e?.cor ?? '#2563eb')
  const [dataInicio,  setDataInicio]  = useState(e ? e.data_inicio.slice(0,10) : (diaInicial ?? hoje))
  const [dataFim,     setDataFim]     = useState(e ? e.data_fim.slice(0,10) : (diaInicial ?? hoje))
  const [horaInicio,  setHoraInicio]  = useState(e && !e.dia_inteiro ? fmtHora(e.data_inicio) : '09:00')
  const [horaFim,     setHoraFim]     = useState(e && !e.dia_inteiro ? fmtHora(e.data_fim) : '10:00')
  const [diaInteiro,  setDiaInteiro]  = useState(e?.dia_inteiro ?? false)
  const [escolaId,    setEscolaId]    = useState(e?.escola_id ?? '')
  const [recorrencia, setRecorrencia] = useState(e?.recorrencia ?? '')

  const jaConvidados = e?.participantes.map(p => p.email).filter(em => em !== userEmail) ?? []
  const [emailInput,  setEmailInput]  = useState('')
  const [convidados,  setConvidados]  = useState<string[]>(jaConvidados)
  const [sugestoes,   setSugestoes]   = useState<Profile[]>([])
  const [saving,      setSaving]      = useState(false)
  const [erro,        setErro]        = useState('')

  function handleEmailInput(val: string) {
    setEmailInput(val)
    if (val.length >= 2) {
      setSugestoes(profiles.filter(p =>
        (p.email.includes(val) || p.full_name.toLowerCase().includes(val.toLowerCase()))
        && p.email !== userEmail
        && !convidados.includes(p.email)
      ).slice(0, 5))
    } else setSugestoes([])
  }

  function adicionarConvidado(email: string) {
    if (!email || convidados.includes(email)) return
    setConvidados(prev => [...prev, email])
    setEmailInput('')
    setSugestoes([])
  }

  function removerConvidado(email: string) {
    setConvidados(prev => prev.filter(e => e !== email))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!titulo.trim()) { setErro('Título é obrigatório'); return }
    setSaving(true); setErro('')

    const fd = new FormData()
    fd.set('titulo', titulo)
    fd.set('descricao', descricao)
    fd.set('local', local)
    fd.set('tipo', tipo)
    fd.set('cor', cor)
    fd.set('data_inicio', dataInicio)
    fd.set('data_fim', dataFim || dataInicio)
    fd.set('hora_inicio', horaInicio)
    fd.set('hora_fim', horaFim)
    fd.set('dia_inteiro', String(diaInteiro))
    fd.set('escola_id', escolaId)
    fd.set('recorrencia', recorrencia)
    fd.set('participantes', JSON.stringify(convidados))

    const result = isEdicao
      ? await editarEvento(eventoEditar!.id, fd)
      : await criarEvento(fd)

    if (result.success) { onClose(true) }
    else { setErro(result.error ?? 'Erro ao salvar'); setSaving(false) }
  }

  const tipoAtual = TIPOS.find(t => t.value === tipo)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 600,
        maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: '18px 18px 0 0',
        }}>
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#d97706', marginBottom: '.25rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              ✦ {isEdicao ? 'Editar Evento' : 'Novo Evento'}
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
              {isEdicao ? eventoEditar!.titulo : 'Agendar Reunião'}
            </div>
          </div>
          <button onClick={() => onClose()} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)',
            background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Título */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Título da Reunião *
            </label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required
              placeholder="Ex: Reunião Escola Jardim das Flores"
              style={{ width: '100%', padding: '.7rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
          </div>

          {/* Tipo + Cor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Tipo
              </label>
              <select value={tipo} onChange={e => { setTipo(e.target.value); setCor(TIPOS.find(t => t.value === e.target.value)?.cor ?? cor) }}
                style={{ width: '100%', padding: '.7rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#fff', color: '#0f172a' }}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Cor</label>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', maxWidth: 160 }}>
                {CORES.map(c => (
                  <button key={c} type="button" onClick={() => setCor(c)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: cor === c ? '3px solid #0f172a' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Data/Hora */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.6rem' }}>
              <label style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Data e Hora</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.35rem', cursor: 'pointer', fontSize: '.75rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                <input type="checkbox" checked={diaInteiro} onChange={e => setDiaInteiro(e.target.checked)} style={{ accentColor: '#d97706' }} />
                Dia inteiro
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: diaInteiro ? '1fr 1fr' : '1fr auto 1fr auto', gap: '.75rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '.65rem', color: '#475569', marginBottom: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Início</div>
                <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); if (e.target.value > dataFim) setDataFim(e.target.value) }}
                  style={{ width: '100%', padding: '.6rem .8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {!diaInteiro && (
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                  style={{ padding: '.6rem .8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', marginTop: '1.1rem' }} />
              )}
              <div>
                <div style={{ fontSize: '.65rem', color: '#475569', marginBottom: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Fim</div>
                <input type="date" value={dataFim} min={dataInicio} onChange={e => setDataFim(e.target.value)}
                  style={{ width: '100%', padding: '.6rem .8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {!diaInteiro && (
                <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)}
                  style={{ padding: '.6rem .8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', marginTop: '1.1rem' }} />
              )}
            </div>
          </div>

          {/* Local / Link Meet */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Local / Link da Reunião
            </label>
            <div style={{ position: 'relative' }}>
              <input value={local} onChange={e => setLocal(e.target.value)}
                placeholder="Endereço físico ou link do Google Meet / Zoom"
                style={{ width: '100%', padding: '.7rem .9rem .7rem 2.5rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
              <div style={{ position: 'absolute', left: '.8rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                {local.startsWith('http') ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                )}
              </div>
            </div>
            {local.startsWith('http') && (
              <a href={local} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '.7rem', color: '#2563eb', textDecoration: 'none', marginTop: '.3rem', display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Abrir link
              </a>
            )}
          </div>

          {/* Escola */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Escola Relacionada (opcional)
            </label>
            <select value={escolaId} onChange={e => setEscolaId(e.target.value)}
              style={{ width: '100%', padding: '.7rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#fff', color: '#0f172a' }}>
              <option value="">— Nenhuma escola —</option>
              {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>

          {/* Participantes */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Convidar Participantes
            </label>

            {/* Você (organizador) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .65rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, marginBottom: '.5rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                {userEmail[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: '.78rem', color: '#15803d', fontFamily: 'var(--font-inter,sans-serif)' }}>{userEmail}</span>
              <span style={{ fontSize: '.62rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Organizador</span>
            </div>

            {/* Input de busca */}
            <div style={{ position: 'relative' }}>
              <input value={emailInput} onChange={e => handleEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarConvidado(emailInput) } }}
                placeholder="Buscar por nome ou e-mail..."
                style={{ width: '100%', padding: '.65rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', boxSizing: 'border-box' }} />
              {sugestoes.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 10, overflow: 'hidden', marginTop: 2 }}>
                  {sugestoes.map(p => (
                    <div key={p.id} onClick={() => adicionarConvidado(p.email)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.55rem .8rem', cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                        {p.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)' }}>{p.full_name}</div>
                        <div style={{ fontSize: '.68rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de convidados */}
            {convidados.length > 0 && (
              <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {convidados.map(email => {
                  const p = profiles.find(pr => pr.email === email)
                  return (
                    <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '.65rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                        {email[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        {p && <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.2 }}>{p.full_name}</div>}
                        <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>{email}</div>
                      </div>
                      <button type="button" onClick={() => removerConvidado(email)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '.2rem', display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Observações / Pauta
            </label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
              placeholder="Pauta da reunião, objetivos, materiais necessários..."
              style={{ width: '100%', padding: '.7rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', color: '#0f172a' }} />
          </div>

          {/* Recorrência */}
          <div>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.35rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Recorrência
            </label>
            <select value={recorrencia} onChange={e => setRecorrencia(e.target.value)}
              style={{ width: '100%', padding: '.7rem .9rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.875rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#fff', color: '#0f172a' }}>
              <option value="">Não se repete</option>
              <option value="diario">Diariamente</option>
              <option value="semanal">Semanalmente</option>
              <option value="mensal">Mensalmente</option>
            </select>
          </div>

          {erro && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.6rem .9rem', fontSize: '.78rem', color: '#dc2626', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {erro}
            </div>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '.75rem', borderRadius: 9999, border: 'none',
              background: saving ? '#e2e8f0' : `linear-gradient(135deg, ${cor}, ${cor}dd)`,
              color: saving ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '.875rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: saving ? 'none' : `0 4px 14px ${cor}55`,
            }}>
              {saving ? 'Salvando...' : (isEdicao ? 'Salvar Alterações' : 'Criar Evento')}
            </button>
            <button type="button" onClick={() => onClose()} style={{
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
  )
}

// ── Modal detalhes do evento ───────────────────────────────────────────────────
function ModalDetalhes({
  evento, onClose, onEditar, onDeletar, userId,
}: {
  evento: Evento
  onClose: () => void
  onEditar: () => void
  onDeletar: () => void
  userId: string
}) {
  const isCriador = evento.criado_por === userId
  const tipoInfo = TIPOS.find(t => t.value === evento.tipo)
  const inicio = new Date(evento.data_inicio)
  const fim    = new Date(evento.data_fim)
  const isMeet = evento.local?.startsWith('http')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,.18)', overflow: 'hidden',
      }}>
        {/* Header colorido */}
        <div style={{
          background: evento.cor, padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '.62rem', fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              {tipoInfo?.label}
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              {evento.titulo}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {isCriador && (
              <button onClick={onEditar} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Data/hora */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: '.85rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div>
              <div style={{ fontWeight: 600 }}>
                {evento.dia_inteiro
                  ? `${fmtDataCurta(evento.data_inicio)} — Dia inteiro`
                  : `${fmtDataCurta(evento.data_inicio)} · ${fmtHora(evento.data_inicio)} – ${fmtHora(evento.data_fim)}`
                }
              </div>
              <div style={{ fontSize: '.72rem', color: '#475569', textTransform: 'capitalize' }}>
                {fmtDataLonga(evento.data_inicio)}
              </div>
            </div>
          </div>

          {/* Local */}
          {evento.local && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem', fontSize: '.85rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)' }}>
              {isMeet
                ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              }
              {isMeet
                ? <a href={evento.local} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Entrar na Reunião Online</a>
                : <span>{evento.local}</span>
              }
            </div>
          )}

          {/* Escola */}
          {evento.escola && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: '.85rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              <span style={{ fontWeight: 600 }}>{evento.escola.nome}</span>
            </div>
          )}

          {/* Descrição */}
          {evento.descricao && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.82rem', color: '#334155', lineHeight: 1.6, fontFamily: 'var(--font-inter,sans-serif)' }}>
              {evento.descricao}
            </div>
          )}

          {/* Participantes */}
          {evento.participantes.length > 0 && (
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', marginBottom: '.5rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                Participantes ({evento.participantes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {evento.participantes.map(p => {
                  const s = getStatusColor(p.status)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .65rem', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.65rem', fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {p.email[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        {p.nome && <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)' }}>{p.nome}</div>}
                        <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>{p.email}</div>
                      </div>
                      <span style={{ fontSize: '.62rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ações do criador */}
          {isCriador && (
            <div style={{ display: 'flex', gap: '.5rem', paddingTop: '.25rem', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={onEditar} style={{
                flex: 1, padding: '.6rem', borderRadius: 9999, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#475569', fontWeight: 600, fontSize: '.82rem',
                cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                Editar Evento
              </button>
              <button onClick={onDeletar} style={{
                padding: '.6rem 1.25rem', borderRadius: 9999, border: '1.5px solid #fca5a5',
                background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '.82rem',
                cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export function AgendaClient({ eventos: eventosIniciais, profiles, userId, userEmail, escolas }: Props) {
  const hoje = new Date()
  const [ano,      setAno]      = useState(hoje.getFullYear())
  const [mes,      setMes]      = useState(hoje.getMonth())
  const [view,     setView]     = useState<'mes' | 'semana' | 'lista'>('mes')
  const [eventos,  setEventos]  = useState<Evento[]>(eventosIniciais)
  const [modalCriar,   setModalCriar]   = useState(false)
  const [diaClicado,   setDiaClicado]   = useState<string | undefined>()
  const [eventoAtivo,  setEventoAtivo]  = useState<Evento | null>(null)
  const [eventoEditar, setEventoEditar] = useState<Evento | null>(null)

  const navMes = useCallback((dir: number) => {
    setMes(m => {
      let nm = m + dir
      if (nm < 0)  { setAno(a => a - 1); return 11 }
      if (nm > 11) { setAno(a => a + 1); return 0 }
      return nm
    })
  }, [])

  async function handleFecharModal(atualizar?: boolean) {
    setModalCriar(false); setDiaClicado(undefined); setEventoEditar(null)
    if (atualizar) window.location.reload()
  }

  async function handleDeletar() {
    if (!eventoAtivo) return
    if (!confirm('Excluir este evento? Esta ação não pode ser desfeita.')) return
    await deletarEvento(eventoAtivo.id)
    setEventoAtivo(null)
    window.location.reload()
  }

  const totalDias = diasNoMes(ano, mes)
  const priDia    = primeiroDiaSemana(ano, mes)
  const celulas   = Array.from({ length: priDia + totalDias }, (_, i) =>
    i < priDia ? null : i - priDia + 1
  )
  while (celulas.length % 7 !== 0) celulas.push(null)

  const eventosMes = eventos.filter(e => {
    const d = new Date(e.data_inicio)
    return d.getFullYear() === ano && d.getMonth() === mes
  })

  // Vista de lista — próximos 60 dias
  const eventosLista = eventos
    .filter(e => new Date(e.data_fim) >= hoje)
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
    .slice(0, 50)

  // Agrupar por data para lista
  const gruposLista: { data: string; evts: Evento[] }[] = []
  eventosLista.forEach(e => {
    const key = e.data_inicio.slice(0, 10)
    const g = gruposLista.find(g => g.data === key)
    if (g) g.evts.push(e)
    else gruposLista.push({ data: key, evts: [e] })
  })

  const todayStr = isoDate(hoje)

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #e2e8f0',
        gap: '1rem', flexWrap: 'wrap',
      }}>
        {/* Nav mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <button onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()) }}
            style={{ padding: '.4rem .85rem', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Hoje
          </button>
          <button onClick={() => navMes(-1)} style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => navMes(1)} style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <h2 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', minWidth: 200 }}>
            {MESES[mes]} {ano}
          </h2>
        </div>

        {/* View switcher + novo evento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
            {(['mes','semana','lista'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '.35rem .8rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#0f172a' : '#64748b',
                fontWeight: view === v ? 700 : 500, fontSize: '.72rem',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'capitalize',
                transition: 'all .15s',
              }}>{v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : 'Lista'}</button>
            ))}
          </div>
          <button onClick={() => setModalCriar(true)} style={{
            display: 'flex', alignItems: 'center', gap: '.4rem',
            padding: '.5rem 1.1rem', borderRadius: 9999, border: 'none',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
            fontFamily: 'var(--font-montserrat,sans-serif)',
            boxShadow: '0 4px 14px rgba(217,119,6,.35)',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Evento
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>

        {/* ── Vista Mês ───────────────────────────────────── */}
        {view === 'mes' && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
            {/* Header dos dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #e2e8f0' }}>
              {DIAS_SEMANA_ABREV.map((d, i) => (
                <div key={d} style={{
                  padding: '.6rem', textAlign: 'center',
                  fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                  color: i === 0 || i === 6 ? '#94a3b8' : '#64748b',
                  fontFamily: 'var(--font-montserrat,sans-serif)',
                  background: '#fafafa',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {celulas.map((dia, idx) => {
                if (dia === null) {
                  return <div key={`empty-${idx}`} style={{ minHeight: 110, background: '#fafafa', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
                }
                const dStr = `${ano}-${pad(mes+1)}-${pad(dia)}`
                const isHoje = dStr === todayStr
                const isWeekend = new Date(dStr).getDay() === 0 || new Date(dStr).getDay() === 6
                const evtsdia = eventosNoDia(eventos, ano, mes, dia)

                return (
                  <div key={dia}
                    onClick={() => { setDiaClicado(dStr); setModalCriar(true) }}
                    style={{
                      minHeight: 110, padding: '.5rem .4rem',
                      borderRight: '1px solid #f1f5f9',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer', transition: 'background .1s',
                      background: isHoje ? '#fffbeb' : isWeekend ? '#fafafa' : '#fff',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isHoje ? '#fef3c7' : '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = isHoje ? '#fffbeb' : isWeekend ? '#fafafa' : '#fff'}
                  >
                    {/* Número do dia */}
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', marginBottom: '.3rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isHoje ? '#d97706' : 'transparent',
                      color: isHoje ? '#fff' : isWeekend ? '#94a3b8' : '#334155',
                      fontSize: '.78rem', fontWeight: isHoje ? 700 : 500,
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                    }}>
                      {dia}
                    </div>

                    {/* Eventos do dia */}
                    {evtsdia.slice(0, 3).map(ev => (
                      <div key={ev.id}
                        onClick={e => { e.stopPropagation(); setEventoAtivo(ev) }}
                        style={{
                          background: ev.cor + '18', borderLeft: `3px solid ${ev.cor}`,
                          borderRadius: '0 5px 5px 0', padding: '.2rem .4rem',
                          marginBottom: '.2rem', cursor: 'pointer',
                          transition: 'opacity .1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {/* Hora + título */}
                        <div style={{ fontSize: '.62rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {!ev.dia_inteiro && <span style={{ color: ev.cor, marginRight: '.2rem' }}>{fmtHora(ev.data_inicio)}</span>}
                          {ev.titulo}
                        </div>
                        {/* Avatares dos participantes */}
                        {ev.participantes.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.15rem', marginTop: '.2rem', flexWrap: 'wrap' }}>
                            {ev.participantes.slice(0, 3).map((p, pi) => (
                              <div key={p.id} title={p.nome ?? p.email} style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: ev.cor, border: '1px solid #fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '.45rem', fontWeight: 700,
                                fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0,
                              }}>
                                {(p.nome ?? p.email)[0].toUpperCase()}
                              </div>
                            ))}
                            {ev.participantes.length > 3 && (
                              <span style={{ fontSize: '.5rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                                +{ev.participantes.length - 3}
                              </span>
                            )}
                            <span style={{ fontSize: '.55rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginLeft: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                              {ev.participantes[0].nome ?? ev.participantes[0].email.split('@')[0]}
                              {ev.participantes.length > 1 ? ` +${ev.participantes.length - 1}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {evtsdia.length > 3 && (
                      <div style={{ fontSize: '.6rem', color: '#475569', padding: '.1rem .35rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        +{evtsdia.length - 3} mais
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Vista Lista ──────────────────────────────────── */}
        {view === 'lista' && (
          <div>
            {gruposLista.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#475569', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', color: '#64748b', marginBottom: '.35rem' }}>Nenhum evento próximo</div>
                <div style={{ fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)' }}>Clique em "Novo Evento" para criar o primeiro</div>
              </div>
            ) : gruposLista.map(g => {
              const d = new Date(g.data + 'T12:00:00')
              const isHoje = g.data === todayStr
              return (
                <div key={g.data} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Coluna de data */}
                  <div style={{ minWidth: 70, textAlign: 'right', paddingTop: '.35rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: isHoje ? '#d97706' : '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)', letterSpacing: '.06em' }}>
                      {DIAS_SEMANA_ABREV[d.getDay()]}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1,
                      color: isHoje ? '#d97706' : '#0f172a',
                    }}>
                      {pad(d.getDate())}
                    </div>
                    <div style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {MESES[d.getMonth()].slice(0,3)}
                    </div>
                  </div>

                  {/* Eventos */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {g.evts.map(ev => (
                      <div key={ev.id}
                        onClick={() => setEventoAtivo(ev)}
                        style={{
                          background: '#fff', border: '1px solid #e2e8f0',
                          borderLeft: `4px solid ${ev.cor}`,
                          borderRadius: '0 12px 12px 0', padding: '.85rem 1.1rem',
                          cursor: 'pointer', transition: 'all .15s',
                          boxShadow: '0 1px 3px rgba(15,23,42,.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = ev.cor }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.borderLeftColor = ev.cor }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '.875rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem' }}>
                            {ev.titulo}
                          </div>
                          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {!ev.dia_inteiro && (
                              <span style={{ fontSize: '.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {fmtHora(ev.data_inicio)} – {fmtHora(ev.data_fim)}
                              </span>
                            )}
                            {ev.local && (
                              <span style={{ fontSize: '.72rem', color: ev.local.startsWith('http') ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center', gap: '.25rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {ev.local.startsWith('http') ? 'Online' : ev.local.slice(0, 30)}
                              </span>
                            )}
                            {ev.escola && (
                              <span style={{ fontSize: '.65rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '.1rem .4rem', borderRadius: 99, fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                                {ev.escola.nome.slice(0, 20)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Participantes — avatares + nomes */}
                        {ev.participantes.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem', flexShrink: 0, minWidth: 140 }}>
                            {/* Avatares empilhados */}
                            <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                              {ev.participantes.slice(0, 4).map((p, i) => (
                                <div key={p.id} title={p.nome ?? p.email} style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: ev.cor, border: '2px solid #fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: '.68rem', fontWeight: 700,
                                  marginLeft: i > 0 ? -10 : 0, fontFamily: 'var(--font-montserrat,sans-serif)',
                                  cursor: 'default',
                                }}>
                                  {(p.nome ?? p.email)[0].toUpperCase()}
                                </div>
                              ))}
                              {ev.participantes.length > 4 && (
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#64748b', fontWeight: 700, marginLeft: -10, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                                  +{ev.participantes.length - 4}
                                </div>
                              )}
                            </div>
                            {/* Nomes */}
                            <div style={{ textAlign: 'right' }}>
                              {ev.participantes.slice(0, 2).map(p => (
                                <div key={p.id} style={{ fontSize: '.65rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.4 }}>
                                  {p.nome ?? p.email.split('@')[0]}
                                  {p.status === 'aceito' && <span style={{ color: '#16a34a', marginLeft: '.25rem', fontSize: '.58rem' }}>✓</span>}
                                  {p.status === 'recusado' && <span style={{ color: '#dc2626', marginLeft: '.25rem', fontSize: '.58rem' }}>✗</span>}
                                  {p.status === 'pendente' && <span style={{ color: '#475569', marginLeft: '.25rem', fontSize: '.58rem' }}>?</span>}
                                </div>
                              ))}
                              {ev.participantes.length > 2 && (
                                <div style={{ fontSize: '.62rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)' }}>
                                  +{ev.participantes.length - 2} mais
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Vista Semana ──────────────────────────────────── */}
        {view === 'semana' && (() => {
          // Calcular início da semana atual (domingo)
          const inicioSem = new Date(ano, mes, 1)
          inicioSem.setDate(inicioSem.getDate() - inicioSem.getDay())
          // Usar hoje como centro
          const inicioHoje = new Date(hoje)
          inicioHoje.setDate(inicioHoje.getDate() - inicioHoje.getDay())
          const diasSemana = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(inicioHoje)
            d.setDate(d.getDate() + i)
            return d
          })
          return (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)' }}>
              {/* Header dias semana */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7,1fr)', borderBottom: '2px solid #e2e8f0' }}>
                <div style={{ background: '#fafafa' }} />
                {diasSemana.map((d, i) => {
                  const isHoje = isoDate(d) === todayStr
                  return (
                    <div key={i} style={{
                      padding: '.6rem .25rem', textAlign: 'center',
                      background: isHoje ? '#fffbeb' : '#fafafa',
                      borderLeft: '1px solid #f1f5f9',
                    }}>
                      <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: isHoje ? '#d97706' : '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        {DIAS_SEMANA_ABREV[d.getDay()]}
                      </div>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', margin: '.15rem auto 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isHoje ? '#d97706' : 'transparent',
                        color: isHoje ? '#fff' : '#334155',
                        fontSize: '.85rem', fontWeight: isHoje ? 700 : 600,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>
                        {d.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Grade de horas */}
              <div style={{ overflowY: 'auto', maxHeight: 600 }}>
                {HORAS.filter(h => h >= 7 && h <= 22).map(hora => (
                  <div key={hora} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7,1fr)', minHeight: 56, borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ padding: '.25rem .5rem .25rem 0', textAlign: 'right', fontSize: '.62rem', color: '#475569', fontFamily: 'var(--font-inter,sans-serif)', paddingTop: hora === 7 ? '.2rem' : 0 }}>
                      {hora}:00
                    </div>
                    {diasSemana.map((d, di) => {
                      const evtsHora = eventos.filter(e => {
                        const ei = new Date(e.data_inicio)
                        return isoDate(ei) === isoDate(d) && ei.getHours() === hora
                      })
                      const isHoje = isoDate(d) === todayStr
                      return (
                        <div key={di}
                          onClick={() => {
                            const dt = `${isoDate(d)}`
                            setDiaClicado(dt)
                            setModalCriar(true)
                          }}
                          style={{
                            borderLeft: '1px solid #f1f5f9', padding: '.15rem .2rem', position: 'relative',
                            background: isHoje ? '#fffbeb22' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = isHoje ? '#fffbeb22' : 'transparent'}
                        >
                          {evtsHora.map(ev => (
                            <div key={ev.id}
                              onClick={e => { e.stopPropagation(); setEventoAtivo(ev) }}
                              style={{
                                background: ev.cor + '22', borderLeft: `3px solid ${ev.cor}`,
                                borderRadius: '0 5px 5px 0', padding: '.2rem .35rem',
                                fontSize: '.62rem', fontWeight: 600, color: '#0f172a',
                                fontFamily: 'var(--font-montserrat,sans-serif)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                cursor: 'pointer', marginBottom: '.1rem',
                              }}>
                              {fmtHora(ev.data_inicio)} {ev.titulo}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Modais ─────────────────────────────────────────── */}
      {(modalCriar || eventoEditar) && (
        <ModalEvento
          onClose={handleFecharModal}
          profiles={profiles}
          escolas={escolas}
          userId={userId}
          userEmail={userEmail}
          diaInicial={diaClicado}
          eventoEditar={eventoEditar ?? undefined}
        />
      )}

      {eventoAtivo && !eventoEditar && (
        <ModalDetalhes
          evento={eventoAtivo}
          onClose={() => setEventoAtivo(null)}
          onEditar={() => { setEventoEditar(eventoAtivo); setEventoAtivo(null) }}
          onDeletar={handleDeletar}
          userId={userId}
        />
      )}
    </div>
  )
}

