'use server'

import { createClient } from '@/infrastructure/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email e Senha são obrigatórios')}`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/dashboard/modulos')
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) throw err;
    redirect(`/login?error=${encodeURIComponent(err.message || 'Erro ao entrar')}`)
  }
}


export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const cookieStore = await cookies()
  cookieStore.delete('active_company_id') // Clear active tenant

  redirect('/login')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    redirect(`/login?error=${encodeURIComponent('Todos os campos são obrigatórios para cadastro')}`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome: name }
      }
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      await supabase.from('perfis').insert({
        id: data.user.id,
        nome: name,
      })
    }

    redirect('/dashboard/modulos')
  } catch (err: any) {
    if (err.message && err.message.includes('NEXT_REDIRECT')) throw err;
    redirect(`/login?error=${encodeURIComponent(err.message || 'Erro ao cadastrar')}`)
  }
}


export async function selectCompany(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_company_id', companyId, { secure: true, httpOnly: true })
}

export async function createCompany(formData: FormData) {
  const razaoSocial = formData.get('razao_social') as string
  const nomeFantasia = formData.get('nome_fantasia') as string
  const cnpj = formData.get('cnpj') as string

  if (!razaoSocial) throw new Error('Razão Social é obrigatória')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Criar Empresa
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert({
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia || razaoSocial,
      cnpj: cnpj || null,
      status: 'ativo'
    })
    .select()
    .single()

  if (empresaError) return { error: empresaError.message }

  // 2. Vincular usuário à empresa como Admin/Dono
  if (empresa) {
    await supabase
      .from('usuarios_empresas')
      .insert({
        perfil_id: user.id,
        empresa_id: empresa.id,
        cargo: 'admin'
      })
  }

  return { success: true }
}


import { ContratoGenerator } from '@/application/use-cases/ContratoGenerator'
import { SupabaseContratoRepository } from '@/infrastructure/repositories/SupabaseContratoRepository'
import { getValidatedCompanyId } from '@/application/services/TenantService'

export async function salvarContrato(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeCompanyId = await getValidatedCompanyId()
  if (!activeCompanyId) throw new Error('Empresa ativa não selecionada.')

  const templateId = formData.get('template_id') as string;
  const tituloContrato = formData.get('titulo_contrato') as string;

  if (!templateId || !tituloContrato) {
    throw new Error('Template e Título são obrigatórios.')
  }

  // 1. Obter template para extrair o corpo mestre
  const { data: template } = await supabase
    .from('templates_contrato')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) throw new Error('Template não encontrado.')

  // 2. Extrair dados dinâmicos do formData (campos começando com tag_)
  const dadosPreenchidos: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('tag_')) {
      const tagKey = key.replace('tag_', '')
      dadosPreenchidos[tagKey] = value as string
    }
  }

  // 3. Renderizar Contrato
  const corpoRenderizado = ContratoGenerator.renderizar(template.corpo_template, dadosPreenchidos)

  // 4. Salvar usando o Repositório
  const repo = new SupabaseContratoRepository()
  const contratoCriado = await repo.create({
    empresaId: activeCompanyId,
    tipoContratoId: template.tipo_contrato_id,
    templateId: templateId,
    titulo: tituloContrato,
    corpoAtual: corpoRenderizado,
    dadosPreenchimento: dadosPreenchidos, // JSONB
    status: 'gerado',
    renovacaoAutomatica: false,
    createdBy: user.id
  })

  // 4.1 SIMULAR GERAÇÃO DE ARQUIVO (SALVAR NO STORAGE como HTML)
  try {
    const bucketName = 'contratos_arquivos'
    const filePath = `${activeCompanyId}/${contratoCriado.id}/minuta.html`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, Buffer.from(corpoRenderizado), {
        contentType: 'text/html',
        upsert: true
      })

    if (!uploadError) {
      await repo.saveArquivo({
        contrato_id: contratoCriado.id,
        nome_arquivo: 'minuta.html',
        snippet_path: filePath,
        tamanho_bytes: Buffer.byteLength(corpoRenderizado),
        mime_type: 'text/html',
        bucket: bucketName,
        criado_por: user.id
      })
    }
  } catch (err) {
    console.error('Erro ao salvar no storage:', err)
  }

  // 5. Auditar evento
  await supabase
    .from('eventos_contrato')
    .insert({
      contrato_id: contratoCriado.id,
      actor_id: user.id,
      tipo_evento: 'criacao',
      descricao: `Contrato '${tituloContrato}' gerado a partir do template '${template.titulo}' e salvo no storage.`,
      metadata_snapshot: { dadosPreenchidos }
    })


  // 6. Redirecionar para o detalhe do contrato gerado
  redirect(`/dashboard/contratos/${contratoCriado.id}`)
}

import { AssinaturaWorkflow } from '@/application/use-cases/AssinaturaWorkflow'

export async function prepararAssinatura(formData: FormData) {
  const contratoId = formData.get('contrato_id') as string

  if (!contratoId) throw new Error('Contrato ID é obrigatório.')

  const workflow = new AssinaturaWorkflow()
  await workflow.prepararSignatarios(contratoId)

  redirect(`/dashboard/contratos/${contratoId}?prepared=true`)
}

export async function enviarAAssinatura(formData: FormData) {
  const contratoId = formData.get('contrato_id') as string

  if (!contratoId) throw new Error('Contrato ID é obrigatório.')

  const workflow = new AssinaturaWorkflow()
  await workflow.enviarParaAssinatura(contratoId)

  redirect(`/dashboard/contratos/${contratoId}?sent=true`)
}

export async function criarRevisao(formData: FormData) {
  const supabase = await createClient()
  const contratoId = formData.get('contrato_id') as string;
  const corpoTexto = formData.get('corpo_texto') as string;
  const notaAlteracao = formData.get('nota_alteracao') as string;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !contratoId || !corpoTexto) throw new Error('Dados inválidos.')

  const { data: ultima } = await supabase
    .from('versoes_contrato')
    .select('numero_versao')
    .eq('contrato_id', contratoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const proximaVersao = ultima ? (parseFloat(ultima.numero_versao) + 0.1).toFixed(1) : '1.1'

  await supabase.from('versoes_contrato').insert({
    contrato_id: contratoId,
    corpo_texto: corpoTexto,
    numero_versao: proximaVersao,
    nota_alteracao: notaAlteracao,
    tipo_versao: 'revisao_interna',
    created_by: user.id
  })

  await supabase
    .from('contratos')
    .update({ corpo_atual: corpoTexto, status: 'em_revisao' })
    .eq('id', contratoId)

  redirect(`/dashboard/contratos/${contratoId}?rev=true`)
}

export async function criarAditivo(formData: FormData) {
  const supabase = await createClient()
  const contratoPaiId = formData.get('contrato_pai_id') as string;
  const titulo = formData.get('titulo') as string;
  const descricaoAlt = formData.get('descricao_alteracoes') as string;

  const { data: { user } } = await supabase.auth.getUser()
  const activeCompanyId = await getValidatedCompanyId()

  if (!user || !contratoPaiId || !titulo) throw new Error('Dados inválidos.')

  await supabase.from('aditivos_contrato').insert({
    contrato_pai_id: contratoPaiId,
    titulo: titulo,
    descricao_alteracoes: descricaoAlt,
    empresa_id: activeCompanyId,
    created_by: user.id
  })

  await supabase.from('eventos_contrato').insert({
    contrato_id: contratoPaiId,
    tipo_evento: 'criacao_aditivo',
    descricao: `Aditivo '${titulo}' criado vinculado ao contrato original.`
  })

  redirect(`/dashboard/contratos/${contratoPaiId}?aditivo=true`)
}

export async function criarObrigacao(formData: FormData) {
  const supabase = await createClient()
  const contratoId = formData.get('contrato_id') as string;
  const titulo = formData.get('titulo') as string;
  const dataPrevista = formData.get('data_prevista') as string;
  const prioridade = formData.get('prioridade') as string;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !contratoId || !titulo) throw new Error('Dados inválidos.')

  await supabase.from('obrigacoes_contrato').insert({
    contrato_id: contratoId,
    titulo: titulo,
    data_consolidado: dataPrevista ? new Date(dataPrevista) : null,
    prioridade: prioridade || 'media',
    status: 'pendente',
    created_by: user.id
  })

  redirect(`/dashboard/contratos/${contratoId}?obrigacao=true`)
}

export async function salvarTemplate(formData: FormData) {
  const supabase = await createClient()
  const activeCompanyId = await getValidatedCompanyId()
  const { data: { user } } = await supabase.auth.getUser()

  if (!activeCompanyId) throw new Error('Empresa ativa não selecionada.')
  if (!user) throw new Error('Não autenticado.')

  const titulo = formData.get('titulo') as string
  const corpoTemplate = formData.get('corpo_template') as string
  const variablesJson = formData.get('variables') as string
  const variables = variablesJson ? JSON.parse(variablesJson) : []

  // 1. Preparar File Upload se houver
  let imagemFundoPath = null
  const file = formData.get('fundo_certificado') as File | null
  
  if (file && file.size > 0) {
    const bucketName = 'contratos_arquivos'
    const fileExt = file.name.split('.').pop()
    const filePath = `${activeCompanyId}/templates/fundo_${Date.now()}.${fileExt}`
    
    // Tenta upload
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file)
      
    if (!uploadError) {
      imagemFundoPath = filePath
    } else {
      console.error('Erro ao fazer upload da imagem de fundo:', uploadError)
    }
  }

  // 2. Inserir o Template
  const { data: templateData, error: templateError } = await supabase
    .from('templates_contrato')
    .insert({
      empresa_id: activeCompanyId,
      titulo: titulo || 'Novo Template',
      corpo_template: corpoTemplate || '',
      status: 'ativo',
      created_by: user.id,
      versao: '1.0.0',
      imagem_fundo_path: imagemFundoPath
    })
    .select()
    .single()

  if (templateError) throw new Error(templateError.message)

  // 3. Inserir Variáveis vinculadas (Se houverem)
  if (variables && variables.length > 0) {
    const formattedVars = variables.map((v: any, index: number) => ({
      template_id: templateData.id,
      chave_tag: v.tag,
      rotulo: v.label || v.tag.replace('{{', '').replace('}}', '').toUpperCase(),
      tipo_dado: v.tipo || 'Texto',
      origem: v.origem || 'manual',
      ordem: index
    }))

    const { error: varsError } = await supabase
      .from('campos_template')
      .insert(formattedVars)

    if (varsError) throw new Error(varsError.message)
  }

  return { success: true, data: templateData }
}

export async function testMoodleConnection(courseId: string, docType: string) {
  const MOODLE_TOKEN = "71edd081c7e0c5bb83f872b60af80227"
  const MOODLE_URL = "https://ead.cidadeviva.org/webservice/rest/server.php"

  async function moodleRequest(wsfunction: string, params: Record<string, string> = {}) {
    const payload = new URLSearchParams({
      ...params,
      wstoken: MOODLE_TOKEN,
      moodlewsrestformat: 'json',
      wsfunction: wsfunction
    })

    try {
      const resp = await fetch(MOODLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
        cache: 'no-store'
      })
      return await resp.json()
    } catch (e: any) {
      return { error: true, message: e.message }
    }
  }

  try {
    const logs: string[] = []
    logs.push(`[1] Solicitando dados do curso ID: ${courseId}`)

    const courses = await moodleRequest('core_course_get_courses')
    if (courses.error) throw new Error(courses.message)
    
    const course = Array.isArray(courses) 
      ? courses.find((c: any) => String(c.id) === courseId) 
      : null

    if (!course) {
      logs.push(`❌ Curso ID ${courseId} não encontrado no Moodle.`)
      return { success: false, logs, variables: [] }
    }

    logs.push(`✅ Curso encontrado: ${course.fullname}`)

    logs.push("📡 Buscando lista de alunos matriculados...")
    const users = await moodleRequest('core_enrol_get_enrolled_users', { courseid: courseId })

    if (users.exception || users.error) {
      logs.push(`⚠️ Erro ao listar alunos: ${users.message || JSON.stringify(users)}`)
      return { success: false, logs, variables: [] }
    }

    logs.push(`✅ ${users.length} aluno(s) encontrado(s) no curso.`)

    let allUsers: Record<string, any>[] = []

    // Ajustamos para lotes de 25 para acelerar a carga sem estourar o limite de sockets
    const BATCH_SIZE = 25;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (user: any) => {
        const cpfField = user.customfields?.find((f: any) => f.shortname === 'cpf')?.value || '-'
        const nascimentoField = user.customfields?.find((f: any) => f.shortname === 'data_nascimento')?.value || '-'
        const semestreField = user.customfields?.find((f: any) => f.shortname === 'semestre')?.value || '-'
        const foneField = user.phone1 || user.phone2 || '-'

        const mappedUser: Record<string, any> = {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          phone: foneField,
          cpf: cpfField,
          data_nascimento: nascimentoField,
          semestre: semestreField,
          curso: course.fullname,
        }

        if (docType === 'historico') {
          try {
            const grades = await moodleRequest('gradereport_user_get_grade_items', { courseid: courseId, userid: String(user.id) })
            const gradeItems = grades?.usergrades?.[0]?.gradeitems || []
            
            let totalNotes = 0;
            let countNotes = 0;
            let courseTotalAverage: any = "-";

            const disciplineGrades = gradeItems
              .filter((g: any) => g.itemtype === 'mod' || g.itemtype === 'course')
              .map((g: any) => {
                const cleanedName = g.itemname ? g.itemname.replace(/<[^>]*>?/gm, '') : (g.itemtype === 'course' ? 'Total do Curso' : 'Curso');
                let gradeVal = g.graderaw !== undefined ? g.graderaw : '-';
                
                if (g.itemtype === 'course') {
                  courseTotalAverage = gradeVal;
                } else if (typeof gradeVal === 'number') {
                  totalNotes += gradeVal;
                  countNotes++;
                }
                return `${cleanedName}: ${typeof gradeVal === 'number' ? gradeVal.toFixed(1) : gradeVal}`;
              });

            mappedUser.notas_disciplinas = disciplineGrades.join(' | ') || '-'
            
            if (typeof courseTotalAverage === 'number') {
              mappedUser.media_final = courseTotalAverage.toFixed(1);
            } else {
              mappedUser.media_final = countNotes > 0 ? (totalNotes / countNotes).toFixed(1) : "-";
            }

            mappedUser.status = mappedUser.media_final !== "-" ? (parseFloat(mappedUser.media_final) >= 7 ? "Aprovado" : "Em Curso") : "Em Curso"

          } catch (e) {
            mappedUser.notas_disciplinas = "-"
            mappedUser.media_final = "-"
            mappedUser.status = "Erro"
          }
        }
        return mappedUser;
      });

      const batchResults = await Promise.all(batchPromises);
      allUsers.push(...batchResults);
    }

    const firstUserVars = allUsers.length > 0 ? Object.entries(allUsers[0]).map(([key, value]) => ({
      chave_tag: key.toUpperCase(),
      valor: String(value)
    })) : []

    return { 
      success: true, 
      logs, 
      variables: firstUserVars,
      allUsers
    }


  } catch (err: any) {
    return { success: false, logs: [`❌ Erro no teste: ${err.message}`] }
  }
}

export async function getMoodleCourses() {
  const MOODLE_TOKEN = "71edd081c7e0c5bb83f872b60af80227"
  const MOODLE_URL = "https://ead.cidadeviva.org/webservice/rest/server.php"

  async function moodleRequest(wsfunction: string, params: Record<string, string> = {}) {
    const payload = new URLSearchParams({
      ...params,
      wstoken: MOODLE_TOKEN,
      moodlewsrestformat: 'json',
      wsfunction: wsfunction
    })

    try {
      const resp = await fetch(MOODLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
        cache: 'no-store'
      })
      return await resp.json()
    } catch (e: any) {
      return { error: true, message: e.message }
    }
  }

  try {
    const courses = await moodleRequest('core_course_get_courses')
    const categories = await moodleRequest('core_course_get_categories')

    if (courses.exception || categories.exception) {
      throw new Error(courses.message || categories.message || "Erro retornado pela API Moodle")
    }

    if (courses.error || categories.error) {
      throw new Error(courses.message || categories.message || "Falha na conexão Moodle")
    }

    return { 
      success: true, 
      courses: Array.isArray(courses) ? courses : [],
      categories: Array.isArray(categories) ? categories : []
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function syncAllMoodleData() {
  const { createClient } = await import('@/infrastructure/supabase/client')
  const supabase = createClient()
  const logs: string[] = []
  
  try {
    logs.push("🚀 Iniciando Sincronização Global do Moodle...")
    const coursesRes = await getMoodleCourses()
    if (!coursesRes.success || !coursesRes.courses) {
      throw new Error("Não foi possível carregar os cursos do Moodle.")
    }

    const courses = coursesRes.courses
    logs.push(`📂 Encontrado(s) ${courses.length} curso(s) no Moodle.`)

    let totalSaved = 0

    for (const course of courses) {
      logs.push(`🔄 Processando curso ID ${course.id}: ${course.fullname}`)
      const usersRes = await testMoodleConnection(String(course.id), 'historico')
      
      if (usersRes.success && usersRes.allUsers) {
        const users = usersRes.allUsers
        for (const u of users) {
          const { error } = await supabase
            .from('dados_moodle_cursos')
            .upsert({
              curso: u.curso,
              disciplina: u.curso,
              professor: "Professor Moodle", 
              titulacao_professor: u.titulacao_professor || "Geral",
              carga_horaria: u.carga_horaria || "360h",
              creditos: u.creditos || 2,
              nota: parseFloat(u.media_geral) || 0
            })

          if (error) {
            logs.push(`⚠️ Erro ao salvar aluno ${u.fullname} no banco: ${error.message}`)
          } else {
            totalSaved++
          }
        }
      }
    }

    logs.push(`✅ Sincronização concluída! ${totalSaved} registros processados.`)
    return { success: true, logs }

  } catch (err: any) {
    return { success: false, logs: [...logs, `❌ Erro na sincronização: ${err.message}`] }
  }
}

export async function getCourseContents(courseId: string) {
  const MOODLE_TOKEN = "71edd081c7e0c5bb83f872b60af80227"
  const MOODLE_URL = "https://ead.cidadeviva.org/webservice/rest/server.php"

  const payload = new URLSearchParams({
    courseid: courseId,
    wstoken: MOODLE_TOKEN,
    moodlewsrestformat: 'json',
    wsfunction: 'core_course_get_contents'
  })

  try {
    const resp = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      cache: 'no-store'
    })
    const data = await resp.json()
    if (data.exception || data.error) {
       return { success: false, error: data.message || "Erro na API" }
    }
    return { success: true, contents: Array.isArray(data) ? data : [] }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getAvailableMoodleFunctions() {
  try {
    const fs = require('fs')
    const path = require('path')
    const filePath = path.join(process.cwd(), 'moodle_functions_available.json')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return { success: true, list: JSON.parse(data) }
    }
    return { success: false, error: "Arquivo de mapeamento não encontrado." }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
