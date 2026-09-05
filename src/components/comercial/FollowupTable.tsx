'use client'

import Link from 'next/link'
import { Mail, MessageCircle, Save } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { FollowupLinha } from '@/lib/followup'
import { salvarNotaFollowup } from '@/app/(dashboard)/comercial/followup/actions'

function whatsappUrl(telefone: string, nome: string) {
  const digits = telefone.replace(/\D/g, '')
  return `https://wa.me/55${digits}?text=${encodeURIComponent(`Olá! Estou entrando em contato sobre a proposta comercial enviada à ${nome}.`)}`
}

export function FollowupTable({ linhas }: { linhas: FollowupLinha[] }) {
  const columns: Column<FollowupLinha>[] = [
    {
      key: 'escolaNome',
      header: 'Escola',
      sortable: true,
      width: '19%',
      cell: row => (
        <div style={{ minWidth: 0 }}>
          {row.escolaId ? (
            <Link href={`/comercial/escolas/${row.escolaId}`} style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              {row.escolaNome}
            </Link>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{row.escolaNome}</span>
          )}
          <div style={{ fontSize: '.68rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
            {[row.cidade, row.estado].filter(Boolean).join('/') || '—'}
            {row.propostaArquivada && <span style={{ marginLeft: '.4rem', color: '#dc2626', fontWeight: 700 }}>· arquivada</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'alunos',
      header: 'Alunos',
      sortable: true,
      align: 'right',
      width: '7%',
      cell: row => <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>{row.alunos != null ? row.alunos.toLocaleString('pt-BR') : '—'}</span>,
    },
    {
      key: 'ticketMedio',
      header: 'Ticket Médio',
      sortable: true,
      align: 'right',
      width: '9%',
      cell: row => <span style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 600 }}>{row.ticketMedio ? formatCurrency(row.ticketMedio) : '—'}</span>,
    },
    {
      key: 'valorContrato',
      header: 'Valor do Contrato',
      sortable: true,
      align: 'right',
      width: '13%',
      cell: row => (
        <div>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, color: row.valorContratoAssinado ? '#16a34a' : '#0f172a' }}>
            {row.valorContrato ? formatCurrency(row.valorContrato) : '—'}
          </div>
          <div style={{ fontSize: '.62rem', color: '#94a3b8' }}>{row.valorContratoAssinado ? 'contrato assinado' : 'potencial anual'}</div>
        </div>
      ),
    },
    {
      key: 'contatoNome',
      header: 'Contato',
      width: '19%',
      cell: row => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', minWidth: 0 }}>
          <span style={{ fontSize: '.76rem', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.contatoNome || '—'}
          </span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {row.email ? (
              <a href={`mailto:${row.email}`} title={row.email} style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.68rem', color: '#2563eb', textDecoration: 'none' }}>
                <Mail size={11} /> e-mail
              </a>
            ) : <span style={{ fontSize: '.68rem', color: '#cbd5e1' }}>sem e-mail</span>}
            {row.telefone ? (
              <a href={whatsappUrl(row.telefone, row.escolaNome)} target="_blank" rel="noopener noreferrer" title={row.telefone} style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.68rem', color: '#16a34a', textDecoration: 'none' }}>
                <MessageCircle size={11} /> whatsapp
              </a>
            ) : <span style={{ fontSize: '.68rem', color: '#cbd5e1' }}>sem telefone</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status da Negociação',
      width: '33%',
      cell: row => {
        if (row.statusAutomatico) {
          const texto = row.statusAutomatico as string
          const separador = texto.indexOf(' · ')
          const fase = separador === -1 ? texto : texto.slice(0, separador)
          const resto = separador === -1 ? null : texto.slice(separador + 3)
          return (
            <div title={texto} style={{ maxWidth: 320 }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: resto ? '.15rem' : 0 }}>{fase}</div>
              {resto && (
                <div style={{
                  fontSize: '.72rem', color: '#64748b', lineHeight: 1.35,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {resto}
                </div>
              )}
            </div>
          )
        }
        if (!row.escolaId) {
          return <span style={{ fontSize: '.72rem', color: '#cbd5e1' }}>escola não vinculada</span>
        }
        return (
          <form action={salvarNotaFollowup} style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
            <input type="hidden" name="escola_id" value={row.escolaId} />
            <input
              name="texto"
              defaultValue={row.notaManual ?? ''}
              placeholder="Como anda a negociação..."
              style={{
                flex: 1, minWidth: 0, fontSize: '.74rem', padding: '.35rem .55rem',
                border: '1.5px solid #e2e8f0', borderRadius: 6, background: '#f8fafc',
                color: '#0f172a', outline: 'none', fontFamily: 'var(--font-inter,sans-serif)',
              }}
            />
            <button type="submit" title="Salvar" style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: 'none',
              background: '#4A7FDB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Save size={12} />
            </button>
          </form>
        )
      },
    },
  ]

  return (
    <DataTable
      data={linhas}
      columns={columns}
      pageSize={25}
      compact
      searchPlaceholder="Buscar por escola, cidade, contato..."
      emptyMessage="Nenhuma proposta encontrada"
      emptyDescription="Nenhuma escola recebeu proposta comercial ainda."
    />
  )
}
