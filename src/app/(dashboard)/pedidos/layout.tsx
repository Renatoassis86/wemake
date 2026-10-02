import ModuloShell from '@/components/academia/gestao/ModuloShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuloShell slug="pedidos">{children}</ModuloShell>
}
