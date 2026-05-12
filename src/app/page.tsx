import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-300 to-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">WM</span>
            </div>
            <span className="font-bold text-gray-900">We Make</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Login
            </Button>
            <Button variant="primary" size="sm">
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-4 bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-cyan-300 font-semibold text-sm uppercase tracking-wider">
                  Bem-vindo à We Make
                </p>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Educação Tecnológica de{' '}
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    Excelência
                  </span>
                </h1>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Plataforma completa de gestão comercial para escolas com programas de tecnologia, maker spaces e inovação criativa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button variant="primary" size="lg">
                  Comece Agora
                </Button>
                <Button variant="ghost" size="lg">
                  Saiba Mais
                </Button>
              </div>
            </div>

            {/* Hero Image/Video Placeholder */}
            <div className="relative h-96 lg:h-full bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎬</div>
                  <p className="text-gray-600">Vídeo Hero será inserido aqui</p>
                  <p className="text-sm text-gray-500">
                    Sala Maker • Crianças • Professores • Inovação
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que sua escola precisa para gestão comercial eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📋',
                title: 'Gestão de Contratos',
                description: 'Crie, aprove e gerencie contratos com facilidade',
              },
              {
                icon: '✍️',
                title: 'Assinatura Digital',
                description: 'Assinatura eletrônica segura e validada',
              },
              {
                icon: '📊',
                title: 'Relatórios',
                description: 'Análise completa de dados e métricas',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-lg border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500 to-cyan-300">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Pronto para transformar sua gestão?
          </h2>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto">
            Junte-se a centenas de escolas que já utilizam We Make
          </p>
          <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Solicitar Demo
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-300 to-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">WM</span>
                </div>
                <span className="font-bold">We Make</span>
              </div>
              <p className="text-gray-400 text-sm">nós criamos</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Preços</a></li>
                <li><a href="#" className="hover:text-white transition">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">Termos</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 We Make Platform. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
