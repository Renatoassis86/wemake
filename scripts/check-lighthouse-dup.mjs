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

const { data: escolas } = await supabase.from('escolas').select('id, nome, created_at').ilike('nome', '%lighthouse%')
console.log('Escolas "Lighthouse":', JSON.stringify(escolas, null, 2))

for (const e of escolas ?? []) {
  const { data: negs } = await supabase.from('negociacoes').select('id, stage, ativa, created_at').eq('escola_id', e.id)
  const { data: regs } = await supabase.from('registros').select('id, data_contato').eq('escola_id', e.id)
  console.log(`\nEscola ${e.nome} (${e.id}):`)
  console.log('  negociações:', JSON.stringify(negs))
  console.log('  registros:', JSON.stringify(regs))
}
