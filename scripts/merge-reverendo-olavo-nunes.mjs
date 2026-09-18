// "Colégio Cristão Reverendo Olavo Nunes" (c1c5f116), "Colégio Evangélico
// Reverendo Olavo Nunes" (4fe798b2) e "INSTITUTO EDUCACIONAL REVERENDO OLAVO
// NUNES" (12d4e60f) são a mesma escola cadastrada 3x. c1c5f116 é a que bate
// com o CNPJ do formulário de pré-cadastro preenchido (14.858.296/0001-90) —
// fica como sobrevivente. Clona o histórico real (registros/proposta/
// negociação) da "evangelico" pra ela, e apaga as duas duplicatas.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import crypto from 'crypto'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const SOBREVIVENTE = 'c1c5f116-9fd5-45a1-9393-44a1eb3ed611' // Colégio Cristão Reverendo Olavo Nunes
const EVANGELICO = '4fe798b2-07af-4a05-8db3-289dec278c4f'   // Colégio Evangélico Reverendo Olavo Nunes
const INSTITUTO = '12d4e60f-c4d8-4c79-87f4-6192b24f3421'    // INSTITUTO EDUCACIONAL REVERENDO OLAVO NUNES

const { data: propostas } = await supabase.from('propostas').select('*').eq('escola_id', EVANGELICO)
const { data: registros } = await supabase.from('registros').select('*').eq('escola_id', EVANGELICO)
const { data: negociacoes } = await supabase.from('negociacoes').select('*').eq('escola_id', EVANGELICO)

console.log(`Evangélico: ${propostas.length} propostas, ${registros.length} registros, ${negociacoes.length} negociações — clonando pra sobrevivente`)

for (const p of propostas) {
  const { id, created_at, updated_at, token, ...resto } = p
  const { error } = await supabase.from('propostas').insert({ ...resto, escola_id: SOBREVIVENTE, token: crypto.randomUUID() })
  if (error) console.log('  ERRO proposta:', error.message)
}
for (const r of registros) {
  const { id, created_at, updated_at, ...resto } = r
  const { error } = await supabase.from('registros').insert({ ...resto, escola_id: SOBREVIVENTE })
  if (error) console.log('  ERRO registro:', error.message)
}
for (const n of negociacoes) {
  const { id, created_at, updated_at, ...resto } = n
  const { error } = await supabase.from('negociacoes').insert({ ...resto, escola_id: SOBREVIVENTE })
  if (error) console.log('  ERRO negociacao:', error.message)
}
console.log('OK — histórico clonado')

for (const [nome, id] of [['Evangélico', EVANGELICO], ['Instituto', INSTITUTO]]) {
  await supabase.from('propostas').delete().eq('escola_id', id)
  await supabase.from('registros').delete().eq('escola_id', id)
  await supabase.from('negociacoes').delete().eq('escola_id', id)
  await supabase.from('contratos').delete().eq('escola_id', id)
  const { error } = await supabase.from('escolas').delete().eq('id', id)
  console.log(error ? `ERRO ao apagar ${nome}: ${error.message}` : `OK — ${nome} apagada`)
}
