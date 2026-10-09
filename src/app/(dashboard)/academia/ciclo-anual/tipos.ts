// Tipos e constantes do Ciclo Anual — deliberadamente FORA de actions.ts.
// actions.ts tem 'use server' no topo, e esse diretiva só permite exportar
// funções assíncronas: qualquer `export const` de valor (como os arrays
// abaixo) que ficasse lá não chega corretamente no bundle do cliente — a
// referência vira algo que não é um array de verdade, e qualquer `.map()`
// sobre ela quebra em runtime só no navegador (é por isso que o editor de
// cartão e o status por escola travavam ao abrir, mas a tela em si não).

export type Resultado = { ok: true; id?: string } | { ok: false; erro: string }

export type Momento = 'conhecer' | 'explorar' | 'criar'
export const STATUS_TAGS = ['dado', 'sugerido', 'decidido'] as const
export type StatusTag = (typeof STATUS_TAGS)[number]

/** Status de execução de um cartão PARA UMA ESCOLA — diferente do status_tag
 * (que é sobre a confiança do dado no molde, não sobre o andamento real). */
export const STATUS_EXECUCAO = ['Não iniciado', 'Em andamento', 'Aguardando escola', 'Aguardando We Make', 'Concluído', 'Bloqueado'] as const
export type StatusExecucao = (typeof STATUS_EXECUCAO)[number]
