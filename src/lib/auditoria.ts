import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Registra no audit_log quem fez o quê. Usa o service role porque a tabela tem RLS e as gravações
 * do usuário comum eram recusadas em silêncio (a tela de auditoria nunca mostrou nada).
 * Nunca lança erro: falhar em auditar não pode impedir a ação do usuário.
 */
export async function auditar(
  user: { id: string; email?: string | null } | null,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  tabela: string,
  registroId: string | null,
  novo: unknown = null,
  antigo: unknown = null,
) {
  try {
    const { error } = await createAdminClient().from('audit_log').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      action,
      table_name: tabela,
      record_id: registroId,
      new_data: novo,
      old_data: antigo,
    })
    if (error) console.error('[auditar]', error.message)
  } catch (e) {
    console.error('[auditar]', e)
  }
}
