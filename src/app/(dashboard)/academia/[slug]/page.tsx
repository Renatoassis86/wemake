import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DocHero from '@/components/academia/DocHero'
import DocBody from '@/components/academia/DocBody'
import TocRail, { TocMobile } from '@/components/academia/TocRail'
import Tracker from '@/components/academia/Tracker'
import { ACADEMIA_DOCS, MARCOS, ORIGEM_LABEL, buildOutline, getDoc, getNeighbors, headerFacts } from '@/lib/academia'

type Params = { slug: string }

export function generateStaticParams() {
  return ACADEMIA_DOCS.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const doc = getDoc(slug)
  return { title: doc ? `${doc.short} · Academia We Make` : 'Academia We Make' }
}

export default async function AcademiaDocPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()

  const { prev, next } = getNeighbors(doc.slug)
  const outline = buildOutline(doc.content.blocks)
  const showTracker = doc.grupo !== 'Fundamentos'
  const marcos = doc.marcos.length ? doc.marcos : MARCOS.map((_, i) => i)
  const wide = doc.content.blocks.some(b => b.t === 'table' && (b.kind === 'resources' || b.rows[0]?.length >= 6))

  return (
    <>
      <DocHero
        crumbs={[{ label: 'Academia We Make', href: '/academia' }, { label: doc.grupo }, { label: doc.short }]}
        eyebrow={doc.kicker}
        tipo={doc.tipo}
        title={doc.title}
        deck={doc.deck}
        facts={headerFacts(doc)}
      />

      {showTracker ? (
        <div className="ac-trackbar">
          <Tracker active={marcos} />
        </div>
      ) : null}

      <div className="ac-wrap ac-wrap--doc">
        <article className={`ac-article${wide ? ' ac-article--wide' : ''}`}>
          <TocMobile items={outline} />
          <DocBody blocks={doc.content.blocks} />

          <p className="ac-source">
            {ORIGEM_LABEL[doc.origem]}
            {doc.oficialNo ? ` nº ${doc.oficialNo}` : ''}. Texto integral de «{doc.fonte}».
          </p>

          <nav className="ac-pager" aria-label="Documentos anterior e seguinte">
            {prev ? (
              <Link href={`/academia/${prev.slug}`} className="is-prev">
                <small>← Anterior · {String(prev.n).padStart(2, '0')}</small>
                <b>{prev.short}</b>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/academia/${next.slug}`} className="is-next">
                <small>Seguinte · {String(next.n).padStart(2, '0')} →</small>
                <b>{next.short}</b>
              </Link>
            ) : <span />}
          </nav>
        </article>

        <TocRail items={outline} />
      </div>
    </>
  )
}
