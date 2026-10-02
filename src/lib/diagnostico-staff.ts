import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados } from '@/lib/diagnostico-auth'
import { BUCKET, mapaDePareceres, mapaDeRespostas, type ParecerBanco, type Respostas, type RespostaBanco, type StatusDiagnostico } from '@/lib/diagnostico'

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
  respostas: Respostas
  parecer: Respostas
  ultima_atividade: string | null
  enviado_em: string | null
  expira_em: string
  created_at: string
  link_token?: string
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
    .select('id, implantacao_id, escola_nome, status, ultima_atividade, enviado_em, expira_em, created_at, link_token')
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
  return {
    setup: false,
    itens: (data ?? []).map(d => ({ ...d, respostas: porDiag.get(d.id) ?? {}, parecer: {} })) as DiagnosticoLinha[],
  }
}

export async function carregarDiagnostico(id: string) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('academia_diagnosticos')
    .select('id, implantacao_id, escola_nome, status, ultima_atividade, enviado_em, expira_em, created_at, link_token')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  const [{ data: resp }, { data: par }] = await Promise.all([
    db.from('academia_diag_respostas').select('item_key, resposta, detalhe, anexo_link, observacao, possui, qtd_existente, marca_obs').eq('diagnostico_id', id),
    db.from('academia_diag_pareceres').select('item_key, status_parecer, observacao, qtd_aproveitavel, acao, texto').eq('diagnostico_id', id),
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
    diagnostico: { ...data, respostas: mapaDeRespostas((resp ?? []) as RespostaBanco[]), parecer: mapaDePareceres((par ?? []) as ParecerBanco[]) } as DiagnosticoLinha,
    arquivos,
  }
}
