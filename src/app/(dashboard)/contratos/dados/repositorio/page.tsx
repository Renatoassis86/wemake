import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContratoUpload } from '@/components/comercial/ContratoUpload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Repositório de contratos · We Make' }

export default async function RepositorioContratosPage() {
  const admin = createAdminClient()

  const { data: contratos } = await admin
    .from('contratos')
    .select('escola_id')
    .or('contrato_assinado.eq.true,contrato_enviado.eq.true')
    .eq('declinou', false)

  const escolaIds = [...new Set((contratos ?? []).map(c => c.escola_id))]

  const { data: escolasRaw } = escolaIds.length
    ? await admin.from('escolas').select('id, nome').in('id', escolaIds)
    : { data: [] as { id: string; nome: string }[] }
  const escolas = (escolasRaw ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const { data: arquivosRaw } = escolaIds.length
    ? await admin.from('contratos_arquivos').select('id, escola_id, nome, path, tamanho, created_at').in('escola_id', escolaIds).order('created_at', { ascending: false })
    : { data: [] as any[] }

  const arquivosPorEscola = new Map<string, { id: string; nome: string; url: string; criado_em: string; tamanho?: number }[]>()
  for (const a of arquivosRaw ?? []) {
    const { data } = admin.storage.from('documentos-oficiais').getPublicUrl(a.path)
    const lista = arquivosPorEscola.get(a.escola_id) ?? []
    lista.push({ id: a.id, nome: a.nome, url: data.publicUrl, criado_em: a.created_at, tamanho: a.tamanho })
    arquivosPorEscola.set(a.escola_id, lista)
  }

  return (
    <section aria-label="Repositório de contratos">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/contratos/dados" style={{ fontSize: '.8rem', color: '#00889e', fontWeight: 600 }}>← Voltar pros dados dos contratos</Link>
      </div>
      <p className="ac-sec-lead">
        Anexe aqui o PDF do contrato assinado de cada escola — o arquivo fica guardado na plataforma, sem depender só do
        link do Google Drive. Clique no nome da escola para abrir o repositório dela e enviar o documento.
      </p>

      {escolas.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '.85rem' }}>Nenhuma escola com contrato assinado ou enviado ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {escolas.map(e => {
            const arquivos = arquivosPorEscola.get(e.id) ?? []
            return (
              <details key={e.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                <summary style={{
                  cursor: 'pointer', padding: '.9rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, fontSize: '.88rem', color: '#002933',
                }}>
                  <span>{e.nome}</span>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700, color: arquivos.length ? '#15803d' : '#94a3b8',
                    background: arquivos.length ? '#f0fdf4' : '#f8fafc', border: `1px solid ${arquivos.length ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: 999, padding: '.15rem .6rem',
                  }}>
                    {arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''}
                  </span>
                </summary>
                <div style={{ padding: '0 1.1rem 1.1rem', borderTop: '1px solid #f1f5f9' }}>
                  <ContratoUpload escolaId={e.id} escolaNome={e.nome} arquivosExistentes={arquivos} />
                </div>
              </details>
            )
          })}
        </div>
      )}
    </section>
  )
}
