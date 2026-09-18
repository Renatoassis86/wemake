// Lê a planilha "[backup Dênis] de Planejamento Financeiro - We Make 2027.xlsx",
// aba "Alunos_escola_livros", e tenta casar cada linha (escola veterana) com
// uma escola já cadastrada no banco. Só reporta — não grava nada.
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const CAMPOS = [
  'infantil4_qtd', 'infantil5_qtd',
  'fund1_ano1_qtd', 'fund1_ano2_qtd', 'fund1_ano3_qtd', 'fund1_ano4_qtd', 'fund1_ano5_qtd',
  'fund2_ano6_qtd', 'fund2_ano7_qtd', 'fund2_ano8_qtd', 'fund2_ano9_qtd',
  'medio_1s_qtd', 'medio_2s_qtd', 'medio_3s_qtd',
]

function normalizar(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\([^)]*\)/g, '') // remove sufixos tipo "(ano 1/4)"
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

const wb = XLSX.readFile('[backup Dênis] de Planejamento Financeiro - We Make 2027.xlsx')
const ws = wb.Sheets['Alunos_escola_livros']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

const linhas = rows.slice(2, 28).map(r => {
  const nomeOriginal = String(r[0]).trim()
  const vals = CAMPOS.map((_, i) => {
    const v = r[i + 1]
    return typeof v === 'number' ? v : (parseInt(v, 10) || 0)
  })
  const total = vals.reduce((a, b) => a + b, 0)
  return { nomeOriginal, nomeNorm: normalizar(nomeOriginal), vals, total, temLivro: (r[16] || 0) > 0 }
}).filter(l => l.nomeOriginal)

const { data: escolas, error: errEscolas } = await supabase.from('escolas').select('id, nome, cidade, estado')
if (errEscolas) { console.error(errEscolas); process.exit(1) }

console.log(`Planilha: ${linhas.length} escolas veteranas.\n`)

// Agrupa possíveis pares "F1"/"F2" da mesma escola (ex: Lighthouse)
const grupos = new Map()
for (const l of linhas) {
  const base = l.nomeNorm.replace(/\bf[12]\b/g, '').trim()
  if (!grupos.has(base)) grupos.set(base, [])
  grupos.get(base).push(l)
}

for (const [base, ls] of grupos) {
  const nomesOriginais = ls.map(l => l.nomeOriginal).join(' + ')
  const totalCombinado = ls.reduce((a, l) => a + l.total, 0)

  // match: nome da escola no banco contém (ou é contido por) o nome base normalizado
  const candidatos = (escolas ?? []).filter(e => {
    const en = normalizar(e.nome)
    if (en.length < 4 || base.length < 4) return false // evita match espúrio tipo "s"
    return en.includes(base) || base.includes(en)
  })

  console.log(`PLANILHA: "${nomesOriginais}" (total ${totalCombinado} alunos, livro=${ls.some(l => l.temLivro)})`)
  if (candidatos.length === 0) {
    console.log('   -> SEM MATCH no banco\n')
  } else if (candidatos.length === 1) {
    console.log(`   -> match único: "${candidatos[0].nome}" (${candidatos[0].cidade}/${candidatos[0].estado}) id=${candidatos[0].id}\n`)
  } else {
    console.log(`   -> ${candidatos.length} candidatos ambíguos:`)
    candidatos.forEach(c => console.log(`      - "${c.nome}" (${c.cidade}/${c.estado}) id=${c.id}`))
    console.log()
  }
}
