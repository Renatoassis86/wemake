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

const NOMES = [
  'CCIM', 'Colégio Ouro Preto', 'Filadélfia', 'Educação Farol',
  'Escola Fundamento', 'Confessional Cristão', 'Escola Supremo',
  'For Life School', 'LIGHT CHRISTIAN', 'Colégio Oficina',
  'Luterana Edificar', 'Anima School', 'Batista Conectar',
]

async function main() {
  for (const termo of NOMES) {
    const { data, error } = await supabase
      .from('propostas')
      .select('id, escola_nome, num_alunos, valor_aluno_ano, valor_aluno_ano_comodato, tipo, seg_infantil, seg_fundamental_1, seg_fundamental_2, seg_ensino_medio, status, created_at')
      .ilike('escola_nome', `%${termo}%`)
      .order('created_at', { ascending: false })
    if (error) { console.log(`ERRO (${termo}):`, error.message); continue }
    if (!data || data.length === 0) { console.log(`\n[${termo}] — NENHUMA PROPOSTA ENCONTRADA`); continue }
    console.log(`\n[${termo}] — ${data.length} resultado(s)`)
    data.forEach(p => console.log('  ', JSON.stringify(p)))
  }
}

main().catch(err => { console.error('FALHOU:', err.message); process.exit(1) })
