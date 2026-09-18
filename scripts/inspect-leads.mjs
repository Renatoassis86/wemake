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

const { data, error, count } = await supabase.from('leads_universal').select('*', { count: 'exact' }).limit(5)
if (error) throw new Error(error.message)
console.log('Total de linhas:', count)
console.log('Colunas de exemplo:', data.length ? Object.keys(data[0]) : 'sem dados')
console.log(JSON.stringify(data, null, 2))
