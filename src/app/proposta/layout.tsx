import type { Metadata } from 'next'
import { PropostaEstilos } from '@/components/comercial/PropostaEstilos'

const SITE_URL = 'https://comercial.wemake.tec.br'
const OG_IMAGE = `${SITE_URL}/proposta/foto_propostacomercial.png`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Proposta We Make',
  description: 'Sua proposta de parceria exclusiva We Make',
  openGraph: {
    title: 'Proposta We Make',
    description: 'Sua proposta de parceria exclusiva We Make',
    images: [{ url: OG_IMAGE, width: 1672, height: 941, alt: 'We Make — Educação Tecnológica e Maker' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proposta We Make',
    description: 'Sua proposta de parceria exclusiva We Make',
    images: [OG_IMAGE],
  },
}

export default function PropostaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PropostaEstilos />
      {children}
    </>
  )
}
