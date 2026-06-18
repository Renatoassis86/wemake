import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import { PipelinePropostaBoard } from '@/components/comercial/PipelinePropostaBoard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PipelinePropostaPage() {
  const supabase = await createClient()

  const { data: cards } = await supabase
    .from('leads_universal')
    .select('id, escola_nome, cidade, estado, dados_extras, created_at')
    .eq('fonte', 'formulario_wemake')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Pipeline de Proposta"
        subtitle="Acompanhe o andamento das propostas financeiras por escola"
        actions={
          <Link
            href="/comercial/pre-cadastros"
            style={{
              padding: '.45rem 1rem', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#475569', textDecoration: 'none',
              fontSize: '.82rem', fontWeight: 600,
              fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
            Dados Proposta Comercial
          </Link>
        }
      />

      <div style={{ padding: '0 1.5rem 2rem' }}>
        {(!cards || cards.length === 0) ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#f8fafc', border: '1.5px dashed #e2e8f0',
            borderRadius: 16, color: '#94a3b8',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem' }}>
              Nenhuma escola no pipeline ainda
            </div>
            <div style={{ fontSize: '.8rem', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '1rem' }}>
              Vá em{' '}
              <Link href="/comercial/pre-cadastros" style={{ color: '#4A7FDB', fontWeight: 600 }}>
                Dados Proposta Comercial
              </Link>
              {' '}e clique em{' '}
              <strong>Sincronizar com Banco de Leads</strong>
              {' '}para importar as escolas que preencheram o formulário.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              marginBottom: '1rem', padding: '.6rem 1rem',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, fontSize: '.78rem', color: '#1e40af',
              fontFamily: 'var(--font-inter,sans-serif)',
            }}>
              <strong>{cards.length}</strong> escola{cards.length !== 1 ? 's' : ''} no pipeline.
              Arraste os cards entre colunas ou clique neles para adicionar comentários.
              Novas escolas do formulário aparecem automaticamente em <strong>Pré-cadastro Recebido</strong>.
            </div>
            <PipelinePropostaBoard cards={cards as any} />
          </>
        )}
      </div>
    </div>
  )
}
