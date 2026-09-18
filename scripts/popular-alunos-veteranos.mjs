// Popula contratos.*_qtd (+ livro_impresso quando existir) pras escolas
// veteranas listadas na aba "Alunos_escola_livros" do backup de Dênis.
// Só mexe em escolas SEM negociação ativa (minuta/contrato/assinado = false
// ou inexistente) — escolas já em processo no funil (Zoe, Telos, Estímulos)
// ficam de fora, pra não sobrescrever números que o time comercial já está
// tratando via minuta/contrato.
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const CAMPOS = [
  'infantil4_qtd', 'infantil5_qtd',
  'fund1_ano1_qtd', 'fund1_ano2_qtd', 'fund1_ano3_qtd', 'fund1_ano4_qtd', 'fund1_ano5_qtd',
  'fund2_ano6_qtd', 'fund2_ano7_qtd', 'fund2_ano8_qtd', 'fund2_ano9_qtd',
  'medio_1s_qtd', 'medio_2s_qtd', 'medio_3s_qtd',
]

const wb = XLSX.readFile('[backup Dênis] de Planejamento Financeiro - We Make 2027.xlsx')
const ws = wb.Sheets['Alunos_escola_livros']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

function linhaPara(nomePlanilha) {
  const r = rows.slice(2, 28).find(r => String(r[0]).trim() === nomePlanilha)
  if (!r) throw new Error('linha não encontrada: ' + nomePlanilha)
  const vals = {}
  CAMPOS.forEach((campo, i) => { const v = r[i + 1]; vals[campo] = typeof v === 'number' ? v : (parseInt(v, 10) || 0) })
  const temLivro = (r[16] || 0) > 0
  return { vals, temLivro }
}

// escolas já cadastradas no banco — id confirmado via scripts/match-planilha-alunos.mjs
const MATCHES_DIRETOS = [
  { planilha: 'Colégio Cristão Amar (ano 3/4)', escolaId: '9b4c9253-e356-4e0d-988b-6a95373c6ada' },
  { planilha: 'ACR Classical Christian School (2/4)', escolaId: '95a3e9d8-b4d0-42d5-9ad5-c32a8a4ed4ca' },
  { planilha: 'Escola Cristã Paz (1/4)', escolaId: '5fce1869-dc56-426b-8fbe-102e9b0fc10f' },
  { planilha: 'Colégio Cristão Reverendo Olavo Nunes (1/4)', escolaId: 'c1c5f116-9fd5-45a1-9393-44a1eb3ed611' },
  { planilha: 'For Life (1/4)', escolaId: 'e5957b72-ed7d-4969-ad27-9fbe5924d0b4' },
  { planilha: 'Escola Supremo (1/4)', escolaId: '5a383c0f-fc8b-440a-9ce0-bf90e153b69e' },
  { planilha: 'Colégio Batista Conectar (1/5)', escolaId: '948e6d36-ff88-42e6-bd11-7c8851e268a8' },
  { planilha: 'Instituto Educacional e Cultural Filadélfia (1/5)', escolaId: '44297541-bde3-4a68-9d8e-e0624f139afb' },
  { planilha: 'Legatum Internation School (1/4)', escolaId: 'a76bfd16-43d0-4475-88ed-1a5264e0bbdd' },
]

// escolas criadas numa tentativa anterior (que falhou na gravação do
// contrato porque fund2_ano6_qtd/medio_*_qtd ainda não existiam) — reusa os
// ids em vez de criar duplicata. Ver scripts/match-planilha-alunos.mjs.
const CRIAR_NOVAS = [
  { planilha: 'Colégio Graciosa (ano 1/4)', nome: 'Colégio Graciosa', escolaId: '3516fb61-ba62-41a6-9ee8-47b15ee1cd5c' },
  { planilha: 'Colégio Journey (ano 3/5)', nome: 'Colégio Journey', escolaId: 'a677e7ba-52d1-41b0-b276-79b7042bd05a' },
  { planilha: 'Escola Cristã do Reino (2/4)', nome: 'Escola Cristã do Reino', escolaId: 'bdf7fe81-c373-4be9-9de3-4e048fa80e80' },
  { planilha: 'Escola Aprender e Viver (2/4)', nome: 'Escola Aprender e Viver', escolaId: 'd0c20506-e7ec-4fc7-8921-bc9e522996e1' },
  { planilha: 'Educar Londrina (2/4)', nome: 'Educar Londrina', escolaId: '5c70228b-0226-4bbb-8bc6-9facf2202d75' },
  { planilha: 'CESE (2/4)', nome: 'CESE', escolaId: '60e2c3bf-60a9-4a38-ae3c-c519dcdd3c4d' },
  { planilha: 'CEA (2/4)', nome: 'CEA', escolaId: '2bc24e2d-4efc-4128-974f-fb514207c627' },
  { planilha: 'Sagrados corações (2/4)', nome: 'Sagrados Corações', escolaId: 'd39e287f-b450-4846-a766-89b2641bf5e9' },
  { planilha: 'Colégio da Comunidade - Curuçá (1/4)', nome: 'Colégio da Comunidade - Curuçá', escolaId: 'f635f06e-0783-450b-9e54-b71d8f4e5e08' },
  { planilha: 'Colégio da Comunidade - Carrão (1/4)', nome: 'Colégio da Comunidade - Carrão', escolaId: 'bba3e0db-379d-47c8-a151-838732c976b9' },
]

// Colunas que já existem hoje no banco — sempre graváveis.
const CAMPOS_SEGUROS = ['infantil4_qtd', 'infantil5_qtd', 'fund1_ano1_qtd', 'fund1_ano2_qtd', 'fund1_ano3_qtd', 'fund1_ano4_qtd', 'fund1_ano5_qtd']

async function upsertContrato(escolaId, vals, temLivro) {
  const { data: existing } = await supabase.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()

  // IMPORTANTE: se a escola já tem uma linha em `contratos`, essa função NUNCA
  // mais reescreve vals/livro_impresso/livro_qtds — só isso já bastou pra
  // apagar marcações manuais feitas na tela (Livro, quantidades) numa reexecução
  // anterior. Rodar de novo só serve pra garantir marcado_veterana=true; pra
  // reimportar números da planilha de verdade, apague a linha antes.
  if (existing) {
    const { error } = await supabase.from('contratos').update({ marcado_veterana: true }).eq('id', existing.id)
    return { error, jaExistia: true }
  }

  // NUNCA marca contrato_assinado aqui — esse campo é o sinal de negócio
  // fechado no Funil de Contratação. Marcar isso pra uma veterana faz ela
  // aparecer como contrato assinado no funil de vendas, misturando headcount
  // histórico com o pipeline de vendas real (bug visto com a Legatum).
  const payloadBase = { ...vals, marcado_veterana: true }

  async function tentar(payload) {
    return await supabase.from('contratos').insert({ escola_id: escolaId, ...payload })
  }

  let r = await tentar({ ...payloadBase, livro_impresso: temLivro })
  if (r.error && /livro_impresso/.test(r.error.message)) {
    r = await tentar(payloadBase) // coluna livro_impresso ainda não existe — grava sem ela
  }
  if (r.error && /marcado_veterana/.test(r.error.message)) {
    const { marcado_veterana, ...semVeterana } = payloadBase
    r = await tentar(semVeterana) // coluna marcado_veterana ainda não existe — grava sem ela
  }
  if (r.error && /fund2_ano\d_qtd|medio_\ds_qtd/.test(r.error.message)) {
    // fund2/medio ainda não existem — grava só infantil+fund1 por enquanto
    // (rodar de novo depois de add_fund2_medio_contratos.sql pra completar)
    const seguro = { marcado_veterana: true }
    for (const k of CAMPOS_SEGUROS) seguro[k] = vals[k] ?? 0
    r = await tentar(seguro)
    if (!r.error) r.parcial = true
  }
  return r
}

let ok = 0, parciais = 0, falhas = []

for (const m of MATCHES_DIRETOS) {
  const { vals, temLivro } = linhaPara(m.planilha)
  const r = await upsertContrato(m.escolaId, vals, temLivro)
  if (r.error) falhas.push(`${m.planilha}: ${r.error.message}`)
  else if (r.parcial) { parciais++; console.log(`PARCIAL (falta Fund2/Médio — existente) ${m.planilha}`) }
  else { ok++; console.log(`OK  (existente) ${m.planilha}`) }
}

for (const c of CRIAR_NOVAS) {
  const { vals, temLivro } = linhaPara(c.planilha)
  const r = await upsertContrato(c.escolaId, vals, temLivro)
  if (r.error) falhas.push(`${c.planilha}: erro ao gravar contrato — ${r.error.message}`)
  else if (r.parcial) { parciais++; console.log(`PARCIAL (falta Fund2/Médio — escola ${c.escolaId}) ${c.planilha}`) }
  else { ok++; console.log(`OK  (escola ${c.escolaId}) ${c.planilha}`) }
}

console.log(`\n${ok} escolas completas. ${parciais} parciais (rodar de novo após add_fund2_medio_contratos.sql). ${falhas.length} falhas.`)
falhas.forEach(f => console.log('  FALHA:', f))
