import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/layout/PageHeader'
import { ClipboardList, MapPin, Mail, Phone, FileText, CalendarDays, GraduationCap } from 'lucide-react'
import PreCadastroActions from './PreCadastroActions'

interface PreCadastro {
  id: string
  created_at: string
  status: string | null
  // Responsavel pelo preenchimento
  resp_email: string | null
  // Escola
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  rua: string | null
  numero: string | null
  bairro: string | null
  cep: string | null
  cidade: string | null
  estado: string | null
  email_institucional: string | null
  // Segmentos
  seg_infantil: boolean | null
  seg_fundamental_1: boolean | null
  seg_fundamental_2: boolean | null
  seg_ensino_medio: boolean | null
  alunos_infantil: number | null
  alunos_fundamental_1: number | null
  alunos_fundamental_2: number | null
  alunos_ensino_medio: number | null
  // Ano letivo
  data_inicio_letivo: string | null
  data_fim_letivo: string | null
  formato_ano_letivo: string | null
  observacoes: string | null
  // Representante legal
  legal_nome: string | null
  legal_cpf: string | null
  legal_email: string | null
  legal_whatsapp: string | null
  legal_rua: string | null
  legal_numero: string | null
  legal_complemento: string | null
  legal_bairro: string | null
  legal_cidade: string | null
  legal_estado: string | null
  legal_cep: string | null
  // Financeiro
  fin_email_cobranca: string | null
  ticket_medio: string | null
}

function formatDataBR(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function totalAlunos(r: PreCadastro) {
  return (r.alunos_infantil ?? 0)
    + (r.alunos_fundamental_1 ?? 0)
    + (r.alunos_fundamental_2 ?? 0)
    + (r.alunos_ensino_medio ?? 0)
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pendente:  { bg: '#fef3c7', text: '#92400e', label: 'Pendente' },
    contatado: { bg: '#dbeafe', text: '#1e3a8a', label: 'Em contato' },
    convertido:{ bg: '#dcfce7', text: '#166534', label: 'Convertido' },
    descartado:{ bg: '#f1f5f9', text: '#64748b', label: 'Descartado' },
  }
  const s = map[status ?? 'pendente'] ?? map.pendente
  return (
    <span style={{
      display: 'inline-block', padding: '.2rem .6rem', borderRadius: 9999,
      background: s.bg, color: s.text,
      fontSize: '.7rem', fontWeight: 700, letterSpacing: '.02em',
      fontFamily: 'var(--font-montserrat,sans-serif)',
    }}>
      {s.label}
    </span>
  )
}

function Segmentos({ r }: { r: PreCadastro }) {
  const segs: string[] = []
  if (r.seg_infantil)       segs.push(`Infantil${r.alunos_infantil ? ` (${r.alunos_infantil})` : ''}`)
  if (r.seg_fundamental_1)  segs.push(`Fund 1${r.alunos_fundamental_1 ? ` (${r.alunos_fundamental_1})` : ''}`)
  if (r.seg_fundamental_2)  segs.push(`Fund 2${r.alunos_fundamental_2 ? ` (${r.alunos_fundamental_2})` : ''}`)
  if (r.seg_ensino_medio)   segs.push(`Médio${r.alunos_ensino_medio ? ` (${r.alunos_ensino_medio})` : ''}`)
  if (segs.length === 0) return <span style={{ color: '#94a3b8', fontSize: '.78rem' }}>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
      {segs.map(s => (
        <span key={s} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.2rem',
          padding: '.15rem .5rem', borderRadius: 6,
          background: 'rgba(74,143,231,.1)', color: '#1e3a8a',
          fontSize: '.7rem', fontWeight: 600,
          fontFamily: 'var(--font-inter,sans-serif)',
        }}>{s}</span>
      ))}
    </div>
  )
}

function RowDetails({ r }: { r: PreCadastro }) {
  const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
      <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.15rem' }}>{label}</div>
      <div style={{ fontSize: '.82rem', color: '#0f172a', fontWeight: 500, wordBreak: 'break-word' }}>{value ?? '—'}</div>
    </div>
  )
  return (
    <details style={{
      marginTop: '.5rem', background: '#f8fafc', borderRadius: 10, padding: '.85rem 1rem',
      border: '1px solid #e2e8f0',
    }}>
      <summary style={{
        cursor: 'pointer', fontSize: '.78rem', fontWeight: 600, color: '#4A7FDB',
        fontFamily: 'var(--font-montserrat,sans-serif)',
      }}>
        Ver detalhes completos do pré-cadastro
      </summary>

      <div style={{ marginTop: '.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.8rem 1.25rem' }}>

        <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem' }}>
          Escola
        </div>
        <Field label="CNPJ" value={r.cnpj} />
        <Field label="Razão social" value={r.razao_social} />
        <Field label="Nome fantasia" value={r.nome_fantasia} />
        <Field label="E-mail institucional" value={r.email_institucional} />
        <Field label="Endereço" value={[r.rua, r.numero, r.bairro, r.cidade, r.estado, r.cep].filter(Boolean).join(', ')} />

        <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem', marginTop: '.4rem' }}>
          Ano letivo e segmentos
        </div>
        <Field label="Formato" value={r.formato_ano_letivo} />
        <Field label="Início do ano letivo" value={r.data_inicio_letivo} />
        <Field label="Fim do ano letivo" value={r.data_fim_letivo} />
        <Field label="Total de alunos" value={totalAlunos(r)} />
        <Field label="Infantil" value={r.seg_infantil ? `${r.alunos_infantil ?? 0} alunos` : 'Não'} />
        <Field label="Fundamental 1" value={r.seg_fundamental_1 ? `${r.alunos_fundamental_1 ?? 0} alunos` : 'Não'} />
        <Field label="Fundamental 2" value={r.seg_fundamental_2 ? `${r.alunos_fundamental_2 ?? 0} alunos` : 'Não'} />
        <Field label="Ensino Médio" value={r.seg_ensino_medio ? `${r.alunos_ensino_medio ?? 0} alunos` : 'Não'} />

        <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem', marginTop: '.4rem' }}>
          Representante legal
        </div>
        <Field label="Nome completo" value={r.legal_nome} />
        <Field label="CPF" value={r.legal_cpf} />
        <Field label="E-mail (assinatura)" value={r.legal_email} />
        <Field label="WhatsApp" value={r.legal_whatsapp} />
        <Field label="Endereço" value={[r.legal_rua, r.legal_numero, r.legal_complemento, r.legal_bairro, r.legal_cidade, r.legal_estado, r.legal_cep].filter(Boolean).join(', ')} />

        <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem', marginTop: '.4rem' }}>
          Financeiro
        </div>
        <Field label="E-mail (cobrança e NF)" value={r.fin_email_cobranca} />
        <Field label="Ticket médio" value={r.ticket_medio} />

        {r.observacoes && (
          <>
            <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem', marginTop: '.4rem' }}>
              Observações
            </div>
            <div style={{ gridColumn: '1 / -1', fontSize: '.85rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{r.observacoes}</div>
          </>
        )}

        <div style={{ gridColumn: '1 / -1', fontSize: '.7rem', fontWeight: 700, color: '#4A7FDB', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid rgba(74,143,231,.2)', paddingBottom: '.3rem', marginTop: '.4rem' }}>
          Metadados
        </div>
        <Field label="ID interno" value={r.id} />
        <Field label="E-mail do responsável pelo preenchimento" value={r.resp_email} />
        <Field label="Recebido em" value={formatDataBR(r.created_at)} />
      </div>
    </details>
  )
}

export const dynamic = 'force-dynamic'

export default async function PreCadastrosPage() {
  // Usa service_role: a tabela form_precadastro_wemake tem RLS restritiva
  // (anon so pode INSERT). Esta pagina ja roda atras de auth no dashboard.
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('form_precadastro_wemake')
    .select('*')
    .order('created_at', { ascending: false })

  const registros = (data ?? []) as PreCadastro[]

  return (
    <div>
      <PageHeader
        title="Dados Proposta Comercial"
        subtitle={
          error
            ? `Erro ao carregar: ${error.message}`
            : `${registros.length} resposta${registros.length !== 1 ? 's' : ''} de escola${registros.length !== 1 ? 's' : ''}`
        }
      />

      <div style={{ padding: '0 2rem 2rem' }}>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
            padding: '.85rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '.85rem',
          }}>
            Não foi possível carregar os pré-cadastros: {error.message}
          </div>
        )}

        {!error && registros.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 1rem',
            background: '#fff', border: '1px dashed #e2e8f0', borderRadius: 14,
          }}>
            <ClipboardList size={42} color="#94a3b8" style={{ margin: '0 auto .75rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '.35rem' }}>
              Nenhum pré-cadastro recebido ainda
            </div>
            <div style={{ fontSize: '.85rem', color: '#94a3b8', maxWidth: 420, margin: '0 auto' }}>
              Compartilhe o link <span style={{ color: '#4A7FDB', fontWeight: 600 }}>/formulario</span> com as escolas interessadas. As respostas aparecem aqui automaticamente.
            </div>
          </div>
        )}

        {!error && registros.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {registros.map(r => (
              <article key={r.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '1.1rem 1.25rem',
                boxShadow: '0 1px 3px rgba(15,23,42,.04)',
              }}>
                {/* Header da escola */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '1.05rem', fontWeight: 700, color: '#0f172a',
                      fontFamily: 'var(--font-cormorant, "Georgia", serif)',
                      lineHeight: 1.25, marginBottom: '.15rem',
                    }}>
                      {r.nome_fantasia || r.razao_social || 'Escola sem nome'}
                    </h3>
                    {r.razao_social && r.razao_social !== r.nome_fantasia && (
                      <div style={{ fontSize: '.78rem', color: '#64748b' }}>{r.razao_social}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={r.status} />
                    <span style={{ fontSize: '.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
                      <CalendarDays size={11} />
                      {formatDataBR(r.created_at)}
                    </span>
                  </div>
                </div>

                {/* Linha de info principal */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '.5rem 1rem',
                  fontSize: '.8rem', color: '#475569',
                  marginTop: '.4rem',
                }}>
                  {r.cnpj && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                      <FileText size={13} color="#94a3b8" />
                      <span style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>{r.cnpj}</span>
                    </div>
                  )}
                  {(r.cidade || r.estado) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{[r.cidade, r.estado].filter(Boolean).join(' / ')}</span>
                    </div>
                  )}
                  {(r.email_institucional || r.resp_email) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', minWidth: 0 }}>
                      <Mail size={13} color="#94a3b8" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.email_institucional || r.resp_email}
                      </span>
                    </div>
                  )}
                  {r.legal_whatsapp && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                      <Phone size={13} color="#94a3b8" />
                      <span>{r.legal_whatsapp}</span>
                    </div>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                    <GraduationCap size={13} color="#94a3b8" />
                    <span><strong style={{ color: '#0f172a' }}>{totalAlunos(r)}</strong> aluno{totalAlunos(r) !== 1 ? 's' : ''}</span>
                  </div>
                  {r.ticket_medio && (
                    <div style={{ color: '#0f172a', fontWeight: 600 }}>
                      Ticket médio: <span style={{ color: '#16a34a' }}>{r.ticket_medio}</span>
                    </div>
                  )}
                </div>

                {/* Segmentos */}
                <div style={{ marginTop: '.65rem' }}>
                  <Segmentos r={r} />
                </div>

                {/* Detalhes expansíveis */}
                <RowDetails r={r} />

                {/* Ações: editar / excluir */}
                <div style={{ marginTop: '.75rem', paddingTop: '.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <PreCadastroActions registro={r} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
