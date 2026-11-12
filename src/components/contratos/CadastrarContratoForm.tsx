'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertDadosContrato, criarAditivo, removerAditivo } from '@/lib/actions'
import { SERIES_CONTRATO } from '@/lib/contratos'

export interface EscolaOpcao { id: string; nome: string; estado: string | null }

export interface AditivoInicial {
  id: string; titulo: string; resumo: string | null; dataAssinatura: string | null
  assinado: boolean; driveUrl: string | null
}

export interface DadosIniciais {
  escolaId: string
  escolaNome: string
  escolaCnpj: string | null
  legalNome: string | null; legalCpf: string | null; legalEmail: string | null; legalWhatsapp: string | null
  legalRua: string | null; legalNumero: string | null; legalComplemento: string | null
  legalBairro: string | null; legalCidade: string | null; legalEstado: string | null; legalCep: string | null
  vigenciaInicio: string | null; vigenciaFim: string | null
  driveContratoUrl: string | null
  valorMensalInicial: number | null; valorAnual: number | null; valorTotal: number | null
  modeloComercial: string | null; clausulasEspeciais: string | null
  contratoAssinado: boolean; contratoEnviado: boolean; marcadoVeterana: boolean
  series: Record<string, number>
  aditivos: AditivoInicial[]
}

const rotulo: React.CSSProperties = {
  display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
  color: '#64748b', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)',
}
const campo: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '.55rem .7rem', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: '.85rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#002933',
}
const secaoWrap: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem 1.4rem', marginBottom: '1.25rem',
}
const secaoHdr: React.CSSProperties = {
  fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#00889e',
  marginBottom: '1rem', fontFamily: 'var(--font-montserrat,sans-serif)',
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.9rem' }

function Campo({ name, label, defaultValue, type = 'text', required = false, placeholder, step }: {
  name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string; step?: string
}) {
  return (
    <div>
      <label style={rotulo} htmlFor={name}>{label}{required && ' *'}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} required={required} placeholder={placeholder} step={step} style={campo} />
    </div>
  )
}

export function CadastrarContratoForm({ mode, escolas, inicial }: {
  mode: 'novo' | 'editar'
  escolas?: EscolaOpcao[]
  inicial?: DadosIniciais
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [escolaSelecionada, setEscolaSelecionada] = useState<string>('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null); setOk(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await upsertDadosContrato(fd)
      if (!res.success) { setErro(res.error ?? 'Erro ao salvar.'); return }
      if (mode === 'novo') {
        router.push(`/contratos/dados/editar/${res.id}`)
      } else {
        setOk('Dados salvos.')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {mode === 'editar' && inicial && <input type="hidden" name="escola_id" value={inicial.escolaId} />}

      {mode === 'novo' && (
        <section style={secaoWrap}>
          <div style={secaoHdr}>Escola</div>
          <div style={grid2}>
            <div>
              <label style={rotulo} htmlFor="escola_id">Escola já cadastrada</label>
              <select id="escola_id" name="escola_id" value={escolaSelecionada} onChange={e => setEscolaSelecionada(e.target.value)} style={campo}>
                <option value="">— Cadastrar uma escola nova —</option>
                {(escolas ?? []).map(e => <option key={e.id} value={e.id}>{e.nome}{e.estado ? ` (${e.estado})` : ''}</option>)}
              </select>
            </div>
          </div>
          {!escolaSelecionada && (
            <div style={{ ...grid2, marginTop: '.9rem', paddingTop: '.9rem', borderTop: '1px dashed #e2e8f0' }}>
              <Campo name="nova_escola_nome" label="Nome da escola" required />
              <Campo name="nova_escola_cnpj" label="CNPJ" placeholder="00.000.000/0000-00" />
              <Campo name="nova_escola_cidade" label="Cidade" />
              <Campo name="nova_escola_estado" label="UF" placeholder="PR" />
            </div>
          )}
        </section>
      )}

      {mode === 'editar' && inicial && (
        <section style={secaoWrap}>
          <div style={secaoHdr}>Escola</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#002933' }}>{inicial.escolaNome}</div>
          <div style={{ fontSize: '.78rem', color: '#64748b' }}>{inicial.escolaCnpj || 'CNPJ não informado nesta tela — edite na ficha da escola.'}</div>
        </section>
      )}

      <section style={secaoWrap}>
        <div style={secaoHdr}>Representante legal</div>
        <div style={grid2}>
          <Campo name="legal_nome" label="Nome completo" defaultValue={inicial?.legalNome} />
          <Campo name="legal_cpf" label="CPF" defaultValue={inicial?.legalCpf} placeholder="000.000.000-00" />
          <Campo name="legal_email" label="E-mail" type="email" defaultValue={inicial?.legalEmail} />
          <Campo name="legal_whatsapp" label="WhatsApp" defaultValue={inicial?.legalWhatsapp} />
          <Campo name="legal_rua" label="Rua" defaultValue={inicial?.legalRua} />
          <Campo name="legal_numero" label="Número" defaultValue={inicial?.legalNumero} />
          <Campo name="legal_complemento" label="Complemento" defaultValue={inicial?.legalComplemento} />
          <Campo name="legal_bairro" label="Bairro" defaultValue={inicial?.legalBairro} />
          <Campo name="legal_cidade" label="Cidade" defaultValue={inicial?.legalCidade} />
          <Campo name="legal_estado" label="UF" defaultValue={inicial?.legalEstado} />
          <Campo name="legal_cep" label="CEP" defaultValue={inicial?.legalCep} />
        </div>
      </section>

      <section style={secaoWrap}>
        <div style={secaoHdr}>Alunos por série (só o que está no contrato)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '.7rem' }}>
          {SERIES_CONTRATO.map(s => (
            <div key={s.campo}>
              <label style={rotulo} htmlFor={s.campo}>{s.label}</label>
              <input id={s.campo} name={s.campo} type="number" min={0} defaultValue={inicial?.series[s.campo] ?? 0} style={campo} />
            </div>
          ))}
        </div>
      </section>

      <section style={secaoWrap}>
        <div style={secaoHdr}>Valores e modelo comercial</div>
        <div style={grid2}>
          <Campo name="valor_mensal_inicial" label="Mensalidade inicial (R$)" type="number" step="0.01" defaultValue={inicial?.valorMensalInicial} />
          <Campo name="valor_anual" label="Valor anual — 1º ano (R$)" type="number" step="0.01" defaultValue={inicial?.valorAnual} />
          <Campo name="valor_total" label="Valor total — toda a vigência (R$)" type="number" step="0.01" defaultValue={inicial?.valorTotal} />
          <div>
            <label style={rotulo} htmlFor="modelo_comercial">Modelo comercial</label>
            <select id="modelo_comercial" name="modelo_comercial" defaultValue={inicial?.modeloComercial ?? ''} style={campo}>
              <option value="">Não classificado</option>
              <option value="mensalidade">Mensalidade</option>
              <option value="kit_we_make">Kit We Make</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '.9rem' }}>
          <label style={rotulo} htmlFor="clausulas_especiais">Cláusulas especiais</label>
          <textarea id="clausulas_especiais" name="clausulas_especiais" rows={3} defaultValue={inicial?.clausulasEspeciais ?? ''}
            style={{ ...campo, resize: 'vertical' as const }} placeholder="Reajuste diferenciado, desconto progressivo, modelo de afiliados, etc." />
        </div>
      </section>

      <section style={secaoWrap}>
        <div style={secaoHdr}>Vigência e documento</div>
        <div style={grid2}>
          <Campo name="vigencia_inicio" label="Início da vigência" type="date" defaultValue={inicial?.vigenciaInicio} />
          <Campo name="vigencia_fim" label="Fim da vigência" type="date" defaultValue={inicial?.vigenciaFim} />
        </div>
        <div style={{ marginTop: '.9rem' }}>
          <Campo name="drive_contrato_url" label="Link do contrato original no Google Drive" defaultValue={inicial?.driveContratoUrl} placeholder="https://drive.google.com/file/d/..." />
        </div>
      </section>

      <section style={secaoWrap}>
        <div style={secaoHdr}>Status</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#334155' }}>
            <input type="checkbox" name="contrato_assinado" value="true" defaultChecked={inicial?.contratoAssinado ?? false} /> Contrato assinado
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#334155' }}>
            <input type="checkbox" name="contrato_enviado" value="true" defaultChecked={inicial?.contratoEnviado ?? false} /> Contrato enviado (aguardando assinatura)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#334155' }}>
            <input type="checkbox" name="marcado_veterana" value="true" defaultChecked={inicial?.marcadoVeterana ?? false} /> Escola veterana (já atendida, independente de renovação)
          </label>
        </div>
      </section>

      {erro && <p style={{ color: '#dc2626', fontSize: '.82rem', marginBottom: '1rem' }}>{erro}</p>}
      {ok && <p style={{ color: '#16a34a', fontSize: '.82rem', marginBottom: '1rem' }}>{ok}</p>}

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button type="submit" disabled={pending} style={{
          padding: '.7rem 1.4rem', borderRadius: 10, border: 'none', cursor: pending ? 'wait' : 'pointer',
          background: '#00889e', color: '#fff', fontSize: '.85rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
          opacity: pending ? .7 : 1,
        }}>
          {pending ? 'Salvando...' : mode === 'novo' ? 'Cadastrar contrato' : 'Salvar alterações'}
        </button>
      </div>

      {mode === 'editar' && inicial && (
        <div style={{ marginTop: '1.25rem' }}>
          <AditivosEditor escolaId={inicial.escolaId} aditivosIniciais={inicial.aditivos} />
        </div>
      )}
    </form>
  )
}

function AditivosEditor({ escolaId, aditivosIniciais }: { escolaId: string; aditivosIniciais: AditivoInicial[] }) {
  const router = useRouter()
  const [aditivos, setAditivos] = useState(aditivosIniciais)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [formAberto, setFormAberto] = useState(false)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await criarAditivo(fd)
      if (!res.success) { setErro(res.error ?? 'Erro ao salvar o aditivo.'); return }
      e.currentTarget.reset()
      setFormAberto(false)
      router.refresh()
    })
  }

  function handleRemover(id: string, titulo: string) {
    if (!confirm(`Remover o aditivo "${titulo}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      const res = await removerAditivo(id)
      if (!res.success) { setErro(res.error ?? 'Erro ao remover.'); return }
      setAditivos(prev => prev.filter(a => a.id !== id))
    })
  }

  return (
    <section style={secaoWrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={secaoHdr}>Aditivos ({aditivos.length})</div>
        <button type="button" onClick={() => setFormAberto(v => !v)} style={{
          all: 'unset', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700, color: '#00889e',
        }}>
          {formAberto ? 'Cancelar' : '+ Adicionar aditivo'}
        </button>
      </div>

      {formAberto && (
        <form onSubmit={handleAdd} style={{ ...grid2, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #e2e8f0' }}>
          <input type="hidden" name="escola_id" value={escolaId} />
          <Campo name="titulo" label="Título" required placeholder="Termo aditivo de reajuste 2028" />
          <Campo name="data_assinatura" label="Data de assinatura" type="date" />
          <Campo name="drive_url" label="Link do documento no Drive" />
          <div>
            <label style={rotulo} htmlFor="assinado_aditivo">Assinado?</label>
            <select id="assinado_aditivo" name="assinado" defaultValue="false" style={campo}>
              <option value="false">Pendente</option>
              <option value="true">Assinado</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={rotulo} htmlFor="resumo">Resumo</label>
            <textarea id="resumo" name="resumo" rows={2} style={{ ...campo, resize: 'vertical' as const }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={pending} style={{
              padding: '.55rem 1.1rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#6d28d9', color: '#fff', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              {pending ? 'Salvando...' : 'Salvar aditivo'}
            </button>
          </div>
        </form>
      )}

      {erro && <p style={{ color: '#dc2626', fontSize: '.8rem', marginBottom: '.75rem' }}>{erro}</p>}

      {aditivos.length === 0 ? (
        <span style={{ fontSize: '.78rem', color: '#94a3b8' }}>Nenhum aditivo registrado.</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {aditivos.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.6rem .85rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#002933' }}>{a.titulo}</div>
                <div style={{ fontSize: '.7rem', color: '#94a3b8' }}>
                  {a.dataAssinatura ? new Date(a.dataAssinatura + 'T00:00:00').toLocaleDateString('pt-BR') : 'sem data'}{' · '}{a.assinado ? 'assinado' : 'pendente'}
                </div>
              </div>
              <button type="button" onClick={() => handleRemover(a.id, a.titulo)} disabled={pending} style={{
                all: 'unset', cursor: pending ? 'wait' : 'pointer', fontSize: '.72rem', fontWeight: 700, color: '#dc2626', flexShrink: 0,
              }}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
