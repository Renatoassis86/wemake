// Cadastra o Colégio Lighthouse Ensino Bilíngue no CRM, cria a negociação
// (estágio "Em Negociação", pra ela aparecer no Funil de Contratação) e
// registra o histórico das 3 reuniões já realizadas — usando exatamente os
// mesmos campos/tabelas que os formulários do app gravam.
//
// Rode a partir da raiz do projeto (onde fica o .env.local):
//   node scripts/import-lighthouse.mjs
//
// Precisa de SUPABASE_SERVICE_ROLE_KEY no .env.local (já existe no projeto).

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

const NOME_ESCOLA = 'Colégio Lighthouse Ensino Bilíngue'

async function main() {
  // 1) Acha o usuário "Dênis" (conduziu as 3 reuniões) pra usar como responsável/criador
  const { data: usuarios, error: erroUsuarios } = await supabase
    .from('usuarios')
    .select('id, nome_completo')
    .ilike('nome_completo', '%dênis%')
  if (erroUsuarios) throw new Error(`Erro ao buscar usuário Dênis: ${erroUsuarios.message}`)
  if (!usuarios || usuarios.length === 0) throw new Error('Usuário "Dênis" não encontrado na tabela usuarios — ajuste o filtro do script.')
  const denis = usuarios[0]
  console.log(`Responsável: ${denis.nome_completo} (${denis.id})`)

  // 2) Verifica se a escola já existe (evita duplicar se alguém já cadastrou manualmente)
  const { data: existentes, error: erroBusca } = await supabase
    .from('escolas')
    .select('id, nome')
    .ilike('nome', '%lighthouse%')
  if (erroBusca) throw new Error(`Erro ao verificar escolas existentes: ${erroBusca.message}`)

  let escolaId
  if (existentes && existentes.length > 0) {
    escolaId = existentes[0].id
    console.log(`Escola já existe: "${existentes[0].nome}" (${escolaId}) — não vou duplicar, só sigo pra negociação/registros.`)
  } else {
    const { data: novaEscola, error: erroEscola } = await supabase
      .from('escolas')
      .insert({
        nome: NOME_ESCOLA,
        perfil_pedagogico: 'convencional', // não confirmado nas planilhas — mesmo padrão que o formulário usa quando em branco
        cidade: 'Campo Largo',
        estado: 'PR',
        contato_nome: 'Silvio Diniz',
        responsavel_id: denis.id,
        observacoes: 'Importado do histórico de reuniões (jun–ago/2026). Matrícula por série a confirmar — pré-cadastro registrou 116 alunos no total, mas a planilha-fonte não deixa clara a divisão exata por série. CNPJ, endereço, telefone e e-mail ainda não localizados.',
        ativa: true,
        created_by: denis.id,
      })
      .select('id')
      .single()
    if (erroEscola) throw new Error(`Erro ao criar escola: ${erroEscola.message}`)
    escolaId = novaEscola.id
    console.log(`Escola criada: ${NOME_ESCOLA} (${escolaId})`)
  }

  // 3) Cria a negociação — estágio "Em Negociação" já coloca ela no Funil de Contratação
  const { data: negExistente } = await supabase
    .from('negociacoes')
    .select('id')
    .eq('escola_id', escolaId)
    .eq('ativa', true)
    .limit(1)

  let negociacaoId
  if (negExistente && negExistente.length > 0) {
    negociacaoId = negExistente[0].id
    console.log(`Já existe negociação ativa (${negociacaoId}) — não vou criar outra.`)
  } else {
    const { data: novaNeg, error: erroNeg } = await supabase
      .from('negociacoes')
      .insert({
        escola_id: escolaId,
        titulo: 'Parceria comercial 2027',
        stage: 'negociacao',
        responsavel_id: denis.id,
        probabilidade: 0,
        observacoes: '3 reuniões realizadas entre jun–ago/2026, conduzidas por Dênis com o contato Silvio Diniz. Sem proposta formal enviada ainda.',
        ativa: true,
        created_by: denis.id,
      })
      .select('id')
      .single()
    if (erroNeg) throw new Error(`Erro ao criar negociação: ${erroNeg.message}`)
    negociacaoId = novaNeg.id
    console.log(`Negociação criada (estágio "Em Negociação"): ${negociacaoId}`)
  }

  // 4) Registra o histórico das 3 reuniões
  const reunioes = [
    { data_contato: '2026-06-09', meio_contato: 'presencial', resumo: '1ª reunião com Silvio Diniz — presencial.' },
    { data_contato: '2026-07-28', meio_contato: 'videoconf',  resumo: '2ª reunião com Silvio Diniz — online. Anotações do Gemini: "Reunião Lighthouse - Silvio Diniz - 2026/07/28 15:11".' },
    { data_contato: '2026-08-11', meio_contato: 'videoconf',  resumo: '3ª reunião com Silvio Diniz — online. Anotações do Gemini: "Reunião Dênis e Silvio (Lighthouse) - 2026/08/11 14:48".' },
  ]

  const { data: registrosExistentes } = await supabase
    .from('registros')
    .select('id')
    .eq('escola_id', escolaId)

  if (registrosExistentes && registrosExistentes.length > 0) {
    console.log(`Já existem ${registrosExistentes.length} registro(s) de interação pra essa escola — não vou duplicar o histórico.`)
  } else {
    for (const r of reunioes) {
      const { error: erroReg } = await supabase.from('registros').insert({
        escola_id: escolaId,
        negociacao_id: negociacaoId,
        data_contato: r.data_contato,
        meio_contato: r.meio_contato,
        resumo: r.resumo,
        responsavel_id: denis.id,
        contato_nome: 'Silvio Diniz',
        interesse: 'medio',
        prontidao: 'nova_reuniao',
        abertura: 'media',
        encaminhamentos: [],
        qtd_infantil: 0, qtd_fund1: 0, qtd_fund2: 0, qtd_medio: 0,
        potencial_financeiro: 0, probabilidade: 0, classificacao: 'morno',
        notas_internas: 'Importado do histórico de reuniões (planilha local).',
        created_by: denis.id,
      })
      if (erroReg) throw new Error(`Erro ao criar registro de ${r.data_contato}: ${erroReg.message}`)
      console.log(`Registro de interação criado: ${r.data_contato} (${r.meio_contato})`)
    }
  }

  console.log(`\nPronto. Confira em: https://comercial.wemake.tec.br/comercial/escolas/${escolaId}`)
  console.log(`Funil de Contratação: https://comercial.wemake.tec.br/comercial/funil-contratacao`)
}

main().catch(err => {
  console.error('\nFALHOU:', err.message)
  process.exit(1)
})
