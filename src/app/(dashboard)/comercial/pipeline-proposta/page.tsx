import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import { PipelinePropostaBoard } from '@/components/comercial/PipelinePropostaBoard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PipelinePropostaPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Buscar todos os pré-cadastros (fonte primária)
  const { data: precadastros } = await admin
    .from('form_precadastro_wemake')
    .select('id, nome_fantasia, razao_social, cidade, estado, created_at')
    .order('created_at', { ascending: false })

  // Buscar estados do pipeline (armazenados em leads_universal)
  const { data: leads } = await supabase
    .from('leads_universal')
    .select('id, dados_extras')
    .eq('fonte', 'formulario_wemake')

  // Mapear precadastro_id -> dados_extras do pipeline
  const estadoMap: Record<string, any> = {}
  for (const lead of leads ?? []) {
    const pid = (lead.dados_extras as any)?.precadastro_id
    if (pid) estadoMap[pid] = { lead_id: lead.id, ...(lead.dados_extras as any) }
  }

  // Montar cards mesclando pré-cadastro + estado do pipeline
  const cards = (precadastros ?? []).map(p => ({
    precadastro_id: p.id,
    lead_id: estadoMap[p.id]?.lead_id ?? null,
    escola_nome: p.nome_fantasia || p.razao_social || '(sem nome)',
    cidade: p.cidade,
    estado: p.estado,
    pipeline_stage:        estadoMap[p.id]?.pipeline_stage        ?? 'precadastro_recebido',
    pipeline_comentarios:  estadoMap[p.id]?.pipeline_comentarios  ?? [],
    pipeline_tags:         estadoMap[p.id]?.pipeline_tags         ?? [],
    pipeline_responsaveis: estadoMap[p.id]?.pipeline_responsaveis ?? [],
    pipeline_due_date:     estadoMap[p.id]?.pipeline_due_date     ?? null,
    pipeline_anexos:       estadoMap[p.id]?.pipeline_anexos       ?? [],
    created_at: p.created_at,
  }))

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
        {cards.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#f8fafc', border: '1.5px dashed #e2e8f0',
            borderRadius: 16, color: '#94a3b8',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#475569', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.5rem' }}>
              Nenhum pré-cadastro recebido ainda
            </div>
            <div style={{ fontSize: '.8rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
              As escolas que preencherem o formulário de pré-cadastro aparecerão aqui automaticamente.
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
              Arraste os cards entre colunas ou clique neles para adicionar comentários e histórico.
            </div>
            <PipelinePropostaBoard cards={cards} />
          </>
        )}
      </div>
    </div>
  )
}
