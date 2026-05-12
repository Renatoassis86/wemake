import PageHeader from '@/components/layout/PageHeader'
import { ImportacaoClient } from '@/components/importacao/ImportacaoClient'

export default function ImportacaoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader
        title="Importação de Dados"
        subtitle="Importe planilhas e selecione as colunas desejadas"
      />
      <div style={{ padding: '1.5rem 1.75rem', maxWidth: '100%', overflowX: 'hidden' }}>
        <ImportacaoClient />
      </div>
    </div>
  )
}
