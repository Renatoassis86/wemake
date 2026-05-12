import { createClient } from '@/infrastructure/supabase/server'
import styles from '../../../dashboard.module.css'
import Link from 'next/link'
import { FileDown, Clock, Archive } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DetalheDocumentoPage({ params }: PageProps) {
  const id = (await params).id
  const supabase = await createClient()

  // 1. Buscar Contrato/Documento
  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, templates_contrato(*)')
    .eq('id', id)
    .single()

  const { data: arquivos } = await supabase
    .from('arquivos_contrato')
    .select('*')
    .eq('contrato_id', id)
    .order('created_at', { ascending: false })

  if (!contrato) return <p>Documento não encontrado.</p>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className={styles.title}>{contrato.titulo}</h1>
      <p className={styles.subtitle}>Documento emitido com base no template <strong>{contrato.templates_contrato?.titulo}</strong>.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '1.5rem' }}>
        {/* Esquerda: Dados do Preenchimento */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.2rem' }}>Metadados / Preenchimento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.entries(contrato.dados_preenchimento || {}).map(([key, value]) => (
              <div key={key} style={{ paddingBottom: '0.4rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</strong>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{String(value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Direita: Ações de Exportação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Gerar Arquivo Oficial</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              <a href={`/api/documentos/${id}/gerar?format=pdf`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#e11d48', color: 'white', textDecoration: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                <FileDown size={18} /> Exportar como PDF
              </a>

              <a href={`/api/documentos/${id}/gerar?format=docx`} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', textDecoration: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                <FileDown size={18} /> Exportar como DOCX
              </a>

            </div>
          </div>

          {/* Logs de Geração */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Archive size={16} /> Arquivos Gerados</h4>
            {arquivos?.length === 0 ? <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Nenhum arquivo gravado no histórico.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {arquivos?.map((a: any) => (
                  <div key={a.id} style={{ fontSize: '0.75rem', background: 'var(--sidebar)', padding: '0.4rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>{a.tipo_arquivo.toUpperCase()}</span>
                    <span style={{ color: 'var(--secondary)' }}>{new Date(a.created_at).toLocaleTimeString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
  
