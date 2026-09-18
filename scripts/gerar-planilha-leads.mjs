import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import XLSX from 'xlsx'

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

function soDigitos(s) {
  return (s ?? '').replace(/\D/g, '')
}

// Normalização "exata" — só acento/caixa/espaço, pra escolas com o nome
// literalmente igual (o pedido original: "se o nome for o mesmo").
function normExato(s) {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,\-–—'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Normalização "difusa" — remove palavras genéricas (colégio, escola,
// cristã...) pra comparar só o "núcleo" do nome. Usada apenas como
// segunda passada, sempre com checagem de UF, pra não juntar escolas
// diferentes que só coincidem no nome genérico.
function normDifusa(s) {
  return normExato(s)
    .replace(/\b(colegio|escola|instituto|centro|educacional|educacao|crista|cristao|christian|christians|school|ensino|classica|infantil|bilingue|ltda|internacional|international|de|da|do|dos|das|e|em)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  let todos = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('leads_universal')
      .select('escola_nome, escola_cnpj, nome, cargo, email, tel_celular, tel_fixo, tel_comercial, cidade, uf')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    todos = todos.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`Total de registros de leads: ${todos.length}`)

  // Passada 1 — agrupa por nome de escola EXATAMENTE igual (após
  // normalizar acento/caixa/espaço).
  const gruposExatos = new Map()
  for (const r of todos) {
    const nomeBruto = (r.escola_nome ?? '').trim()
    if (!nomeBruto) continue
    const chave = normExato(nomeBruto)
    if (!chave) continue
    const grupo = gruposExatos.get(chave) ?? []
    grupo.push(r)
    gruposExatos.set(chave, grupo)
  }
  console.log(`Escolas após nome exatamente igual: ${gruposExatos.size}`)

  // Prepara cada grupo com nome oficial (mais completo) + UF predominante,
  // pra passada 2.
  let clusters = [...gruposExatos.values()].map(registros => {
    const nomes = registros.map(r => (r.escola_nome ?? '').trim()).filter(Boolean)
    const nomeOficial = nomes.reduce((maior, atual) => atual.length > maior.length ? atual : maior, nomes[0])
    const uf = registros.map(r => (r.uf ?? '').trim().toUpperCase()).find(Boolean) ?? ''
    return { registros, nomeOficial, uf, normDifusa: normDifusa(nomeOficial) }
  })

  // Passada 2 — funde clusters cujo "núcleo" do nome (sem palavras
  // genéricas) é o mesmo ou um contém o outro, MAS só quando o UF bate
  // (ou pelo menos um dos dois não tem UF informado) — evita juntar
  // escolas homônimas em estados diferentes (ex.: duas escolas "Zoe" em
  // cidades/UFs diferentes são instituições distintas).
  const usados = new Array(clusters.length).fill(false)
  const fundidos = []
  for (let i = 0; i < clusters.length; i++) {
    if (usados[i]) continue
    let atual = clusters[i]
    usados[i] = true
    for (let j = i + 1; j < clusters.length; j++) {
      if (usados[j]) continue
      const outro = clusters[j]
      const a = atual.normDifusa, b = outro.normDifusa
      if (!a || !b || a.length < 4 || b.length < 4) continue
      const nomeParecido = a === b || a.includes(b) || b.includes(a)
      if (!nomeParecido) continue
      const ufCompativel = !atual.uf || !outro.uf || atual.uf === outro.uf
      if (!ufCompativel) continue
      // funde: mantém o nome mais completo entre os dois
      atual = {
        registros: atual.registros.concat(outro.registros),
        nomeOficial: outro.nomeOficial.length > atual.nomeOficial.length ? outro.nomeOficial : atual.nomeOficial,
        uf: atual.uf || outro.uf,
        normDifusa: atual.normDifusa,
      }
      usados[j] = true
    }
    fundidos.push(atual)
  }
  console.log(`Escolas após fundir nomes parecidos (mesmo UF): ${fundidos.length}`)

  const linhas = []
  for (const { registros, nomeOficial } of fundidos) {
    const telefonesVistos = new Set()
    const telefones = []
    for (const r of registros) {
      for (const tel of [r.tel_celular, r.tel_fixo, r.tel_comercial]) {
        const limpo = (tel ?? '').trim()
        if (!limpo) continue
        const digitos = soDigitos(limpo)
        if (digitos.length < 8) continue
        if (telefonesVistos.has(digitos)) continue
        telefonesVistos.add(digitos)
        telefones.push(limpo)
      }
    }

    const contatosVistos = new Set()
    const contatos = []
    for (const r of registros) {
      const nome = (r.nome ?? '').trim()
      if (!nome) continue
      const chave = normExato(nome)
      if (contatosVistos.has(chave)) continue
      contatosVistos.add(chave)
      contatos.push(r.cargo ? `${nome} (${r.cargo.trim()})` : nome)
    }

    const emailsVistos = new Set()
    const emails = []
    for (const r of registros) {
      const email = (r.email ?? '').trim().toLowerCase()
      if (!email || emailsVistos.has(email)) continue
      emailsVistos.add(email)
      emails.push(email)
    }

    const cnpj = registros.map(r => (r.escola_cnpj ?? '').trim()).find(Boolean) ?? ''
    const cidade = registros.map(r => (r.cidade ?? '').trim()).find(Boolean) ?? ''
    const uf = registros.map(r => (r.uf ?? '').trim().toUpperCase()).find(Boolean) ?? ''

    linhas.push({
      'Escola': nomeOficial,
      'Cidade': cidade,
      'UF': uf,
      'CNPJ': cnpj,
      'Telefones': telefones.join('; '),
      'Contatos': contatos.join('; '),
      'E-mails': emails.join('; '),
      'Registros de origem': registros.length,
    })
  }

  linhas.sort((a, b) => a['Escola'].localeCompare(b['Escola'], 'pt-BR'))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(linhas)
  ws['!cols'] = [
    { wch: 42 }, { wch: 20 }, { wch: 5 }, { wch: 20 },
    { wch: 40 }, { wch: 45 }, { wch: 40 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Leads de Escolas')
  XLSX.writeFile(wb, 'Leads_Escolas_Consolidado.xlsx')

  console.log(`\nPlanilha gerada: Leads_Escolas_Consolidado.xlsx (${linhas.length} escolas)`)
}

main().catch(err => { console.error('FALHOU:', err.message); process.exit(1) })
