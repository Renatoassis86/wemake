import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase publico (anon) sem cookies de sessao.
 * Use SOMENTE para operacoes publicas (ex.: formulario de pre-cadastro
 * que aceita anonimos). Garante que toda chamada use a role 'anon' mesmo
 * se houver cookies residuais que confundam o @supabase/ssr.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
