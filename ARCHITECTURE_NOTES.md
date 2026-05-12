# Notas de Arquitetura - We Make Platform

## 📐 Estrutura do Projeto

### ⚠️ IMPORTANTE
**A arquitetura da plataforma mantém a estrutura completa e funcionalidade da plataforma de gestão comercial original. Nenhuma mudança estrutural será feita na arquitetura.**

Estamos apenas **customizando visualmente** para a identidade da We Make (cores, tipografia, logo, vídeos).

---

## 🎯 Objetivos da Customização

1. **Identidade Visual**: Adaptar para cores e logo da We Make
2. **Tipografia**: Usar fontes do site wemake.tec.br (Inter)
3. **Vídeos Hero**: Criar 3 vídeos com tema educação tecnológica
4. **Paleta de Cores**: Cyan (#5FE3D0) + Blue (#4A7FDB)
5. **Tom**: Educacional, inspirador, inclusivo

**O QUE NÃO MUDA**:
- ❌ Funcionalidades da plataforma
- ❌ Arquitetura de banco de dados
- ❌ Fluxo de gestão de contratos
- ❌ Sistema de autenticação
- ❌ APIs e integrações
- ❌ Estrutura de pastas/componentes
- ❌ Lógica de negócio

---

## 📦 Stack Tecnológico (Mantido)

```
Frontend:
- Framework: Next.js (React)
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Payment: Stripe
- Language: TypeScript
- Package Manager: npm/yarn

Backend:
- Supabase (Backend as a Service)
- PostgreSQL (Database)
- Row Level Security (RLS)
- Real-time Subscriptions
```

---

## 📁 Estrutura de Pastas (Mantida)

```
wemake/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── (dashboard)/        # Layout da dashboard
│   │   ├── auth/               # Páginas de autenticação
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                 # Componentes base (Button, Card, etc)
│   │   ├── forms/              # Formulários
│   │   ├── dashboard/          # Componentes da dashboard
│   │   ├── contracts/          # Componentes de contratos
│   │   └── common/             # Componentes comuns (Header, Footer, etc)
│   ├── lib/                    # Utilitários e helpers
│   │   ├── supabase.ts        # Cliente Supabase
│   │   ├── utils.ts           # Funções auxiliares
│   │   └── types.ts           # Tipos compartilhados
│   ├── styles/                 # Estilos globais
│   ├── hooks/                  # React hooks customizados
│   └── types/                  # TypeScript interfaces
├── public/                     # Assets estáticos
│   ├── videos/                 # Vídeos Veo3 (3 hero videos)
│   ├── images/                 # Imagens (logo We Make, etc)
│   └── icons/                  # Ícones (SVG)
├── tailwind.config.ts          # Configuração Tailwind
├── next.config.ts              # Configuração Next.js
├── tsconfig.json               # TypeScript config
├── package.json                # Dependências
└── .env.example                # Variáveis de ambiente
```

---

## 🎨 Customizações Visuais Apenas

### 1. Colors & Theming
```typescript
// tailwind.config.ts - APENAS CORES CUSTOMIZADAS
export const colors = {
  'cyan': '#5FE3D0',      // Primary
  'blue': '#4A7FDB',      // Secondary
  // Resto mantém padrão
}
```

### 2. Tipografia
```typescript
// Font import no layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})
```

### 3. Logo & Assets
```
public/
├── logo-we-make.svg           # Logo novo
├── logo-we-make-white.svg     # Logo branco
├── identidade/                # Guias visuais
└── videos/
    ├── hero-video-1.mp4       # Sala Maker - Robotics
    ├── hero-video-2.mp4       # Professor - Programação
    └── hero-video-3.mp4       # Diversidade - Maker
```

### 4. Landing Page (Hero)
```typescript
// src/app/page.tsx
// Componente Hero com 3 vídeos integrados
// Paleta de cores We Make
// Tipografia Inter
// Logo em Cyan/Blue
```

---

## 🔄 Funcionalidades Mantidas

✅ Autenticação de usuários  
✅ Dashboard de gestão  
✅ Criação de contratos  
✅ Fluxo de aprovação de contratos  
✅ Assinatura digital  
✅ Armazenamento de documentos  
✅ Relatórios e analytics  
✅ Pagamentos (Stripe)  
✅ Sistema de notificações  
✅ Controle de acesso (RLS)  
✅ Multi-tenant (múltiplas escolas)  

---

## 📊 Fluxo de Dados (Mantido)

```
User Login
  ↓
Supabase Auth
  ↓
Dashboard (Contratos, Dados)
  ↓
Supabase PostgreSQL
  ↓
Stripe (Pagamentos) [se aplicável]
  ↓
Arquivos & Documentos (Storage)
```

---

## 🚀 Próximas Etapas

### Fase 1: Setup Inicial
- [ ] Clonar estrutura da plataforma original
- [ ] Configurar Supabase com .env
- [ ] Instalar dependências
- [ ] Testar conexão com BD

### Fase 2: Customização Visual
- [ ] Atualizar `tailwind.config.ts` com cores We Make
- [ ] Importar fonte Inter
- [ ] Adicionar logo We Make (assets)
- [ ] Criar componentes com nova paleta

### Fase 3: Vídeos Hero
- [ ] Fazer download dos 3 vídeos Veo3
- [ ] Otimizar para web (compressão)
- [ ] Integrar ao componente Hero
- [ ] Testar responsividade

### Fase 4: Landing Page
- [ ] Customizar página inicial
- [ ] Integrar vídeos
- [ ] Ajustar copy para educação
- [ ] Testar em diferentes devices

### Fase 5: Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Deploy no Vercel (ou similar)
- [ ] Testes finais
- [ ] Go live!

---

## 📝 Princípios de Desenvolvimento

1. **Zero Breaking Changes**: Nenhuma modificação que quebre funcionalidades existentes
2. **CSS-only Customization**: Mudanças visuais apenas via Tailwind/CSS
3. **Preservar Estrutura**: Manter nomes de componentes, funções, rotas
4. **Documentação**: Manter docs em dia conforme mudanças
5. **Testes**: Validar que funcionalidades continuam operando

---

## ⚡ Variáveis de Ambiente (Mantidas)

```env
# .env.local (NÃO commitar!)
NEXT_PUBLIC_SUPABASE_URL=https://vpacgvqkrkzskrzpsydg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sb_publishable_...
```

---

## 🔐 Segurança (Mantida)

- ✅ Row Level Security (Supabase)
- ✅ Authentication (Supabase Auth)
- ✅ HTTPS only
- ✅ Secrets não commitar no git
- ✅ API calls via backend routes
- ✅ Validação de entrada

---

## 📚 Referências

- **Original Platform**: Plataforma de Gestão Comercial (estrutura mantida)
- **Design System**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Typography**: [TYPOGRAPHY_GUIDE.md](./TYPOGRAPHY_GUIDE.md)
- **Vídeos**: [VEO3_PROMPT_VIDEOS.md](./VEO3_PROMPT_VIDEOS.md)
- **Identidade**: [Identidade/](./Identidade/)

---

## ✋ RESUMO FINAL

> **NÓS ESTAMOS APENAS "PINTAR" O PROJETO COM AS CORES E IDENTIDADE DA WE MAKE, MAS A ESTRUTURA E FUNCIONALIDADE ORIGINAL CONTINUAM EXATAMENTE IGUAIS.**

Isso permite:
- ✅ Reutilizar toda lógica já desenvolvida
- ✅ Manter estabilidade e confiabilidade
- ✅ Foco total em customização visual
- ✅ Time reduzido pode fazer mudanças
- ✅ Time original pode continuar desenvolvendo features novas

