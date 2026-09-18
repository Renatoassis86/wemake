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

const { data: escolas } = await supabase.from('escolas').select('id, nome').ilike('nome', '%farol%')
console.log('Escolas "Farol":', JSON.stringify(escolas, null, 2))

for (const e of escolas ?? []) {
  const { data: props } = await supabase
    .from('propostas')
    .select('id, escola_nome, valor_aluno_ano, num_alunos, status, arquivada_em, created_at')
    .eq('escola_id', e.id)
    .order('created_at', { ascending: false })
  console.log(`\nPropostas de "${e.nome}" (${e.id}):`, JSON.stringify(props, null, 2))
}

// Também busca por nome (caso alguma proposta não tenha escola_id vinculado)
const { data: propsPorNome } = await supabase
  .from('propostas')
  .select('id, escola_id, escola_nome, valor_aluno_ano, num_alunos, status, arquivada_em, created_at')
  .ilike('escola_nome', '%farol%')
  .order('created_at', { ascending: false })
console.log('\nPropostas com "farol" no nome (independente de escola_id):', JSON.stringify(propsPorNome, null, 2))
