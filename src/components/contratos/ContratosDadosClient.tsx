'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { SERIES_CONTRATO } from '@/lib/contratos'
import { DriveDocViewer } from './DriveDocViewer'

export interface EscolaContrato {
  escolaId: string
  nome: string
  assinado: boolean
  cnpj: string | null
  endereco: { rua: string | null; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null; cep: string | null }
  totalAlunos: number
  valorTotal: number
  valorMensalInicial: number | null
  clausulasEspeciais: string | null
  vigenciaInicio: string | null
  vigenciaFim: string | null
  driveContratoUrl: string | null
  legal: {
    nome: string | null; cpf: string | null; email: string | null; whatsapp: string | null
    rua: string | null; numero: string | null; complemento: string | null; bairro: string | null
    cidade: string | null; estado: string | null; cep: string | null
  }
  series: Record<string, any>
  aditivos: { id: string; titulo: string; resumo: string | null; dataAssinatura: string | null; assinado: boolean; driveUrl: string | null }[]
}

const anoDe = (iso: string | null) => (iso ? new Date(iso + 'T00:00:00').getFullYear() : null)

// Duração calculada direto das datas de vigência (precisa, em meses) — não
// usa o campo `tempo_contrato` do banco porque ele nunca foi preenchido pra
// nenhuma dessas escolas (fica no valor padrão "1" do formulário antigo).
function duracaoMeses(e: EscolaContrato): number | null {
  if (!e.vigenciaInicio || !e.vigenciaFim) return null
  const ini = new Date(e.vigenciaInicio + 'T00:00:00')
  const fim = new Date(e.vigenciaFim + 'T00:00:00')
  return (fim.getFullYear() - ini.getFullYear()) * 12 + (fim.getMonth() - ini.getMonth()) + 1
}

function vigenciaResumo(e: EscolaContrato) {
  const ini = anoDe(e.vigenciaInicio)
  const fim = anoDe(e.vigenciaFim)
  const meses = duracaoMeses(e)
  if (ini && fim) return `${ini}–${fim}${meses ? ` · ${meses} meses` : ''}`
  return '—'
}

export function ContratosDadosClient({ escolas }: { escolas: EscolaContrato[] }) {
  // Só um card por vez aberto — evita vários iframes do Drive carregando juntos
  // e mantém a grade previsível (o verso ocupa a linha inteira).
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const [girando, setGirando] = useState<string | null>(null)

  function alternar(id: string) {
    setGirando(id)
    // Meio-giro (90°) esconde o conteúdo atual; troca o lado na metade da animação.
    window.setTimeout(() => {
      setAbertoId(prev => (prev === id ? null : id))
      window.setTimeout(() => setGirando(null), 20)
    }, 220)
  }

  if (escolas.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
        Nenhuma escola com contrato assinado ainda.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
      {escolas.map(e => {
        const aberta = abertoId === e.escolaId
        const emGiro = girando === e.escolaId
        return (
          <div
            key={e.escolaId}
            style={{
              gridColumn: aberta ? '1 / -1' : 'auto',
              perspective: 1200,
            }}
          >
            <div
              style={{
                transform: emGiro ? 'rotateY(90deg)' : 'rotateY(0deg)',
                transition: 'transform .22s ease',
                transformStyle: 'preserve-3d',
              }}
            >
              {aberta ? (
                <CartaoVerso escola={e} onFechar={() => alternar(e.escolaId)} />
              ) : (
                <CartaoFrente escola={e} onClick={() => alternar(e.escolaId)} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CartaoFrente({ escola: e, onClick }: { escola: EscolaContrato; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '1.25rem 1.4rem', boxShadow: '0 1px 4px rgba(0,41,51,.06)',
        display: 'flex', flexDirection: 'column', gap: '.9rem',
        transition: 'box-shadow .15s, border-color .15s',
      }}
      onMouseEnter={ev => { ev.currentTarget.style.boxShadow = '0 6px 18px rgba(0,41,51,.12)'; ev.currentTarget.style.borderColor = '#00889e' }}
      onMouseLeave={ev => { ev.currentTarget.style.boxShadow = '0 1px 4px rgba(0,41,51,.06)'; ev.currentTarget.style.borderColor = '#e2e8f0' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#002933', lineHeight: 1.2, textAlign: 'left' }}>
          {e.nome}
        </div>
        <span style={{
          flexShrink: 0, fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em',
          color: e.assinado ? '#15803d' : '#92400e',
          background: e.assinado ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${e.assinado ? '#86efac' : '#fde68a'}`,
          borderRadius: 999, padding: '.2rem .6rem',
        }}>
          {e.assinado ? 'Assinado' : 'Aguardando assinatura'}
        </span>
      </div>

      <div style={{ fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', textAlign: 'left' }}>
        {e.cnpj || 'CNPJ não informado'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', paddingTop: '.5rem', borderTop: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>Alunos</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#002933' }}>{e.totalAlunos}</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>Valor total</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#002933' }}>{formatCurrency(e.valorTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>Vigência</div>
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#334155' }}>{vigenciaResumo(e)}</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>Aditivos</div>
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#334155' }}>{e.aditivos.length || '—'}</div>
        </div>
      </div>

      {e.clausulasEspeciais && (
        <div style={{
          display: 'flex', gap: '.5rem', alignItems: 'flex-start',
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
          padding: '.55rem .7rem', fontSize: '.72rem', lineHeight: 1.4, color: '#92400e', textAlign: 'left',
        }}>
          <span style={{ flexShrink: 0 }}>⚑</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {e.clausulasEspeciais}
          </span>
        </div>
      )}
    </button>
  )
}

function Campo({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: '.2rem' }}>{label}</div>
      <div style={{ fontSize: '.82rem', color: value ? '#334155' : '#cbd5e1' }}>{value || 'Não informado'}</div>
    </div>
  )
}

function CartaoVerso({ escola: e, onFechar }: { escola: EscolaContrato; onFechar: () => void }) {
  const [aditivoAberto, setAditivoAberto] = useState<string | null>(null)
  const enderecoLegal = [e.legal.rua && `${e.legal.rua}${e.legal.numero ? `, ${e.legal.numero}` : ''}`, e.legal.bairro, e.legal.cidade && e.legal.estado ? `${e.legal.cidade}/${e.legal.estado}` : null, e.legal.cep]
    .filter(Boolean).join(' · ')

  const secaoHdr: React.CSSProperties = {
    fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em',
    color: '#00889e', marginBottom: '.75rem', fontFamily: 'var(--font-montserrat,sans-serif)',
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #00889e', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,41,51,.12)', overflow: 'hidden' }}>
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 700, color: '#002933' }}>{e.nome}</div>
          <div style={{ fontSize: '.75rem', color: '#64748b' }}>{e.cnpj || 'CNPJ não informado'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Link href={`/contratos/dados/editar/${e.escolaId}`} style={{
            display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 .8rem', borderRadius: 8,
            border: '1px solid #00889e', color: '#00889e', fontSize: '.75rem', fontWeight: 700,
            fontFamily: 'var(--font-montserrat,sans-serif)', textDecoration: 'none',
          }}>
            Editar dados
          </Link>
          <button onClick={onFechar} style={{
            all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #e2e8f0', color: '#64748b', fontSize: '1rem',
          }}>✕</button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Coluna esquerda: dados + valores + vigência */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <div style={secaoHdr}>Escola / Representante Legal</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
              <Campo label="Endereço da escola" value={[e.endereco.rua && `${e.endereco.rua}${e.endereco.numero ? `, ${e.endereco.numero}` : ''}`, e.endereco.cidade && e.endereco.estado ? `${e.endereco.cidade}/${e.endereco.estado}` : null].filter(Boolean).join(' · ') || null} />
              <Campo label="Representante legal" value={e.legal.nome} />
              <Campo label="CPF" value={e.legal.cpf} />
              <Campo label="E-mail" value={e.legal.email} />
              <Campo label="WhatsApp" value={e.legal.whatsapp} />
              <Campo label="Endereço do representante" value={enderecoLegal || null} />
            </div>
          </section>

          <section>
            <div style={secaoHdr}>Alunos por série</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {SERIES_CONTRATO.filter(s => (e.series[s.campo] ?? 0) > 0).map(s => (
                <span key={s.campo} style={{
                  fontSize: '.75rem', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '.3rem .6rem',
                }}>
                  {s.label}: <strong>{e.series[s.campo]}</strong>
                </span>
              ))}
              {SERIES_CONTRATO.every(s => (e.series[s.campo] ?? 0) === 0) && (
                <span style={{ fontSize: '.78rem', color: '#94a3b8' }}>Nenhuma série com aluno cadastrado.</span>
              )}
            </div>
          </section>

          <section>
            <div style={secaoHdr}>Valores e Vigência</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
              <Campo label="Mensalidade inicial" value={e.valorMensalInicial ? formatCurrency(e.valorMensalInicial) : null} />
              <Campo label="Valor total do contrato" value={e.valorTotal > 0 ? formatCurrency(e.valorTotal) : null} />
              <Campo label="Duração" value={duracaoMeses(e) ? `${duracaoMeses(e)} meses` : null} />
              <Campo label="Vigência" value={e.vigenciaInicio && e.vigenciaFim ? `${new Date(e.vigenciaInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(e.vigenciaFim + 'T00:00:00').toLocaleDateString('pt-BR')}` : null} />
            </div>
          </section>

          {e.clausulasEspeciais && (
            <section>
              <div style={{ ...secaoHdr, color: '#92400e' }}>⚑ Cláusulas especiais deste contrato</div>
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
                padding: '.85rem 1rem', fontSize: '.82rem', lineHeight: 1.6, color: '#78350f',
              }}>
                {e.clausulasEspeciais}
              </div>
            </section>
          )}

          <section>
            <div style={secaoHdr}>Aditivos ({e.aditivos.length})</div>
            {e.aditivos.length === 0 ? (
              <span style={{ fontSize: '.78rem', color: '#94a3b8' }}>Nenhum aditivo registrado.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {e.aditivos.map(a => (
                  <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '.65rem .85rem' }}>
                    <button
                      onClick={() => setAditivoAberto(prev => (prev === a.id ? null : a.id))}
                      style={{ all: 'unset', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div>
                        <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#002933' }}>{a.titulo}</div>
                        <div style={{ fontSize: '.7rem', color: '#94a3b8' }}>
                          {a.dataAssinatura ? new Date(a.dataAssinatura + 'T00:00:00').toLocaleDateString('pt-BR') : 'sem data'}
                          {' · '}{a.assinado ? 'assinado' : 'pendente'}
                        </div>
                      </div>
                      <span style={{ fontSize: '.72rem', color: '#00889e', fontWeight: 600 }}>{aditivoAberto === a.id ? 'Fechar' : 'Ver'}</span>
                    </button>
                    {a.resumo && <div style={{ fontSize: '.76rem', color: '#64748b', marginTop: '.4rem' }}>{a.resumo}</div>}
                    {aditivoAberto === a.id && (
                      <div style={{ marginTop: '.65rem' }}>
                        <DriveDocViewer driveUrl={a.driveUrl} titulo={`Aditivo — ${a.titulo}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna direita: documento original */}
        <div>
          <div style={secaoHdr}>Contrato original</div>
          <DriveDocViewer driveUrl={e.driveContratoUrl} titulo={`Contrato — ${e.nome}`} />
        </div>
      </div>
    </div>
  )
}
