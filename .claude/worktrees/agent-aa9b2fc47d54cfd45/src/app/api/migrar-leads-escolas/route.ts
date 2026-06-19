import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Migra escolas do banco de leads (leads_universal) para o cadastro oficial (escolas).
 * - Agrupa por escola_nome único
 * - Verifica se já existe pelo nome (case-insensitive) ou CNPJ
 * - Se não existe: cria escola no CRM com os dados disponíveis
 * - Se existe: atualiza apenas campos que estavam vazios
 * GET /api/migrar-leads-escolas  → retorna preview (quantas seriam criadas/atualizadas)
 * POST /api/migrar-leads-escolas → executa a migração
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const stats = await contarMigracao(supabase)
  return NextResponse.json(stats)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const result = await executarMigracao(supabase, user.id)
  return NextResponse.json(result)
}

async function contarMigracao(supabase: any) {
  // Pegar escolas únicas do banco de leads
  const { data: leads } = await supabase
    .from('leads_universal')
    .select('escola_nome, escola_cnpj, cidade, uf, tel_celular, email, tipo_inscricao, nome, qtd_infantil, qtd_fund1, qtd_fund2, qtd_medio')
    .not('escola_nome', 'is', null)
    .limit(10000)

  const { data: escolasCRM } = await supabase
    .from('escolas').select('nome, cnpj').eq('ativa', true)

  const nomesCRM = new Set((escolasCRM ?? []).map((e: any) => e.nome.toLowerCase().trim()))
  const cnpjsCRM = new Set((escolasCRM ?? []).filter((e: any) => e.cnpj).map((e: any) => e.cnpj?.replace(/\D/g, '')))

  // Agrupar leads por escola
  const porEscola = new Map<string, any>()
  ;(leads ?? []).forEach((l: any) => {
    const key = l.escola_nome.toLowerCase().trim()
    if (!porEscola.has(key)) porEscola.set(key, l)
  })

  let novas = 0, existentes = 0
  porEscola.forEach((l, key) => {
    const cnpjLimpo = l.escola_cnpj ? String(l.escola_cnpj).replace(/\D/g, '') : ''
    if (nomesCRM.has(key) || (cnpjLimpo && cnpjsCRM.has(cnpjLimpo))) {
      existentes++
    } else {
      novas++
    }
  })

  return { totalLeads: (leads ?? []).length, escolasUnicas: porEscola.size, novas, existentes }
}

async function executarMigracao(supabase: any, userId: string) {
  const { data: leads } = await supabase
    .from('leads_universal')
    .select('escola_nome, escola_cnpj, cidade, uf, tel_celular, tel_fixo, email, tipo_inscricao, nome, cargo, qtd_infantil, qtd_fund1, qtd_fund2, qtd_medio, qtd_alunos_total, endereco, bairro, cep')
    .not('escola_nome', 'is', null)
    .limit(10000)

  const { data: escolasCRM } = await supabase
    .from('escolas').select('id, nome, cnpj, email, telefone, contato_nome').eq('ativa', true)

  const nomeParaId = new Map<string, string>()
  const cnpjParaId = new Map<string, string>()
  ;(escolasCRM ?? []).forEach((e: any) => {
    nomeParaId.set(e.nome.toLowerCase().trim(), e.id)
    if (e.cnpj) cnpjParaId.set(e.cnpj.replace(/\D/g, ''), e.id)
  })

  // Agrupar por escola — pegar o lead mais completo de cada escola
  const porEscola = new Map<string, any>()
  ;(leads ?? []).forEach((l: any) => {
    const key = l.escola_nome.toLowerCase().trim()
    const atual = porEscola.get(key)
    // Prefere o registro com mais campos preenchidos
    if (!atual || Object.values(l).filter(Boolean).length > Object.values(atual).filter(Boolean).length) {
      porEscola.set(key, l)
    }
  })

  let criadas = 0, atualizadas = 0, erros = 0

  for (const [key, l] of porEscola) {
    const cnpjLimpo = l.escola_cnpj ? String(l.escola_cnpj).replace(/\D/g, '') : ''
    const existeId = nomeParaId.get(key) ?? (cnpjLimpo ? cnpjParaId.get(cnpjLimpo) : undefined)

    // Detectar tipo de cargo para contato
    const isDecisor = l.tipo_inscricao && (
      l.tipo_inscricao.toLowerCase().includes('gestor') ||
      l.tipo_inscricao.toLowerCase().includes('diretor') ||
      l.tipo_inscricao.toLowerCase().includes('mantenedor') ||
      l.tipo_inscricao.toLowerCase().includes('coordenador')
    )

    if (existeId) {
      // Busca escola atual para preencher lacunas
      const { data: atual } = await supabase.from('escolas').select('*').eq('id', existeId).single()
      const upd: any = {}
      if (!atual?.email && l.email)           upd.email         = l.email
      if (!atual?.telefone && l.tel_celular)   upd.telefone      = l.tel_celular
      if (!atual?.contato_nome && isDecisor && l.nome) upd.contato_nome  = l.nome
      if (!atual?.cnpj && cnpjLimpo)           upd.cnpj          = l.escola_cnpj
      if (!atual?.cidade && l.cidade)          upd.cidade        = l.cidade
      if (!atual?.estado && l.uf)              upd.estado        = l.uf
      if (Object.keys(upd).length > 0) {
        const { error } = await supabase.from('escolas').update(upd).eq('id', existeId)
        if (error) erros++
        else atualizadas++
      }
    } else {
      // Criar nova escola
      const qtdInf  = l.qtd_infantil ?? 0
      const qtdF1   = l.qtd_fund1    ?? 0
      const qtdF2   = l.qtd_fund2    ?? 0
      const qtdMed  = l.qtd_medio    ?? 0

      const { error } = await supabase.from('escolas').insert({
        nome:          l.escola_nome,
        cnpj:          l.escola_cnpj || null,
        cidade:        l.cidade      || null,
        estado:        l.uf          || null,
        email:         l.email       || null,
        telefone:      l.tel_celular || null,
        rua:           l.endereco    || null,
        bairro:        l.bairro      || null,
        cep:           l.cep         || null,
        contato_nome:  isDecisor ? (l.nome || null) : null,
        contato_cargo: isDecisor ? (l.tipo_inscricao || null) : null,
        qtd_infantil:  qtdInf,
        qtd_fund1:     qtdF1,
        qtd_fund2:     qtdF2,
        qtd_medio:     qtdMed,
        qtd_fund1_ano1: 0, qtd_fund1_ano2: 0, qtd_fund1_ano3: 0, qtd_fund1_ano4: 0, qtd_fund1_ano5: 0,
        qtd_fund2_ano6: 0, qtd_fund2_ano7: 0, qtd_fund2_ano8: 0, qtd_fund2_ano9: 0,
        qtd_medio_1s: 0, qtd_medio_2s: 0, qtd_medio_3s: 0,
        origem_lead:   'banco_leads',
        ativa:         true,
        created_by:    userId,
        updated_by:    userId,
      })
      if (error) erros++
      else {
        criadas++
        // Atualizar índices internos
        // (nova escola ficará disponível nos seletores após refresh)
      }
    }
  }

  return { criadas, atualizadas, erros, total: porEscola.size }
}
