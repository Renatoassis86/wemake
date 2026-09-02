import PageHeader from '@/components/layout/PageHeader'
import { getFollowupPropostas } from '@/lib/followup'
import { FollowupTable } from '@/components/comercial/FollowupTable'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
  borderTop: '3px solid', padding: '1rem 1.25rem',
  boxShadow: '0 1px 4px rgba(15,23,42,.04)',
}

export default async function FollowupPage() {
  const linhas = await getFollowupPropostas()

  const comContato = linhas.filter(l => l.email || l.telefone).length
  const comStatus = linhas.filter(l => l.statusAutomatico || l.notaManual).length
  const semStatus = linhas.length - comStatus
  const valorTotal = linhas.reduce((s, l) => s + (l.valorContrato ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Follow-up de Propostas"
        subtitle="Toda escola que já recebeu proposta comercial, para retomar contato"
      />

      <div className="mp-page-padding-x" style={{ padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          <div style={{ ...card, borderTopColor: '#4A7FDB' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.4rem' }}>Escolas com Proposta</div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{linhas.length}</div>
          </div>
          <div style={{ ...card, borderTopColor: '#16a34a' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#16a34a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.4rem' }}>Com Dado de Contato</div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{comContato}</div>
          </div>
          <div style={{ ...card, borderTopColor: '#b45309' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#b45309', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.4rem' }}>Sem Status Registrado</div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{semStatus}</div>
          </div>
          <div style={{ ...card, borderTopColor: '#7c3aed' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#7c3aed', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.4rem' }}>Valor em Acompanhamento</div>
            <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(valorTotal)}</div>
          </div>
        </div>

        <FollowupTable linhas={linhas} />

      </div>
    </div>
  )
}
