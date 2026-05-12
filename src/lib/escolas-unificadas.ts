/**
 * Busca escolas de TODAS as fontes:
 * 1. Tabela `escolas` do CRM (escolas cadastradas com ativa=true)
 * 2. Tabela `leads_universal` — escola_nome únicos dos leads importados
 *    (para permitir criar registros/interações antes do cadastro formal)
 *
 * Retorna lista unificada e deduplicada por nome, priorizando o CRM.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface EscolaOpcao {
  id: string           // UUID real (CRM) ou pseudo-id para leads
  nome: string
  cidade: string | null
  estado: string | null
  origem: 'crm' | 'lead'  // indica de onde veio
}

/**
 * Busca escolas do banco oficial (tabela `escolas`).
 * O banco de leads (leads_universal) é fonte de importação —
 * use /api/migrar-leads-escolas para transferir leads → escolas.
 */
export async function buscarEscolasUnificadas(
  supabase: SupabaseClient,
): Promise<EscolaOpcao[]> {
  const { data: escolasCRM } = await supabase
    .from('escolas')
    .select('id, nome, cidade, estado')
    .eq('ativa', true)
    .order('nome')

  return (escolasCRM ?? []).map((e: any) => ({
    id:     e.id,
    nome:   e.nome,
    cidade: e.cidade,
    estado: e.estado,
    origem: 'crm' as const,
  }))
}
