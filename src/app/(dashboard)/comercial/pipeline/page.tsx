import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { AdicionarNegociacaoBtn } from '@/components/comercial/AdicionarNegociacaoBtn'
import { PipelineBoard } from '@/components/comercial/PipelineBoard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props { searchParams: Promise<{ view?: string; responsavel?: string; t?: string }> }

export default async function PipelinePage({ searchParams }: Props) {
  const params     = await searchParams
  const viewMode   = params.view        ?? 'kanban'
  const filtroResp = params.responsavel ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Escolas para o seletor — isso pode ser cacheado, são metadados
  const { data: escolas } = await supabase
    .from('escolas')
    .select('id, nome, cidade, estado')
    .eq('ativa', true)
    .order('nome')

  return (
    <div>
      <PageHeader
        title="Pipeline Comercial"
        actions={
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <AdicionarNegociacaoBtn escolas={escolas ?? []} userId={user?.id ?? ''} />
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
              {[
                { v: 'kanban',    label: 'Kanban' },
                { v: 'consultor', label: 'Consultores' },
              ].map(t => (
                <Link key={t.v}
                  href={`/comercial/pipeline?view=${t.v}${filtroResp ? `&responsavel=${filtroResp}` : ''}`}
                  style={{
                    padding: '5px 11px', borderRadius: 6, textDecoration: 'none',
                    fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                    background: viewMode === t.v ? '#fff' : 'transparent',
                    color: viewMode === t.v ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === t.v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <div className="mp-page-padding-x" style={{ padding: '1rem 1.25rem' }}>
        {/* PipelineBoard é Client Component — busca dados diretamente no browser, sem cache SSR */}
        <PipelineBoard
          escolas={escolas ?? []}
          userId={user?.id ?? ''}
          viewMode={viewMode}
          filtroResp={filtroResp}
        />
      </div>
    </div>
  )
}
