import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailsAutorizados } from '@/lib/diagnostico-auth'
import { BUCKET, type Respostas, type StatusDiagnostico } from '@/lib/diagnostico'

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
  const { data, error } = await createAdminClient()
    .from('academia_diagnosticos')
    .select('id, implantacao_id, escola_nome, status, respostas, parecer, ultima_atividade, enviado_em, expira_em, created_at')
    .order('created_at', { ascending: false })
  if (FALTA_TABELA(error)) return { setup: true, itens: [] }
  if (error) return { setup: false, erro: error.message, itens: [] }
  return { setup: false, itens: (data ?? []) as DiagnosticoLinha[] }
}

export async function carregarDiagnostico(id: string) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('academia_diagnosticos')
    .select('id, implantacao_id, escola_nome, status, respostas, parecer, ultima_atividade, enviado_em, expira_em, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null

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
  return { diagnostico: data as DiagnosticoLinha, arquivos }
}
