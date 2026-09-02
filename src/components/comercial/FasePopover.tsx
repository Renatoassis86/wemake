'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarChecklistContratoInline } from '@/lib/actions'

const CHECKLIST_ITEMS = [
  ['formulario_enviado', 'Formulário enviado'],
  ['formulario_recebido', 'Formulário recebido'],
  ['proposta_enviada', 'Proposta enviada'],
  ['minuta_enviada', 'Minuta enviada'],
  ['retorno_minuta', 'Retorno da minuta'],
  ['minuta_atualizada', 'Minuta atualizada'],
  ['contrato_enviado', 'Contrato enviado'],
  ['contrato_assinado', 'Contrato assinado'],
  ['contrato_arquivado', 'Contrato arquivado'],
  ['declinou', 'Escola declinou'],
] as const

interface Props {
  escolaId: string
  faseLabel: string
  faseCor: { bg: string; text: string; border: string }
  checklist: Record<string, boolean>
  implantacaoStatus: string | null
}

function ChipItem({ label, negativo }: { label: string; negativo: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.25rem',
      background: negativo ? '#fef2f2' : '#f0fdf4',
      color: negativo ? '#dc2626' : '#15803d',
      border: `1px solid ${negativo ? '#fca5a5' : '#86efac'}`,
      padding: '.1rem .45rem', borderRadius: 99,
      fontSize: '.6rem', fontWeight: 700, whiteSpace: 'nowrap',
      fontFamily: 'var(--font-montserrat,sans-serif)',
    }}>
      {negativo ? '✕' : '✓'} {label}
    </span>
  )
}

// Popover "suspenso" pra avançar o checklist de contrato direto na tabela do
// Funil de Contratação, sem sair da página. position:fixed (não absolute) de
// propósito — o wrapper da tabela tem overflow-x:auto, que corta qualquer
// popover posicionado relativo a um ancestral dentro dele.
export function FasePopover({ escolaId, faseLabel, faseCor, checklist: checklistInicial, implantacaoStatus: implantacaoInicial }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(checklistInicial)
  const [implantacao, setImplantacao] = useState(implantacaoInicial ?? 'em_andamento')
  const [pending, startTransition] = useTransition()
  const btnRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  function abrir() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 300)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 420)
      setPos({ top, left })
    }
    setChecklist(checklistInicial)
    setImplantacao(implantacaoInicial ?? 'em_andamento')
    setAberto(true)
  }

  useEffect(() => {
    if (!aberto) return
    function handleClick(e: MouseEvent) {
      if (
        painelRef.current && !painelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aberto])

  function salvar() {
    const fd = new FormData()
    fd.set('escola_id', escolaId)
    for (const [key] of CHECKLIST_ITEMS) fd.set(key, String(checklist[key] ?? false))
    if (checklist.contrato_arquivado) fd.set('implantacao_status', implantacao)
    startTransition(async () => {
      const res = await atualizarChecklistContratoInline(fd)
      if (res.success) {
        setAberto(false)
        router.refresh()
      }
    })
  }

  const marcados = CHECKLIST_ITEMS.filter(([key]) => !!checklistInicial[key])

  return (
    <>
      <div ref={btnRef} onClick={abrir} title="Clique para atualizar o checklist do contrato" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '.25rem',
        cursor: 'pointer', minWidth: 120, padding: '.15rem', margin: '-.15rem', borderRadius: 8,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {marcados.length > 0 ? (
          marcados.map(([key, label]) => <ChipItem key={key} label={label} negativo={key === 'declinou'} />)
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '.3rem',
            background: faseCor.bg, color: faseCor.text, border: `1px solid ${faseCor.border}`,
            padding: '.2rem .6rem', borderRadius: 99,
            fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
            fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
          }}>
            {faseLabel} <span style={{ fontSize: '.7rem' }}>✎</span>
          </span>
        )}
      </div>

      {aberto && pos && (
        <div ref={painelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 2000,
          width: 280, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,23,42,.18)', padding: '1rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.75rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Checklist de Progresso
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '.75rem' }}>
            {CHECKLIST_ITEMS.map(([key, label]) => {
              const negativo = key === 'declinou'
              return (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', cursor: 'pointer',
                  color: negativo ? '#dc2626' : '#334155',
                  fontWeight: negativo ? 700 : 400,
                  paddingTop: negativo ? '.4rem' : 0,
                  marginTop: negativo ? '.15rem' : 0,
                  borderTop: negativo ? '1px dashed #fca5a5' : 'none',
                }}>
                  <input type="checkbox" checked={!!checklist[key]}
                    onChange={e => setChecklist(c => ({ ...c, [key]: e.target.checked }))}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: negativo ? '#dc2626' : '#5FE3D0', flexShrink: 0 }} />
                  {label}
                </label>
              )
            })}
          </div>

          {checklist.contrato_arquivado && (
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, color: '#7c3aed', marginBottom: '.3rem' }}>Fase de Implantação</label>
              <select value={implantacao} onChange={e => setImplantacao(e.target.value)}
                style={{ width: '100%', padding: '.4rem .5rem', fontSize: '.78rem', border: '1.5px solid #e2e8f0', borderRadius: 6 }}>
                <option value="nao_iniciada">Não iniciada</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={salvar} disabled={pending} style={{
              flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#4A7FDB', color: '#fff', fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setAberto(false)} style={{
              padding: '.5rem .75rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
