# We Make Platform 🚀

Plataforma de Gestão Comercial para Educação Tecnológica com Excelência e Inovação Criativa.

## 📋 Sobre

We Make é uma plataforma completa de gestão comercial desenvolvida especificamente para escolas, educadores e instituições de ensino que trabalham com programas de tecnologia, maker spaces e inovação criativa.

**Tagline**: "nós criamos" ✨

### Valores
- 🎓 **Educação Tecnológica de Excelência**: Suporte completo para programas educacionais
- 💡 **Inovação Criativa**: Ferramentas para estimular criatividade e experimentação
- 🤝 **Transformação Integral**: Desenvolvimento holístico dos alunos
- 🌍 **Inclusão e Diversidade**: Acesso para todos

## 🛠 Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (quando necessário)
- **Package Manager**: npm/yarn

## 🎨 Design System

### Cores Principais
- **Cyan/Mint**: `#5FE3D0` (Primary)
- **Blue**: `#4A7FDB` (Secondary)
- **White**: `#FFFFFF` (Background)

### Tipografia
- **Font**: Inter
- **Weights**: 400, 500, 600, 700
- **Import**: Google Fonts

## 📁 Estrutura do Projeto

```
wemake/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   └── (dashboard)/       # Dashboard routes [em desenvolvimento]
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Componentes base
│   │   ├── forms/            # Formulários [em desenvolvimento]
│   │   ├── dashboard/        # Componentes da dashboard [em desenvolvimento]
│   │   └── common/           # Componentes comuns
│   ├── lib/                  # Utilitários e helpers
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Funções auxiliares
│   ├── styles/              # Estilos globais
│   ├── hooks/               # React hooks [em desenvolvimento]
│   └── types/               # TypeScript interfaces
├── public/                   # Assets estáticos
│   ├── videos/              # Vídeos Veo3
│   ├── images/              # Imagens
│   └── icons/               # Ícones
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 🚀 Getting Started

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Renatoassis86/wemake.git
cd wemake
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo com suas credenciais Supabase
nano .env.local
```

**Variáveis necessárias:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://vpacgvqkrkzskrzpsydg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sb_publishable_...
```

4. **Rode o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Abra no navegador**
```
http://localhost:3000
```

## 📚 Documentação

### Design System
Ver [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) para:
- Paleta de cores
- Componentes
- Efeitos e animações
- Padrões de layout

### Tipografia
Ver [TYPOGRAPHY_GUIDE.md](./TYPOGRAPHY_GUIDE.md) para:
- Escalas de tamanho
- Hierarquia visual
- Implementação com Tailwind

### Vídeos Hero
Ver [VEO3_PROMPT_VIDEOS.md](./VEO3_PROMPT_VIDEOS.md) para:
- Prompts para geração de vídeos
- Especificações técnicas
- Guia de cores

### Arquitetura
Ver [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) para:
- Explicação da abordagem zero-change
- Estrutura mantida da plataforma original
- Funcionalidades preservadas

## 🧩 Componentes Disponíveis

### UI Components
- `Button` - Botão com variantes (primary, secondary, ghost, danger)
- `Card` - Cartão com header, content, footer
- `Input` - Campo de entrada com label e validação
- `Badge` - Badge/tag com variantes
- (Mais componentes em desenvolvimento)

### Uso de Componentes

```tsx
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <h2>Meu Card</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Email" type="email" placeholder="seu@email.com" />
        <Button variant="primary">Enviar</Button>
      </CardContent>
    </Card>
  )
}
```

## 🔐 Segurança

- ✅ Row Level Security (Supabase)
- ✅ Autenticação segura (Supabase Auth)
- ✅ HTTPS apenas
- ✅ Variáveis de ambiente protegidas
- ✅ Validação de entrada

**⚠️ IMPORTANTE**: Nunca commite `.env.local` ou arquivos com credenciais!

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build para produção
npm start           # Roda build em produção

# Verificação
npm run lint        # Executa ESLint
npm run type-check  # Verifica tipos TypeScript

# Formatação
npm run format      # Formata código com Prettier
npm run format:check # Verifica formatação
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px+

Testado em:
- ✅ iPhone (375px)
- ✅ iPad (768px)
- ✅ Desktop (1920px+)

## 🎬 Vídeos Hero

Três vídeos educacionais foram criados no Veo3:
1. **Sala Maker - Robotics**: Crianças em laboratório maker
2. **Professor - Programação**: Mentorado em sala de aula
3. **Diversidade - Maker**: Inclusão e criatividade

Local: `/public/videos/`

## 📊 Status do Projeto

### Fase 1: Setup ✅ COMPLETO
- [x] Estrutura Next.js
- [x] Design system
- [x] Componentes UI base
- [x] Landing page
- [x] Tipografia e cores

### Fase 2: Vídeos 🔄 EM PROGRESSO
- [ ] Gerar vídeos no Veo3
- [ ] Integrar ao hero section
- [ ] Otimizar para web

### Fase 3: Dashboard 📋 PRÓXIMO
- [ ] Estrutura de dashboard
- [ ] Componentes de contratos
- [ ] Integração com Supabase

### Fase 4: Features 🔜 FUTURO
- [ ] Gestão de contratos completa
- [ ] Assinatura digital
- [ ] Relatórios
- [ ] Sistema de pagamentos

## 🤝 Contributing

Contribuições são bem-vindas! Para grandes mudanças:
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Commits

Seguimos convenção de commit clara:
```
[Type]: [Description]

Mais detalhes se necessário

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📄 Licença

Propriedade da We Make - Educação Tecnológica

## 📞 Contato

- **Website**: https://wemake.tec.br
- **Email**: contato@wemake.tec.br
- **Tagline**: "nós criamos" ✨

## 🎯 Próximos Passos

1. ✅ Projeto Next.js iniciado
2. ⏳ Gerar 3 vídeos educacionais no Veo3
3. ⏳ Integrar vídeos ao hero section
4. ⏳ Criar página de dashboard de contratos
5. ⏳ Implementar gestão de contratos completa

---

**Desenvolvido com ❤️ para educação tecnológica de excelência.**
