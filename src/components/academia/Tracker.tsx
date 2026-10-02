import { MARCOS } from '@/lib/academia'

/**
 * Régua dos nove marcos do Painel Mestre. Os marcos que o documento sustenta
 * ficam em destaque, no mesmo padrão dos documentos diagramados.
 */
export default function Tracker({ active }: { active: number[] }) {
  return (
    <ol className="ac-tracker" aria-label="Marcos da implantação">
      {MARCOS.map((m, i) => (
        <li key={m} className={active.includes(i) ? 'is-on' : undefined} aria-current={active.includes(i) ? 'step' : undefined}>
          <span>{m}</span>
        </li>
      ))}
    </ol>
  )
}
