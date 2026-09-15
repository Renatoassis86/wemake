'use server'

import { createClient } from '@/lib/supabase/server'

// Login roda no servidor (Vercel) em vez do navegador do usuário — evita
// depender do navegador conseguir resolver o domínio do Supabase via DNS.
// A Vercel já provou resolver o Supabase de forma confiável; a rede local
// do usuário pode falhar nisso mesmo com credenciais corretas.
export async function signIn(emailOrUsuario: string, password: string) {
  const email = emailOrUsuario.includes('@') ? emailOrUsuario : `${emailOrUsuario}@wemake.tec.br`
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const credenciaisInvalidas = /invalid|credentials/i.test(error.message)
    return {
      error: credenciaisInvalidas
        ? 'Usuário ou senha inválidos.'
        : `Não foi possível entrar agora (erro do servidor): ${error.message}`,
    }
  }

  return { error: null }
}
