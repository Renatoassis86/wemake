import { Source_Serif_4 } from 'next/font/google'
import DocHero from '@/components/academia/DocHero'
import GeralNav from '@/components/academia/gestao/GeralNav'
import '../academia/academia.css'
import '../academia/gestao.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata = { title: 'Gestão Geral · We Make' }

export default function GestaoGeralLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ac ${serif.variable}`}>
      <DocHero
        variant="compact"
        crumbs={[{ label: 'Plataforma We Make', href: '/' }, { label: 'Gestão Geral' }]}
        eyebrow="Administrativo · Financeiro · Resultado"
        title="Gestão Geral"
        deck="Tudo o que a We Make precisa para administrar, cobrar, pagar e crescer, num só lugar."
      />
      <GeralNav />
      <div className="ac-wrap ac-wrap--gestao">{children}</div>
    </div>
  )
}
