'use client'

import { useRouter } from 'next/navigation'

export interface EscolaOpcao { id: string; nome: string; cidade_uf: string }

export function EscolaPicker({ escolas, atualId }: { escolas: EscolaOpcao[]; atualId: string }) {
  const router = useRouter()

  return (
    <div className="ca-picker">
      <label htmlFor="ca-picker-escola">Escola</label>
      <select
        id="ca-picker-escola"
        value={atualId}
        onChange={e => router.push(e.target.value ? `/academia/ciclo-anual?escola=${e.target.value}` : '/academia/ciclo-anual')}
      >
        <option value="">— Todas as escolas (visão geral) —</option>
        {escolas.map(e => (
          <option key={e.id} value={e.id}>{e.nome}{e.cidade_uf ? ` · ${e.cidade_uf}` : ''}</option>
        ))}
      </select>
      {atualId ? (
        <a href="/academia/ciclo-anual" className="ca-picker-voltar">← Ver todas as escolas</a>
      ) : null}
    </div>
  )
}
