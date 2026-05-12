import { createClient } from '@/infrastructure/supabase/server'
import styles from '../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'
import Link from 'next/link'
import TemplateActions from '@/components/templates/TemplateActions'

export const dynamic = 'force-dynamic'



export default async function TemplatesPage() {
  const supabase = await createClient()

  // 1. Obter Empresa Ativa Validada
  const activeCompanyId = await getValidatedCompanyId()

  let templates: any[] = []

  if (activeCompanyId) {
    const { data } = await supabase
      .from('templates_contrato')
      .select('*, tipos_contrato(titulo)')
      .eq('empresa_id', activeCompanyId)
    templates = data || []
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F4F2ED', letterSpacing: '-0.025em' }}>Documentos e Templates</h1>
        <p style={{ color: '#C8F542', fontSize: '0.75rem', fontWeight: 800, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Objetivo do Módulo</p>
        <p style={{ color: '#8A8F99', fontSize: '0.875rem', marginTop: '0.2rem', maxWidth: '650px', lineHeight: '1.4' }}>
          Criar, editar e padronizar modelos de documentos e minutas (Contratos, Certificados, Atas) utilizando variáveis de preenchimento automatizado e rastreamento de versões.
        </p>
      </div>






      {!activeCompanyId && (
        <p style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
          ⚠️ Selecione ou Cadastre uma empresa para listar os templates.
        </p>
      )}

      {activeCompanyId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <Link href="/dashboard/templates/novo" className={styles.companySwitcher} style={{ background: 'var(--primary)', color: 'white', border: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              + Novo Template
            </Link>

          </div>


          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            {templates.length === 0 ? (
              <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>Nenhum template cadastrado para esta empresa.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Título</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Tipo</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Versão</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Status</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)', textAlign: 'center' }}>Ações</th>
                  </tr>

                </thead>
                <tbody>
                  {templates.map((t: any) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{t.titulo}</td>
                      <td style={{ padding: '0.75rem 0' }}>{t.tipos_contrato?.titulo || '-'}</td>
                      <td style={{ padding: '0.75rem 0' }}>{t.versao || '1.0.0'}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '5px' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                        <TemplateActions templateId={t.id} titulo={t.titulo} />
                      </td>

                    </tr>

                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
  
