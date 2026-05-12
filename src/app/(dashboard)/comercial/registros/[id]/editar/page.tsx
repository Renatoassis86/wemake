import { createClient } from '@/lib/supabase/server'
import { upsertRegistro } from '@/lib/actions'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import {
  MEIO_OPTIONS, INTERESSE_OPTIONS, PRONTIDAO_OPTIONS,
  ABERTURA_OPTIONS, ENCAMINHAMENTOS_OPTIONS, CARGO_CONTATO_OPTIONS,
} from '@/types/database'

interface Props { params: Promise<{ id: string }> }

const inp: React.CSSProperties = {
  width: '100%', padding: '.7rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.45rem',
}
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
  marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,.06)',
}
const secHdr = (c = '#d97706'): React.CSSProperties => ({
  padding: '1rem 1.75rem', borderBottom: '1px solid #f1f5f9',
  background: '#fafafa', display: 'flex', alignItems: 'center', gap: '.65rem',
})
const dot = (c = '#d97706'): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: c,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const secTitle: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#0f172a',
}
const body: React.CSSProperties = { padding: '1.5rem 1.75rem' }
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem 1.5rem' }
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 1.5rem' }

export default async function RegistroEditar({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: registro }, { data: profiles }] = await Promise.all([
    supabase.from('registros').select('*, escola:escolas(id,nome)').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  if (!registro) notFound()
  const r = registro as any

  return (
    <div>
      <PageHeader
        title="Editar Registro"
        subtitle={`${(r.escola as any)?.nome ?? '—'} · ${new Date(r.data_contato + 'T12:00:00').toLocaleDateString('pt-BR')}`}
        actions={
          <Link href={`/comercial/escolas/${r.escola_id}`} style={{ padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            ← Voltar
          </Link>
        }
      />

      <div style={{ padding: '2rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>
        <form action={upsertRegistro}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="escola_id" value={r.escola_id} />

          {/* Escola e Data */}
          <div style={card}>
            <div style={secHdr('#0f172a')}>
              <div style={{ ...dot('#0f172a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={secTitle}>Escola e Data</div>
            </div>
            <div style={body}>
              <div style={g3}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>Escola</label>
                  <div style={{ ...inp, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center' }}>{(r.escola as any)?.nome}</div>
                </div>
                <div>
                  <label style={lbl}>Data do Contato</label>
                  <input name="data_contato" type="date" style={inp} defaultValue={r.data_contato} required />
                </div>
                <div>
                  <label style={lbl}>Horário</label>
                  <input name="hora_contato" type="time" style={inp} defaultValue={r.hora_contato ?? ''} />
                </div>
                <div>
                  <label style={lbl}>Meio do Contato</label>
                  <select name="meio_contato" style={inp} defaultValue={r.meio_contato}>
                    {MEIO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pessoas */}
          <div style={card}>
            <div style={secHdr('#8b5cf6')}>
              <div style={{ ...dot('#8b5cf6'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div style={secTitle}>Pessoas do Contato</div>
            </div>
            <div style={body}>
              <div style={g3}>
                <div>
                  <label style={lbl}>Responsável</label>
                  <select name="responsavel_id" style={inp} defaultValue={r.responsavel_id ?? ''}>
                    {profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Contato na Escola</label>
                  <input name="contato_nome" style={inp} defaultValue={r.contato_nome ?? ''} />
                </div>
                <div>
                  <label style={lbl}>Cargo</label>
                  <select name="contato_cargo" style={inp} defaultValue={r.contato_cargo ?? ''}>
                    <option value="">Selecione...</option>
                    {CARGO_CONTATO_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div style={card}>
            <div style={secHdr('#0ea5e9')}>
              <div style={{ ...dot('#0ea5e9'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <div style={secTitle}>Resumo do Contato</div>
            </div>
            <div style={body}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Resumo da Conversa *</label>
                <textarea name="resumo" rows={5} style={{ ...inp, resize: 'vertical', minHeight: 120 }} required defaultValue={r.resumo} />
              </div>
              <div>
                <label style={lbl}>Notas Internas</label>
                <textarea name="notas_internas" rows={2} style={{ ...inp, resize: 'vertical' }} defaultValue={r.notas_internas ?? ''} />
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          <div style={card}>
            <div style={secHdr('#d97706')}>
              <div style={{ ...dot('#d97706'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div style={secTitle}>Diagnóstico Comercial</div>
            </div>
            <div style={body}>
              <div style={{ ...g3, marginBottom: '1.5rem' }}>
                <div>
                  <label style={lbl}>Interesse</label>
                  <select name="interesse" style={inp} defaultValue={r.interesse}>
                    {INTERESSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Prontidão</label>
                  <select name="prontidao" style={inp} defaultValue={r.prontidao}>
                    {PRONTIDAO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Abertura</label>
                  <select name="abertura" style={inp} defaultValue={r.abertura}>
                    {ABERTURA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <label style={lbl}>Encaminhamentos</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.5rem' }}>
                {ENCAMINHAMENTOS_OPTIONS.map(o => (
                  <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.75rem 1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                    <input type="checkbox" name="encaminhamentos" value={o.value}
                      defaultChecked={Array.isArray(r.encaminhamentos) && r.encaminhamentos.includes(o.value)}
                      style={{ width: 16, height: 16, accentColor: '#d97706', flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontWeight: 500 }}>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Quantitativos */}
          <div style={card}>
            <div style={secHdr('#16a34a')}>
              <div style={{ ...dot('#16a34a'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
              </div>
              <div style={secTitle}>Quantitativos de Alunos</div>
            </div>
            <div style={body}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
                {[['qtd_infantil','Infantil'],['qtd_fund1','Fund. I'],['qtd_fund2','Fund. II'],['qtd_medio','Médio']].map(([name, label]) => (
                  <div key={name}>
                    <label style={lbl}>{label}</label>
                    <input name={name} type="number" min="0" defaultValue={(r as any)[name] ?? 0}
                      style={{ ...inp, textAlign: 'center', fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div style={card}>
            <div style={secHdr('#6366f1')}>
              <div style={{ ...dot('#6366f1'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={secTitle}>Follow-up</div>
            </div>
            <div style={body}>
              <div>
                <label style={lbl}>Próximo Contato Previsto</label>
                <input name="proximo_contato" type="date" style={{ ...inp, maxWidth: 240 }} defaultValue={r.proximo_contato ?? ''} />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}>
            <button type="submit" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', padding: '.7rem 2rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: '.875rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', boxShadow: '0 4px 14px rgba(217,119,6,.35)' }}>
              Salvar Alterações
            </button>
            <Link href={`/comercial/escolas/${r.escola_id}`} style={{ padding: '.7rem 1.5rem', borderRadius: 9999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
