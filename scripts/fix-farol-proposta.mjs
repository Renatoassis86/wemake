import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Proposta errada: R$400, nome salvo como "Rejane Amaral de Queiroz Murta"
// (nome da contato, não da escola) — criada por engano em 09/08/2026.
const PROPOSTA_ERRADA_ID = '6d818cfb-2e71-4c17-958d-98c7b4a9cbb3'

const { data, error } = await supabase
  .from('propostas')
  .update({ arquivada_em: new Date().toISOString() })
  .eq('id', PROPOSTA_ERRADA_ID)
  .select('id, escola_nome, valor_aluno_ano, arquivada_em')
  .single()

if (error) throw new Error(error.message)
console.log('Proposta arquivada:', JSON.stringify(data, null, 2))

// Confere que a proposta de R$345 ficou como a ativa/mais recente não-arquivada
const { data: ativas } = await supabase
  .from('propostas')
  .select('id, escola_nome, valor_aluno_ano, created_at')
  .eq('escola_id', 'bb96694e-37d3-4039-a0e3-78814a477dc6')
  .is('arquivada_em', null)
  .order('created_at', { ascending: false })
console.log('\nPropostas ativas restantes pra Instituto Cristão de Educação Farol:', JSON.stringify(ativas, null, 2))
