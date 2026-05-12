'use client'

import { useState, useEffect } from 'react'
import styles from './manual.module.css'
import { FileText, Database, Layers, RefreshCw, Box, HelpCircle, Info } from 'lucide-react'
import { getAvailableMoodleFunctions } from '../../../../actions'

export default function ManualMoodlePage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<any[]>([])
  const itemsPerPage = 7

  const curatedRows = [
    {
      namespace: '`core_users_*` e `core_enrol_*`',
      dados: 'Dados de Perfil completos, Emails, CPF, Telefone, Histórico de Matrículas e Datas de Ingressos.',
      inteligencia: 'Censo Acadêmico: Diagnóstico demográfico e volumetria de novas matrículas.',
      color: 'var(--primary)'
    },
    {
      namespace: '`core_course_*` e `core_notes_*`',
      dados: 'Ementas, Sumários de Tópicos, Atividades, links, e anotações feitas por professores sobre os alunos.',
      inteligencia: 'NLP Ativo: Análise de sentimento de feedback docente e auditoria de cobertura de ementas.',
      color: '#F59E0B'
    },
    {
      namespace: '`gradereport_*` e `core_grades_*`',
      dados: 'Notas estruturadas, Pesos de Avaliações, Médias das Disciplinas e Cálculo de aprovação por módulo.',
      inteligencia: 'Série de Desempenho: Curva de aprendizagem e gargalos de aprovação.',
      color: '#38BDF8'
    },
    {
      namespace: '`mod_quiz_*` e `mod_assign_*`',
      dados: 'Tentativas de testes, respostas exatas de cada questão, PDFs anexados em trabalhos entregues.',
      inteligencia: 'Micro-Inteligência: Saber o percentual de erro por questão para auditar a qualidade da prova.',
      color: 'var(--primary)'
    },
    {
      namespace: '`core_log_*`',
      dados: 'Logs de Cliques de Segundo a Segundo. Identifica cada arquivo aberto, vídeo assistido ou clique dado.',
      inteligencia: 'Predictive Churn: Monitorar queda de atividade diária para antever desistências (Evasão).',
      color: '#F59E0B'
    },
    {
      namespace: '`core_badges_*` e `core_competency_*`',
      dados: 'Medalhas eletrônicas recebidas, Trilhas de Habilidades completadas e certificações de competência.',
      inteligencia: 'Gamificação: Ranking de habilidades e engajamento da turma.',
      color: '#38BDF8'
    },
    {
      namespace: '`mod_forum_*`',
      dados: 'Mensagens trocadas nos fóruns de discussão, tópicos criados e likes/interações entre alunos.',
      inteligencia: 'Grafo Social: Mapear quem são os alunos influenciadores ou os que estão isolados na rede.',
      color: 'var(--primary)'
    }
  ]

  useEffect(() => {
    async function loadRaw() {
      const res = await getAvailableMoodleFunctions()
      if (res.success && Array.isArray(res.list)) {
        // Agrupar por Namespace prefixo (ex: core_course, mod_quiz)
        const groups: Record<string, string[]> = {}
        res.list.forEach((f: any) => {
          const parts = f.name.split('_')
          const ns = parts.slice(0, 2).join('_') + '_*' // ex: core_course_*
          if (!groups[ns]) groups[ns] = []
          if (groups[ns].length < 3) groups[ns].push(f.name) // limit list size
        })

        const dynamicRows = Object.keys(groups).map(ns => {
          // Pular os que já estão no curatedRows (por string match aproximado)
          if (curatedRows.some(r => r.namespace.includes(ns.split('_')[0]))) return null;
          
          return {
            namespace: `\`${ns}\``,
            dados: `Funções brutas: ${groups[ns].join(', ')}...`,
            inteligencia: 'Acesso total via API Server: Consultas analíticas sob demanda.',
            color: 'var(--secondary)'
          }
        }).filter(Boolean)

        setTableData([...curatedRows, ...dynamicRows])
      } else {
        setTableData(curatedRows)
      }
    }
    loadRaw()
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FileText size={28} style={{ color: 'var(--primary)' }} /> Manual e Radiografia da API do Moodle
        </h1>
        <p className={styles.subtitle}>Diagnóstico definitivo dos dados estruturados, séries temporais e ETL do Moodle para suporte à decisão.</p>
      </div>

      <div className={styles.grid}>
        {/* Painel 1: Dados Estruturados */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database size={18} style={{ color: 'var(--primary)' }} />
            <h3 className={styles.cardTitle}>1. Dados Estruturados (Disponíveis)</h3>
          </div>
          <p className={styles.cardDesc}>Estas variáveis são lidas em tempo real nas consultas. Podem ser inseridas diretamente no banco Supabase para cruzamentos operacionais.</p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Campo</th>
                  <th className={styles.th}>Tipo</th>
                  <th className={styles.th}>Fonte Moodle</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 700 }}>fullname</td>
                  <td className={styles.td}>String</td>
                  <td className={styles.td}><span className={styles.badge}>core_users</span></td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 700 }}>email</td>
                  <td className={styles.td}>String (Email)</td>
                  <td className={styles.td}><span className={styles.badge}>core_users</span></td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 700 }}>cpf</td>
                  <td className={styles.td}>String (Numérica)</td>
                  <td className={styles.td}><span className={styles.badge}>CustomField</span></td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 700 }}>semestre</td>
                  <td className={styles.td}>String (Ex: 20241)</td>
                  <td className={styles.td}><span className={styles.badge}>CustomField</span></td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 700 }}>media_geral</td>
                  <td className={styles.td}>Float (Nota)</td>
                  <td className={styles.td}><span className={styles.badge}>Calculado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel 2: Processo de ETL e Não Estruturados */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Layers size={18} style={{ color: '#F59E0B' }} />
            <h3 className={styles.cardTitle}>2. Processo de ETL e Não Estruturados</h3>
          </div>
          <p className={styles.cardDesc}>Variáveis que exigem blocos de tratamento (Parsing) antes de modelar matrizes e análises preditivas por ciclo.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className={styles.highlightCard}>
              <span className={styles.highlightTitle}>Notas por Disciplinas (`notas_disciplinas`)</span>
              <p className={styles.highlightDesc}>Estrutura: String com divisor (`|`). Ex: *"A1: 8.5 | A2: 9.0"*</p>
              <p className={styles.highlightDesc} style={{ color: '#F59E0B', marginTop: '0.25rem' }}>Operação ETL: Aplicar Split e Regex `([\w\s]+):\s?(\d+\.?\d*)` para extrair pares chave-valor para séries de notas.</p>
            </div>

            <div className={styles.highlightCard}>
              <span className={styles.highlightTitle}>Diferenciação Docente vs Discente</span>
              <p className={styles.highlightDesc}>Estrutura: Lista de inscritos agrega todos os papéis.</p>
              <p className={styles.highlightDesc} style={{ color: '#F59E0B', marginTop: '0.25rem' }}>Operação ETL: Filtro direto no backend usando o array `roles` ou o shorthand de permissões (`editingteacher`).</p>
            </div>
          </div>
        </div>

        {/* Painel 3: Série Temporal e Decisão */}
        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <RefreshCw size={18} style={{ color: '#38BDF8' }} />
            <h3 className={styles.cardTitle}>3. Séries Temporais e Inteligência Acadêmica</h3>
          </div>
          <p className={styles.cardDesc}>Como converter este fluxo em dimensões analíticas de acompanhamento estratégico.</p>
          
          <ul className={styles.timelineList}>
            <li className={styles.timelineItem}>
              <div className={styles.timelineDot} style={{ background: '#38BDF8' }}></div>
              <div>
                <strong style={{ color: 'var(--foreground)' }}>Janela Histórica Dinâmica</strong>: O Moodle armazena dados desde o lançamento das disciplinas. Pode-se plotar curvas de médias por safra de entrada (`semestre`).
              </div>
            </li>
            <li className={styles.timelineItem}>
              <div className={styles.timelineDot} style={{ background: '#38BDF8' }}></div>
              <div>
                <strong style={{ color: 'var(--foreground)' }}>Risco de Evasão (Predictive Churn)</strong>: Alunos sem registros de notas nos últimos 30 dias ganham alerta (Flag Vermelho) de inatividade.
              </div>
            </li>
            <li className={styles.timelineItem}>
              <div className={styles.timelineDot} style={{ background: '#38BDF8' }}></div>
              <div>
                <strong style={{ color: 'var(--foreground)' }}>Performance Docente</strong>: Isolando médias das disciplinas e cruzando com o professor anexado cria-se correlações de engajamento x aproveitamento.
              </div>
            </li>
          </ul>
        </div>

        {/* REGRA 4: Mapeamento de Endpoints (Dedicado) */}
        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <Box size={18} style={{ color: 'var(--primary)' }} />
            <h3 className={styles.cardTitle}>4. Guia de Endpoints Disponíveis (Universo Completo Moodle)</h3>
          </div>
          <p className={styles.cardDesc}>O Moodle Cidade Viva expõe +400 funções WebService. Abaixo estão as categorias de dados que o sistema pode mapear, divididos por famílias de funções (Namespaces).</p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Família de Funções (Namespace)</th>
                  <th className={styles.th}>Dados que Entrega (Estruturados e Não Estruturados)</th>
                  <th className={styles.th}>Poder de Análise / Inteligência</th>
                </tr>
              </thead>
              <tbody>
                {tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, index) => (
                  <tr key={index} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 700, fontFamily: 'var(--mono)' }}>{row.namespace}</td>
                    <td className={styles.td}>{row.dados}</td>
                    <td className={styles.td}><span style={{ color: row.color }}>{row.inteligencia}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Página {currentPage} de {Math.ceil(tableData.length / itemsPerPage)}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                &larr; Anterior
              </button>
              <button 
                disabled={currentPage >= Math.ceil(tableData.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  color: '#000',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: currentPage >= Math.ceil(tableData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= Math.ceil(tableData.length / itemsPerPage) ? 0.4 : 1
                }}
              >
                Próxima &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* REGRA 5: MEMÓRIA DE CÁLCULO */}
        <div className={styles.card} style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <div className={styles.cardHeader}>
            <Info size={18} style={{ color: 'var(--primary)' }} />
            <h3 className={styles.cardTitle}>5. Memória de Cálculo: Atribuição de Notas e Médias Final de Cursos</h3>
          </div>
          <p className={styles.cardDesc}>Explicação técnica de como o sistema consome os pesos e formula os resultados dos alunos da API Gradebook.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{ color: 'var(--foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>A. Estrutura Moodle (API Grade Items)</h4>
              <p className={styles.cardDesc} style={{ fontSize: '0.75rem', lineHeight: '1.35rem' }}>
                O Moodle devolve os blocos de notas categorizando os itens pelo campo <code>itemtype</code>:
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', color: 'var(--secondary)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li><code>itemtype === "mod"</code>: Avaliações individuais (Questionários, Tarefas, Fóruns).</li>
                <li><code>itemtype === "course"</code>: O somatório/média consolidado calculado pelo próprio motor de Pesos do Moodle. Ele já obedece aos cálculos de pesos, bonificações ou multiplicações operacionais configurados pelo professor.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>B. Fluxo da Memória de Cálculo (Algoritmo do Painel)</h4>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--mono)', fontSize: '0.688rem', color: 'var(--secondary)', lineHeight: '1.2rem' }}>
                <span style={{ color: 'var(--primary)' }}># Lógica de Amostragem do Painel:</span><br/>
                <span style={{ color: '#FB923C' }}>PARA CADA</span> nota <span style={{ color: '#FB923C' }}>EM</span> itens_moodle <span style={{ color: '#FB923C' }}>FAÇA</span>:<br/>
                &nbsp;&nbsp;<span style={{ color: '#FB923C' }}>SE</span> (<span style={{ color: '#38BDF8' }}>g.itemtype === "course"</span>) <span style={{ color: '#FB923C' }}>{'{'}</span> <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#10B981' }}>// FIX: Usar direto o total ponderado pelo Moodle</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;Media_Final = g.graderaw;<br/>
                &nbsp;&nbsp;<span style={{ color: '#FB923C' }}>{'}'}</span> <span style={{ color: '#FB923C' }}>SENÃO SE</span> (<span style={{ color: '#38BDF8' }}>g.itemtype === "mod"</span>) <span style={{ color: '#FB923C' }}>{'{'}</span> <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;Total_Notas += g.graderaw;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;Contador++;<br/>
                &nbsp;&nbsp;<span style={{ color: '#FB923C' }}>{'}'}</span><br/>
                <br/>
                <span style={{ color: 'var(--primary)' }}># Fallback (Se course=NaN):</span><br/>
                Media_Final = Total_Notas / Contador;<br/>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
