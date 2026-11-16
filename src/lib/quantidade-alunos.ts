import { createAdminClient } from '@/lib/supabase/admin'
import { calcTotalAlunosContrato } from '@/lib/contratos'
import type { EscolaLinha } from '@/app/(dashboard)/comercial/quantidade-alunos/QuantidadeAlunosClient'

// Sinal de que a escola tem negócio 2027 real em andamento — mesma checagem
// usada em classificarQuadro (funil-contratacao/page.tsx). Quando isso é
// verdade, a escola é "Nova" mesmo que marcado_veterana ainda esteja true
// (marcação antiga que não foi atualizada) — sem essa checagem, escolas como
// a Escola Supremo (proposta enviada de verdade) ficavam presas na seção
// de veteranas mesmo tendo negócio ativo, e o contador de "veteranas"
// divergia do quadro "Escolas Atendidas" do Funil de Contratação.
function temSinalFunilReal(c: any): boolean {
  return !!(c.formulario_enviado || c.formulario_recebido || c.proposta_enviada ||
    c.minuta_enviada || c.retorno_minuta || c.minuta_atualizada ||
    c.contrato_enviado || c.contrato_assinado || c.contrato_arquivado)
}

const CAMPOS_SERIE = [
  'infantil2_qtd', 'infantil3_qtd', 'infantil4_qtd', 'infantil5_qtd',
  'fund1_ano1_qtd', 'fund1_ano2_qtd', 'fund1_ano3_qtd', 'fund1_ano4_qtd', 'fund1_ano5_qtd',
  'fund2_ano6_qtd', 'fund2_ano7_qtd', 'fund2_ano8_qtd', 'fund2_ano9_qtd',
  'medio_1s_qtd', 'medio_2s_qtd', 'medio_3s_qtd',
]

export interface EscolaDisponivel { id: string; nome: string; uf: string | null }

export interface QuantidadeAlunosData {
  linhas: EscolaLinha[]
  escolasDisponiveis: EscolaDisponivel[]
  livroColunaExiste: boolean
  veteranaColunaExiste: boolean
  livroQtdsColunaExiste: boolean
}

/**
 * Alunos por série de cada escola parceira + pedido de livro pra gráfica —
 * reaproveitado tanto em `/comercial/quantidade-alunos` quanto no espelho
 * `/financeiro/quantidade-alunos` (mesmo dado, mesmas ações, páginas diferentes).
 */
export async function carregarQuantidadeAlunos(): Promise<QuantidadeAlunosData> {
  const admin = createAdminClient()

  const [{ data: escolas }, { data: contratos }, { data: historico }] = await Promise.all([
    admin.from('escolas').select('id, nome, cidade, estado, total_alunos').order('nome'),
    // select('*') em vez de listar colunas — evita quebrar a página inteira
    // caso `livro_impresso` ainda não exista no banco (migração pendente,
    // ver add_livro_impresso.sql). O campo some do resultado até rodar.
    admin.from('contratos').select('*'),
    admin.from('alunos_historico').select('escola_id, valor, created_at').order('created_at', { ascending: false }),
  ])

  const contratosPorEscola = new Map((contratos ?? []).map(c => [c.escola_id, c]))
  // Primeiro valor de cada escola_id nessa lista (já ordenada desc) é o mais
  // recente — mesma fonte que a "Alunos & Potencial" da página da escola usa
  // como penúltima prioridade, antes só do cadastro básico.
  const historicoPorEscola = new Map<string, number>()
  for (const h of historico ?? []) {
    if (!historicoPorEscola.has(h.escola_id)) historicoPorEscola.set(h.escola_id, h.valor)
  }

  // Base automática: só escolas com minuta enviada de verdade (sinal de que
  // a venda pro ano que vem está em andamento) — não contrato_enviado nem
  // contrato_assinado, que aqui misturavam headcount de veteranas com o
  // funil de vendas real. Veteranas entram só pela marcação manual.
  // declinou=true sempre exclui, mesmo que minuta_enviada ou marcado_veterana
  // estejam marcados — sem essa checagem, escola que já recusou continuava
  // aparecendo na lista que vira pedido de livro pra gráfica.
  const linhas: EscolaLinha[] = (escolas ?? [])
    .filter(e => {
      const c = contratosPorEscola.get(e.id)
      return !!c && !c.declinou && (c.minuta_enviada || c.marcado_veterana)
    })
    .map(e => {
      const c = contratosPorEscola.get(e.id)!
      return {
        escolaId: e.id,
        nome: e.nome,
        cidade: e.cidade ?? null,
        uf: e.estado ?? null,
        livroImpresso: !!c.livro_impresso,
        // Veterana = marcada manualmente E sem nenhum sinal real de negócio
        // 2027 em andamento; Nova = chegou à lista progredindo de verdade
        // pelo funil 2027 — um sinal real sempre tem prioridade sobre a
        // marcação manual (que pode estar desatualizada). Só decide em QUAL
        // das duas tabelas a escola aparece — a tag exibida (marcadoVeterana,
        // abaixo) continua mostrando a marcação de verdade, porque uma
        // veterana renovando pro ano que vem tem esses sinais só pela rotina
        // de renovação, não porque virou um negócio novo.
        veterana: !!c.marcado_veterana && !temSinalFunilReal(c),
        marcadoVeterana: !!c.marcado_veterana,
        // Prioridade: soma granular do contrato (a mais confiável, é o que
        // essa própria grade edita) > último valor em alunos_historico >
        // cadastro básico da escola. Sem isso, escolas que têm o total real
        // registrado noutro lugar do sistema mas nunca tiveram o detalhamento
        // por série preenchido apareciam zeradas aqui.
        total: (() => {
          const granular = calcTotalAlunosContrato(c)
          if (granular > 0) return granular
          return historicoPorEscola.get(e.id) ?? e.total_alunos ?? 0
        })(),
        totalSemDetalhe: calcTotalAlunosContrato(c) === 0,
        qtds: Object.fromEntries(CAMPOS_SERIE.map(campo => [campo, c[campo] ?? 0])),
        // Fallback pro valor do contrato quando livro_qtds ainda não tem essa
        // série salva (ex.: escola marcada com a tag Livro antes dessa
        // funcionalidade existir) — evita mostrar 0 indevido.
        livroQtds: Object.fromEntries(CAMPOS_SERIE.map(campo => [campo, c.livro_qtds?.[campo] ?? c[campo] ?? 0])),
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  // Escolas disponíveis pra adicionar manualmente (veteranas que ainda não
  // estão na lista acima) — todas as que não entraram no filtro de cima.
  const idsNaLista = new Set(linhas.map(l => l.escolaId))
  const escolasDisponiveis = (escolas ?? [])
    .filter(e => !idsNaLista.has(e.id))
    .map(e => ({ id: e.id, nome: e.nome, uf: e.estado ?? null }))

  const livroColunaExiste = (contratos ?? []).length === 0 || contratos!.some(c => 'livro_impresso' in c)
  const veteranaColunaExiste = (contratos ?? []).length === 0 || contratos!.some(c => 'marcado_veterana' in c)
  const livroQtdsColunaExiste = (contratos ?? []).length === 0 || contratos!.some(c => 'livro_qtds' in c)

  return { linhas, escolasDisponiveis, livroColunaExiste, veteranaColunaExiste, livroQtdsColunaExiste }
}
