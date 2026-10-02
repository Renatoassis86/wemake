'use client'

import { useEffect, useState } from 'react'
import type { OutlineItem } from '@/lib/academia'

/** Marca a seção que está na tela. */
function useActive(items: OutlineItem[]) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null)
  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [items])
  return active
}

function List({ items, active }: { items: OutlineItem[]; active: string | null }) {
  return (
    <ol className="ac-toc-list">
      {items.map(it => (
        <li key={it.id} className={`ac-toc-i ac-toc-l${it.level}${active === it.id ? ' is-active' : ''}`}>
          <a href={`#${it.id}`} aria-current={active === it.id ? 'location' : undefined}>
            {it.n ? <span className="ac-toc-n">{it.n}</span> : null}
            <span>{it.label}</span>
          </a>
        </li>
      ))}
    </ol>
  )
}

/** Sumário lateral fixo (telas largas). */
export default function TocRail({ items }: { items: OutlineItem[] }) {
  const active = useActive(items)
  if (!items.length) return null
  return (
    <nav className="ac-toc" aria-label="Neste documento">
      <div className="ac-toc-h">Neste documento</div>
      <List items={items} active={active} />
    </nav>
  )
}

/** Sumário recolhível (telas estreitas). */
export function TocMobile({ items }: { items: OutlineItem[] }) {
  const active = useActive(items)
  if (!items.length) return null
  return (
    <details className="ac-toc-m">
      <summary>Neste documento</summary>
      <List items={items} active={active} />
    </details>
  )
}
