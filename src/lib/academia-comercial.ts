import { createAdminClient } from '@/lib/supabase/admin'
import { calcTotalAlunosContrato } from '@/lib/contratos'

/** Dados do Comercial que a Academia reaproveita: escolas com contrato assinado e a ficha de cada uma. */

export interface EscolaAssinada {
  id: string
  nome: string
  cidade_uf: string
  responsavel_comercial: string
}

export async function carregarAssinadas(): Promise<EscolaAssinada[]> {
  const db = createAdminClient()
  const { data: contratos } = await db.from('contratos').select('escola_id').eq('contrato_assinado', true).or('declinou.is.null,declinou.eq.false')
  const ids = [...new Set((contratos ?? []).map((c: { escola_id: string | null }) => c.escola_id).filter(Boolean) as string[])]
  if (!ids.length) return []
  const { data: escolas } = await db.from('escolas').select('id, nome, cidade, estado, responsavel_id').in('id', ids).order('nome')
  const resp = [...new Set((escolas ?? []).map((e: { responsavel_id: string | null }) => e.responsavel_id).filter(Boolean) as string[])]
  const nomes = new Map<string, string>()
  if (resp.length) {
    const { data: us } = await db.from('usuarios').select('id, nome_completo').in('id', resp)
    ;(us ?? []).forEach((u: { id: string; nome_completo: string | null }) => nomes.set(u.id, u.nome_completo ?? ''))
  }
  return ((escolas ?? []) as { id: string; nome: string; cidade: string | null; estado: string | null; responsavel_id: string | null }[]).map(e => ({
    id: e.id,
    nome: e.nome,
    cidade_uf: [e.cidade, e.estado].filter(Boolean).join('/'),
    responsavel_comercial: nomes.get(e.responsavel_id ?? '') ?? '',
  }))
}

export interface FichaComercial {
  escola: {
    id: string; nome: string; cnpj: string | null; cidade_uf: string; telefone: string | null; email: string | null
    contato_nome: string | null; contato_cargo: string | null; diretor_nome: string | null; total_alunos: number
  }
  responsavel_comercial: string
  contrato: null | {
    assinado: boolean
    declinou: boolean
    anos: number | null
    alunos: number
    livro_impresso: boolean
    implantacao_status: 'nao_iniciada' | 'em_andamento' | 'concluida' | null
    implantacao_iniciada_em: string | null
    implantacao_concluida_em: string | null
    encaminhamento_final: string | null
  }
}

export async function carregarFichaComercial(escolaId: string): Promise<FichaComercial | null> {
  const db = createAdminClient()
  const { data: e } = await db.from('escolas').select('*').eq('id', escolaId).maybeSingle()
  if (!e) return null
  const [{ data: c }, { data: u }] = await Promise.all([
    db.from('contratos').select('*').eq('escola_id', escolaId).order('contrato_assinado', { ascending: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    e.responsavel_id ? db.from('usuarios').select('nome_completo').eq('id', e.responsavel_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return {
    escola: {
      id: e.id, nome: e.nome, cnpj: e.cnpj, cidade_uf: [e.cidade, e.estado].filter(Boolean).join('/'), telefone: e.telefone, email: e.email,
      contato_nome: e.contato_nome, contato_cargo: e.contato_cargo, diretor_nome: e.diretor_nome, total_alunos: e.total_alunos ?? 0,
    },
    responsavel_comercial: (u as { nome_completo: string | null } | null)?.nome_completo ?? '',
    contrato: c ? {
      assinado: !!c.contrato_assinado,
      declinou: !!c.declinou,
      anos: c.tempo_contrato ?? null,
      alunos: calcTotalAlunosContrato(c),
      livro_impresso: !!c.livro_impresso,
      implantacao_status: c.implantacao_status ?? null,
      implantacao_iniciada_em: c.implantacao_iniciada_em ?? null,
      implantacao_concluida_em: c.implantacao_concluida_em ?? null,
      encaminhamento_final: c.encaminhamento_final ?? null,
    } : null,
  }
}
