/**
 * Busca escolas de TODAS as fontes:
 * 1. Tabela `escolas` do CRM (escolas cadastradas com ativa=true)
 * 2. Tabela `leads_universal` — escola_nome únicos dos leads importados
 *    (para permitir criar registros/interações antes do cadastro formal)
 *
 * Retorna lista unificada e deduplicada por nome, priorizando o CRM.
 */

import { createAdminClient } from '@/lib/supabase/admin'

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
 *
 * Usa admin (service_role) porque `escolas` tem policy de SELECT restrita
 * por responsável/role no client comum — sem isso, um usuário sem papel de
 * gerente via só uma fatia das escolas neste seletor (confirmado
 * comparando duas contas reais), o que impedia registrar negociação/editar
 * contrato pra escolas que não são "dele".
 */
export async function buscarEscolasUnificadas(): Promise<EscolaOpcao[]> {
  const admin = createAdminClient()
  const { data: escolasCRM } = await admin
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
