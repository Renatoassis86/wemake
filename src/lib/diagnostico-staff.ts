import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados } from '@/lib/diagnostico-auth'
import { BUCKET, mapaDeCompras, mapaDePareceres, mapaDeRespostas, type CompraBanco, type ParecerBanco, type Respostas, type RespostaBanco, type StatusDiagnostico } from '@/lib/diagnostico'
import { calcTotalAlunosContrato } from '@/lib/contratos'

/** O usuário logado pode ver os diagnósticos? (lista em ACADEMIA_DIAGNOSTICO_EMAILS) */
export async function podeVerDiagnosticos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user?.email && emailsAutorizados().includes(user.email.toLowerCase())
}

export interface DiagnosticoLinha {
  id: string
  implantacao_id: string | null
  escola_nome: string
  status: StatusDiagnostico
  num_alunos: number | null
  respostas: Respostas
  parecer: Respostas
  compras: Respostas
  ultima_atividade: string | null
  enviado_em: string | null
  expira_em: string
  created_at: string
  link_token?: string
  pin_atual?: string | null
  portal_email?: string | null
  portal_senha_atual?: string | null
  /** Dados da escola (via implantação) pra identificar qual escola é esse diagnóstico. */
  cidade_uf?: string | null
  alunos_contrato?: number | null
}

export interface ArquivoStaff {
  id: string
  evidencia_key: string
  nome: string
  mime: string | null
  tamanho: number | null
  url: string | null
}

const FALTA_TABELA = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST205' || e.code === '42P01' || /does not exist|schema cache|Could not find the table/i.test(e.message ?? ''))

export async function listarDiagnosticos(): Promise<{ setup: boolean; erro?: string; itens: DiagnosticoLinha[] }> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('academia_diagnosticos')
    .select('id, implantacao_id, escola_nome, status, num_alunos, ultima_atividade, enviado_em, expira_em, created_at, link_token, portal_email, portal_senha_atual')
    .order('created_at', { ascending: false })
  if (FALTA_TABELA(error)) return { setup: true, itens: [] }
  if (error) return { setup: false, erro: error.message, itens: [] }

  // só o essencial para contar o que foi respondido
  const { data: linhas, error: e2 } = await db.from('academia_diag_respostas').select('diagnostico_id, item_key, resposta, possui')
  if (FALTA_TABELA(e2)) return { setup: true, itens: [] }
  const porDiag = new Map<string, Respostas>()
  for (const l of (linhas ?? []) as { diagnostico_id: string; item_key: string; resposta: string | null; possui: string | null }[]) {
    const m = porDiag.get(l.diagnostico_id) ?? {}
    if (l.resposta) m[l.item_key] = l.resposta
    if (l.possui) m[l.item_key + '.p'] = l.possui
    porDiag.set(l.diagnostico_id, m)
  }

  // dados da escola (cidade/UF e alunos com contrato assinado), pra identificar qual escola é cada diagnóstico
  const implantacaoIds = [...new Set((data ?? []).map(d => d.implantacao_id).filter(Boolean) as string[])]
  const porImplantacao = new Map<string, { escola_id: string | null; cidade_uf: string | null }>()
  if (implantacaoIds.length) {
    const { data: implant } = await db.from('academia_implantacoes').select('id, escola_id, cidade_uf').in('id', implantacaoIds)
    for (const i of (implant ?? []) as { id: string; escola_id: string | null; cidade_uf: string | null }[]) {
      porImplantacao.set(i.id, { escola_id: i.escola_id, cidade_uf: i.cidade_uf })
    }
  }
  const escolaIds = [...new Set([...porImplantacao.values()].map(v => v.escola_id).filter(Boolean) as string[])]
  const alunosPorEscola = new Map<string, number>()
  if (escolaIds.length) {
    const { data: contr } = await db.from('contratos').select('*').in('escola_id', escolaIds).eq('contrato_assinado', true)
    for (const c of (contr ?? []) as Record<string, unknown>[]) {
      const escolaId = c.escola_id as string
      alunosPorEscola.set(escolaId, (alunosPorEscola.get(escolaId) ?? 0) + calcTotalAlunosContrato(c))
    }
  }

  return {
    setup: false,
    itens: (data ?? []).map(d => {
      const impl = d.implantacao_id ? porImplantacao.get(d.implantacao_id) : undefined
      return {
        ...d,
        respostas: porDiag.get(d.id) ?? {},
        parecer: {},
        compras: {},
        cidade_uf: impl?.cidade_uf ?? null,
        alunos_contrato: impl?.escola_id ? (alunosPorEscola.get(impl.escola_id) ?? 0) : null,
      }
    }) as DiagnosticoLinha[],
  }
}

export async function carregarDiagnostico(id: string) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('academia_diagnosticos')
    .select('id, implantacao_id, escola_nome, status, num_alunos, ultima_atividade, enviado_em, expira_em, created_at, link_token, pin_atual, portal_email, portal_senha_atual')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  const [{ data: resp }, { data: par }, { data: compras }] = await Promise.all([
    db.from('academia_diag_respostas').select('item_key, resposta, detalhe, anexo_link, observacao, possui, qtd_existente, marca_obs').eq('diagnostico_id', id),
    db.from('academia_diag_pareceres').select('item_key, status_parecer, observacao, qtd_aproveitavel, acao, texto, qtd_recomendada').eq('diagnostico_id', id),
    db.from('academia_diag_compras').select('item_key, situacao, melhor_loja, melhor_produto, melhor_item_exato, melhor_preco, melhor_link, ml_preco, ml_link, amazon_preco, amazon_link, link_original_loja, link_original_situacao, link_original_preco, link_original_url').eq('diagnostico_id', id),
  ])

  const { data: arqs } = await db
    .from('academia_diagnostico_arquivos')
    .select('id, evidencia_key, nome, mime, tamanho, path')
    .eq('diagnostico_id', id)
    .order('created_at')
  const lista = arqs ?? []
  const urls = lista.length ? await db.storage.from(BUCKET).createSignedUrls(lista.map(a => a.path), 3600) : { data: [] as { path: string | null; signedUrl: string }[] }
  const porPath = new Map((urls.data ?? []).map(u => [u.path, u.signedUrl]))
  const arquivos: ArquivoStaff[] = lista.map(a => ({
    id: a.id, evidencia_key: a.evidencia_key, nome: a.nome, mime: a.mime, tamanho: a.tamanho, url: porPath.get(a.path) ?? null,
  }))
  return {
    diagnostico: {
      ...data,
      respostas: mapaDeRespostas((resp ?? []) as RespostaBanco[]),
      parecer: mapaDePareceres((par ?? []) as ParecerBanco[]),
      compras: mapaDeCompras((compras ?? []) as CompraBanco[]),
    } as DiagnosticoLinha,
    arquivos,
  }
}
