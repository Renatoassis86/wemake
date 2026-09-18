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

// escolas que não existem no banco ainda — criar novo cadastro mínimo
const CRIAR_NOVAS = [
  { planilha: 'Colégio Graciosa (ano 1/4)', nome: 'Colégio Graciosa' },
  { planilha: 'Colégio Journey (ano 3/5)', nome: 'Colégio Journey' },
  { planilha: 'Escola Cristã do Reino (2/4)', nome: 'Escola Cristã do Reino' },
  { planilha: 'Escola Aprender e Viver (2/4)', nome: 'Escola Aprender e Viver' },
  { planilha: 'Educar Londrina (2/4)', nome: 'Educar Londrina' },
  { planilha: 'CESE (2/4)', nome: 'CESE' },
  { planilha: 'CEA (2/4)', nome: 'CEA' },
  { planilha: 'Sagrados corações (2/4)', nome: 'Sagrados Corações' },
  { planilha: 'Colégio da Comunidade - Curuçá (1/4)', nome: 'Colégio da Comunidade - Curuçá' },
  { planilha: 'Colégio da Comunidade - Carrão (1/4)', nome: 'Colégio da Comunidade - Carrão' },
]

async function upsertContrato(escolaId, vals, temLivro) {
  const { data: existing } = await supabase.from('contratos').select('id').eq('escola_id', escolaId).maybeSingle()
  const payloadBase = { ...vals, contrato_assinado: true }

  let error
  {
    const r = existing
      ? await supabase.from('contratos').update({ ...payloadBase, livro_impresso: temLivro }).eq('id', existing.id)
      : await supabase.from('contratos').insert({ escola_id: escolaId, ...payloadBase, livro_impresso: temLivro })
    error = r.error
  }
  if (error && /livro_impresso/.test(error.message)) {
    // coluna ainda não existe — grava sem ela
    const r2 = existing
      ? await supabase.from('contratos').update(payloadBase).eq('id', existing.id)
      : await supabase.from('contratos').insert({ escola_id: escolaId, ...payloadBase })
    error = r2.error
  }
  return error
}

let ok = 0, falhas = []

for (const m of MATCHES_DIRETOS) {
  const { vals, temLivro } = linhaPara(m.planilha)
  const error = await upsertContrato(m.escolaId, vals, temLivro)
  if (error) falhas.push(`${m.planilha}: ${error.message}`)
  else { ok++; console.log(`OK  (existente) ${m.planilha}`) }
}

for (const c of CRIAR_NOVAS) {
  const { vals, temLivro } = linhaPara(c.planilha)
  const { data: novaEscola, error: errEscola } = await supabase.from('escolas').insert({ nome: c.nome, ativa: true }).select('id').single()
  if (errEscola) { falhas.push(`${c.planilha}: erro ao criar escola — ${errEscola.message}`); continue }
  const error = await upsertContrato(novaEscola.id, vals, temLivro)
  if (error) falhas.push(`${c.planilha}: erro ao gravar contrato — ${error.message}`)
  else { ok++; console.log(`OK  (nova escola ${novaEscola.id}) ${c.planilha}`) }
}

console.log(`\n${ok} escolas populadas. ${falhas.length} falhas.`)
falhas.forEach(f => console.log('  FALHA:', f))
