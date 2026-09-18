// "Escola da Comunidade" (e6ef1cf2) é na verdade duas unidades já
// cadastradas separadamente: Colégio da Comunidade - Curuçá (f635f06e) e
// Colégio da Comunidade - Carrão (bba3e0db) — ambas já têm a quantidade de
// alunos por série certa (vinda da planilha do Dênis). O que falta é o
// progresso REAL do negócio (contrato todo marcado, proposta, reuniões,
// contato) — isso replica pras duas, cada uma mantendo sua própria
// quantidade de alunos já cadastrada. No final, apaga o registro fundido.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import crypto from 'crypto'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ORIGINAL_ID = 'e6ef1cf2-a49b-4dcb-8adf-519131c701c9' // Escola da Comunidade (fundida)
const CURUCA_ID = 'f635f06e-0783-450b-9e54-b71d8f4e5e08'   // Colégio da Comunidade - Curuçá
const CARRAO_ID = 'bba3e0db-379d-47c8-a151-838732c976b9'   // Colégio da Comunidade - Carrão

const { data: escolaOriginal } = await supabase.from('escolas').select('*').eq('id', ORIGINAL_ID).single()
const { data: contratoOriginal } = await supabase.from('contratos').select('*').eq('escola_id', ORIGINAL_ID).single()
const { data: propostasOriginais } = await supabase.from('propostas').select('*').eq('escola_id', ORIGINAL_ID)
const { data: registrosOriginais } = await supabase.from('registros').select('*').eq('escola_id', ORIGINAL_ID)
const { data: negociacoesOriginais } = await supabase.from('negociacoes').select('*').eq('escola_id', ORIGINAL_ID)

console.log(`Original: ${escolaOriginal.nome} — ${propostasOriginais.length} propostas, ${registrosOriginais.length} registros, ${negociacoesOriginais.length} negociações`)

// Campos de contato/identificação a replicar pro cadastro das duas escolas
// (sem sobrescrever nome/estado/cidade, que já estão certos em cada uma).
const CAMPOS_CONTATO_ESCOLA = ['contato_nome', 'telefone', 'email', 'responsavel_id', 'perfil_pedagogico', 'origem_lead']

// Checklist real do contrato — replica pras duas, mantendo os *_qtd de cada
// escola intocados (cada uma já tem sua própria quantidade de alunos).
const CAMPOS_CHECKLIST_CONTRATO = [
  'formulario_enviado', 'formulario_recebido', 'proposta_enviada', 'minuta_enviada',
  'retorno_minuta', 'minuta_atualizada', 'contrato_enviado', 'contrato_assinado',
  'contrato_arquivado', 'declinou', 'implantacao_status', 'implantacao_iniciada_em', 'implantacao_concluida_em',
]

for (const [nomeDestino, destinoId] of [['Curuçá', CURUCA_ID], ['Carrão', CARRAO_ID]]) {
  console.log(`\n=== Replicando pra ${nomeDestino} (${destinoId}) ===`)

  // 1. Dados de contato na escola
  const patchEscola = {}
  for (const campo of CAMPOS_CONTATO_ESCOLA) {
    if (escolaOriginal[campo] != null) patchEscola[campo] = escolaOriginal[campo]
  }
  const { error: errEscola } = await supabase.from('escolas').update(patchEscola).eq('id', destinoId)
  if (errEscola) console.log('  ERRO escola:', errEscola.message)
  else console.log('  OK escola (contato replicado)')

  // 2. Checklist do contrato (mantém as *_qtd já cadastradas nessa escola)
  const { data: contratoDestino } = await supabase.from('contratos').select('id').eq('escola_id', destinoId).single()
  const patchContrato = {}
  for (const campo of CAMPOS_CHECKLIST_CONTRATO) patchContrato[campo] = contratoOriginal[campo]
  const { error: errContrato } = await supabase.from('contratos').update(patchContrato).eq('id', contratoDestino.id)
  if (errContrato) console.log('  ERRO contrato:', errContrato.message)
  else console.log('  OK contrato (checklist replicado, quantidades preservadas)')

  // 3. Propostas — clona cada uma, apontando pra escola nova (token novo,
  // já que é o link de acesso público — não pode repetir entre propostas)
  for (const p of propostasOriginais) {
    const { id, created_at, updated_at, token, ...resto } = p
    const { error } = await supabase.from('propostas').insert({ ...resto, escola_id: destinoId, token: crypto.randomUUID() })
    if (error) console.log(`  ERRO proposta (${p.id}):`, error.message)
  }
  console.log(`  OK ${propostasOriginais.length} propostas clonadas`)

  // 4. Registros (reuniões) — clona cada um
  for (const r of registrosOriginais) {
    const { id, created_at, updated_at, ...resto } = r
    const { error } = await supabase.from('registros').insert({ ...resto, escola_id: destinoId })
    if (error) console.log(`  ERRO registro (${r.id}):`, error.message)
  }
  console.log(`  OK ${registrosOriginais.length} registros clonados`)

  // 5. Negociações — clona
  for (const n of negociacoesOriginais) {
    const { id, created_at, updated_at, ...resto } = n
    const { error } = await supabase.from('negociacoes').insert({ ...resto, escola_id: destinoId })
    if (error) console.log(`  ERRO negociação (${n.id}):`, error.message)
  }
  console.log(`  OK ${negociacoesOriginais.length} negociações clonadas`)
}

console.log('\n=== Apagando registro fundido (Escola da Comunidade) ===')
await supabase.from('propostas').delete().eq('escola_id', ORIGINAL_ID)
await supabase.from('registros').delete().eq('escola_id', ORIGINAL_ID)
await supabase.from('negociacoes').delete().eq('escola_id', ORIGINAL_ID)
await supabase.from('contratos').delete().eq('escola_id', ORIGINAL_ID)
const { error: errDelEscola } = await supabase.from('escolas').delete().eq('id', ORIGINAL_ID)
console.log(errDelEscola ? 'ERRO ao apagar escola: ' + errDelEscola.message : 'OK — escola fundida apagada')
