// Renumera prioridade_manual dentro de cada quadro (mesma classificação de
// funil-contratacao/page.tsx) pra fechar buracos e desfazer duplicatas
// pré-existentes (dado que provavelmente entrou direto via import/SQL, sem
// passar pela ação atualizarPrioridadeEscola que já mantém isso saudável
// dali em diante). Preserva a ordem relativa: mesma prioridade antiga ->
// desempate por nome; quadro final sempre 1..N sem buracos.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function derivarFase(c) {
  if (c.contrato_arquivado && c.implantacao_status === 'concluida') return 'parceiro_ativo'
  if (c.contrato_arquivado) return 'implantacao'
  if (c.contrato_assinado) return 'contrato_assinado'
  if (c.contrato_enviado) return 'contrato_enviado'
  if (c.minuta_enviada) return 'minuta'
  if (c.temProposta) return 'proposta_enviada'
  return 'negociacao'
}

const FASES_QUADRO_CONTRATO = ['contrato_enviado', 'contrato_assinado', 'implantacao', 'parceiro_ativo']
function classificarQuadro(declinou, fase) {
  if (declinou) return 'declinou'
  if (FASES_QUADRO_CONTRATO.includes(fase)) return 'contrato'
  if (fase === 'minuta') return 'minuta'
  if (fase === 'proposta_enviada') return 'proposta'
  return 'formulario'
}

const { data: escolas } = await supabase.from('escolas').select('id, nome, prioridade_manual').not('prioridade_manual', 'is', null).eq('ativa', true)
const ids = escolas.map(e => e.id)
const { data: contratos } = await supabase.from('contratos').select('escola_id, contrato_arquivado, implantacao_status, contrato_assinado, contrato_enviado, minuta_enviada, proposta_enviada, declinou').in('escola_id', ids)
const { data: propostas } = await supabase.from('propostas').select('escola_id').in('escola_id', ids)

const contratoPorEscola = new Map(contratos.map(c => [c.escola_id, c]))
const temPropostaSet = new Set(propostas.map(p => p.escola_id))

const porQuadro = { formulario: [], proposta: [], minuta: [], contrato: [], declinou: [] }
for (const e of escolas) {
  const c = contratoPorEscola.get(e.id) ?? {}
  const temProposta = temPropostaSet.has(e.id) || !!c.proposta_enviada
  const fase = derivarFase({ ...c, temProposta })
  const quadro = classificarQuadro(!!c.declinou, fase)
  porQuadro[quadro].push(e)
}

let totalMudancas = 0
for (const [quadro, lista] of Object.entries(porQuadro)) {
  lista.sort((a, b) => (a.prioridade_manual - b.prioridade_manual) || a.nome.localeCompare(b.nome, 'pt-BR'))
  console.log(`\n=== ${quadro} (${lista.length}) ===`)
  for (let i = 0; i < lista.length; i++) {
    const novo = i + 1
    const e = lista[i]
    if (novo !== e.prioridade_manual) {
      console.log(`  ${e.nome}: ${e.prioridade_manual} -> ${novo}`)
      const { error } = await supabase.from('escolas').update({ prioridade_manual: novo }).eq('id', e.id)
      if (error) { console.log('    ERRO:', error.message); continue }
      totalMudancas++
    } else {
      console.log(`  ${e.nome}: ${e.prioridade_manual} (ok)`)
    }
  }
}
console.log(`\nTotal de escolas renumeradas: ${totalMudancas}`)
