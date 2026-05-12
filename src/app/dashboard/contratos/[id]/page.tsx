import { createClient } from '@/infrastructure/supabase/server'
import styles from '../../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'
import { notFound } from 'next/navigation'
import { FileText, Clock } from 'lucide-react'
import { prepararAssinatura, enviarAAssinatura } from '@/app/actions'

export default async function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  // 1. Validar Tenant
  const activeCompanyId = await getValidatedCompanyId()
  const id = (await params).id;

  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, tipos_contrato(titulo), templates_contrato(titulo)')
    .eq('id', id)
    .eq('empresa_id', activeCompanyId)
    .single()

  if (!contrato) return notFound()

  // 1.1 Buscar Signatários Individuais
  const { data: signatarios } = await supabase
    .from('contrato_signatarios')
    .select('*, pessoas(nome_razao_social, email_contato)')
    .eq('contrato_id', id)

  // 2. Buscar Partes
  const { data: partes } = await supabase
    .from('contrato_partes')
    .select('*, pessoas(nome_razao_social)')
    .eq('contrato_id', id)


  // 3. Buscar Eventos
  const { data: eventos } = await supabase
    .from('eventos_contrato')
    .select('*')
    .eq('contrato_id', id)
    .order('created_at', { ascending: false })

  // 4. Buscar Aditivos
  const { data: aditivos } = await supabase
    .from('aditivos_contrato')
    .select('*')
    .eq('contrato_pai_id', id)

  // 5. Buscar Obrigações
  const { data: obrigacoes } = await supabase
    .from('obrigacoes_contrato')
    .select('*')
    .eq('contrato_id', id)


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className={styles.title}>{contrato.titulo}</h1>
          <p className={styles.subtitle}>ID: {contrato.id}</p>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: 'bold' }}>
            {contrato.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Lado Esquerdo - Conteúdo do Contrato */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Conteúdo da Minuta
          </h3>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', color: '#374151', lineHeight: '1.7', fontFamily: 'serif' }}>
            {contrato.corpo_atual || 'Conteúdo não renderizado.'}
          </div>
        </div>

        {/* Lado Direito - Metadados e Partes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Ações de Workflow */}
          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>⚙️ Ações do Contrato</h4>
            
            {contrato.status === 'gerado' && (
              <form action={prepararAssinatura}>
                <input type="hidden" name="contrato_id" value={contrato.id} />
                <button type="submit" style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Preparar para Assinatura
                </button>
              </form>
            )}

            {contrato.status === 'pronto_para_assinatura' && (
              <form action={enviarAAssinatura}>
                <input type="hidden" name="contrato_id" value={contrato.id} />
                <button type="submit" style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', background: 'var(--success)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Enviar para Assinatura
                </button>
              </form>
            )}

            {contrato.status === 'em_assinatura' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                📩 Contrato em fluxo de assinatura.
              </p>
            )}
          </div>

          {/* Informações Gerais */}
          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>Informações Gerais</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div><strong>Tipo:</strong> {contrato.tipos_contrato?.titulo || 'Geral'}</div>
              <div><strong>Template Origem:</strong> {contrato.templates_contrato?.titulo || 'Nenhum'}</div>
              <div><strong>Gerado em:</strong> {new Date(contrato.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          {/* Signatários / Fila de Assinatura */}
          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>👥 Fila de Assinatura</h4>
            {signatarios && signatarios.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {signatarios.map((s: any) => (
                  <li key={s.id} style={{ fontSize: '0.85rem', background: 'white', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{s.pessoas?.nome_razao_social}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{s.papel_assinatura}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '5px', background: s.status_assinatura === 'enviado' ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.05)', color: s.status_assinatura === 'enviado' ? 'var(--primary)' : 'var(--secondary)' }}>
                      {s.status_assinatura.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhum signatário preparado.</p>
            )}
          </div>


          {/* Obrigações */}
          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>📌 Obrigações e Prazos</h4>
            {obrigacoes && obrigacoes.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {obrigacoes.map((o: any) => (
                  <li key={o.id} style={{ fontSize: '0.85rem', background: 'white', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{o.titulo}</span>
                    <span style={{ fontSize: '0.7rem', color: '#d97706' }}>{o.data_consolidado ? new Date(o.data_consolidado).toLocaleDateString('pt-BR') : '-'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhuma obrigação ativa.</p>
            )}
          </div>

          {/* Aditivos */}
          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>📄 Aditivos Relacionados</h4>
            {aditivos && aditivos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {aditivos.map((a: any) => (
                  <li key={a.id} style={{ fontSize: '0.85rem', background: 'white', border: '1px solid var(--border)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{a.titulo}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhum aditivo.</p>
            )}
          </div>

          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} /> Histórico de Eventos
            </h4>
            {eventos && eventos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative' }}>
                {eventos.map((e: any) => (
                  <div key={e.id} style={{ fontSize: '0.75rem', color: 'var(--secondary)', borderLeft: '2px solid var(--primary)', paddingLeft: '0.8rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--foreground)' }}>{e.tipo_evento.toUpperCase()}</div>
                    <div>{e.descricao}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(e.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhum histórico.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
  
