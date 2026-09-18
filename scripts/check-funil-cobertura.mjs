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

function norm(s) {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,\-–—'"()]/g, ' ')
    .replace(/\b(colegio|escola|instituto|centro|educacional|educacao|crista|cristao|christian|school|ensino|classica|infantil|bilingue|ltda|internacional|international|de|da|do|dos|das|e|em)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const [{ data: precads, error: e1 }, { data: escolas, error: e2 }, { data: negs, error: e3 }, { data: props, error: e4 }] = await Promise.all([
    supabase.from('form_precadastro_wemake').select('id, nome_fantasia, razao_social, cidade, estado, status, created_at').order('created_at', { ascending: false }),
    supabase.from('escolas').select('id, nome'),
    supabase.from('negociacoes').select('id, escola_id, stage, ativa').eq('ativa', true),
    supabase.from('propostas').select('id, escola_id, escola_nome, status'),
  ])
  if (e1) throw new Error('precads: ' + e1.message)
  if (e2) throw new Error('escolas: ' + e2.message)
  if (e3) throw new Error('negociacoes: ' + e3.message)
  if (e4) throw new Error('propostas: ' + e4.message)

  console.log(`Pré-cadastros (form_precadastro_wemake): ${precads.length}`)
  console.log(`Escolas cadastradas: ${escolas.length}`)
  console.log(`Negociações ativas: ${negs.length}`)
  console.log(`Propostas: ${props.length}\n`)

  // Guarda TODOS os candidatos por chave normalizada (não sobrescreve) —
  // nomes quase-idênticos (ex: "Lighthouse" / "Colégio Lighthouse" / "Colégio
  // Lighthouse Ensino Bilíngue") normalizam pra mesma chave, e um cadastro
  // duplicado pode ter negociação enquanto outro não. Considera "no funil"
  // se QUALQUER um dos candidatos tiver negociação ativa.
  const escolasPorNorm = new Map()
  for (const e of escolas) {
    const n = norm(e.nome)
    if (!n) continue
    const lista = escolasPorNorm.get(n) ?? []
    lista.push(e)
    escolasPorNorm.set(n, lista)
  }

  const negsPorEscola = new Set(negs.map(n => n.escola_id))
  const propsPorEscolaId = new Map()
  const propsPorNomeNorm = new Map()
  for (const p of props) {
    if (p.escola_id) propsPorEscolaId.set(p.escola_id, p)
    const n = norm(p.escola_nome)
    if (n) propsPorNomeNorm.set(n, p)
  }

  const linhas = []
  for (const pc of precads) {
    const nomePc = pc.nome_fantasia || pc.razao_social || '(sem nome)'
    const nPc = norm(nomePc)
    let candidatos = escolasPorNorm.get(nPc) ?? []
    if (candidatos.length === 0) {
      for (const [nEsc, lista] of escolasPorNorm) {
        if (nPc.length >= 4 && nEsc.length >= 4 && (nPc.includes(nEsc) || nEsc.includes(nPc))) {
          candidatos = candidatos.concat(lista)
        }
      }
    }

    const noCadastro = candidatos.length > 0
    const candidatoComNeg = candidatos.find(c => negsPorEscola.has(c.id))
    const noFunil = !!candidatoComNeg
    const propostaPorId = candidatos.map(c => propsPorEscolaId.get(c.id)).find(Boolean)
    const propostaPorNome = propsPorNomeNorm.get(nPc)
    const proposta = propostaPorId || propostaPorNome

    linhas.push({
      nome: nomePc,
      cidade: pc.cidade, estado: pc.estado, status_precadastro: pc.status,
      cadastrada: noCadastro,
      escola_nome_sistema: candidatos.map(c => c.nome).join(' / ') || null,
      duplicada: candidatos.length > 1,
      no_funil: noFunil,
      tem_proposta: !!proposta,
      proposta_status: proposta?.status ?? null,
    })
  }

  const semCadastro = linhas.filter(l => !l.cadastrada)
  const cadastradaSemFunil = linhas.filter(l => l.cadastrada && !l.no_funil)
  const noFunilSemProposta = linhas.filter(l => l.no_funil && !l.tem_proposta)
  const completos = linhas.filter(l => l.no_funil && l.tem_proposta)

  console.log(`=== SEM CADASTRO NA TABELA ESCOLAS (${semCadastro.length}) ===`)
  semCadastro.forEach(l => console.log(`- ${l.nome} (${l.cidade}/${l.estado}) — pré-cadastro status: ${l.status_precadastro}`))

  console.log(`\n=== CADASTRADA, MAS SEM NEGOCIAÇÃO ATIVA (fora do funil) (${cadastradaSemFunil.length}) ===`)
  cadastradaSemFunil.forEach(l => console.log(`- ${l.nome} → cadastro: "${l.escola_nome_sistema}"`))

  console.log(`\n=== NO FUNIL, MAS SEM PROPOSTA REGISTRADA (${noFunilSemProposta.length}) ===`)
  noFunilSemProposta.forEach(l => console.log(`- ${l.nome} → cadastro: "${l.escola_nome_sistema}"`))

  console.log(`\n=== COMPLETO: cadastrada + no funil + proposta (${completos.length}) ===`)
  completos.forEach(l => console.log(`- ${l.nome} (proposta: ${l.proposta_status})`))

  const duplicadas = linhas.filter(l => l.duplicada)
  console.log(`\n=== CADASTRO DUPLICADO NO SISTEMA (${duplicadas.length}) ===`)
  duplicadas.forEach(l => console.log(`- ${l.nome} → ${l.escola_nome_sistema}`))
}

main().catch(err => {
  console.error('\nFALHOU:', err.message)
  process.exit(1)
})
