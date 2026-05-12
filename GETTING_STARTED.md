# 🚀 Getting Started - We Make Platform

Guia rápido para começar a desenvolver a plataforma We Make.

## ⚡ Quick Start (5 minutos)

### 1. Clone o repositório
```bash
git clone https://github.com/Renatoassis86/wemake.git
cd wemake
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vpacgvqkrkzskrzpsydg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sb_publishable_...
```

### 4. Rode o servidor de desenvolvimento
```bash
npm run dev
```

### 5. Abra no navegador
```
http://localhost:3000
```

✅ Pronto! Você verá a landing page da We Make.

---

## 📂 Estrutura de Pastas Importante

```
wemake/
├── src/
│   ├── app/              # Páginas (Next.js App Router)
│   │   ├── page.tsx     # Landing page
│   │   └── layout.tsx   # Layout raiz
│   ├── components/       # Componentes React
│   │   └── ui/          # Componentes base (Button, Card, Input)
│   ├── lib/             # Utilitários
│   │   ├── supabase.ts  # Cliente Supabase
│   │   └── utils.ts     # Funções auxiliares
│   ├── styles/          # Estilos CSS
│   └── types/           # TypeScript interfaces
├── public/              # Assets (imagens, vídeos, ícones)
├── tailwind.config.ts   # Configuração Tailwind (cores customizadas)
└── next.config.js       # Configuração Next.js
```

---

## 🎨 Cores da We Make

Use estas cores em todo o projeto:

```tsx
// Primary (Cyan/Mint)
className="bg-cyan-300 text-cyan-600 border-cyan-500"

// Secondary (Blue)
className="bg-blue-500 text-blue-600 border-blue-500"

// No Tailwind:
// Cyan:  #5FE3D0
// Blue:  #4A7FDB
```

---

## 🧩 Componentes Disponíveis

### Button
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="md">
  Clique aqui
</Button>

// Variantes: primary, secondary, ghost, danger
// Tamanhos: sm, md, lg
// Props: disabled, isLoading, children
```

### Card
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

<Card variant="default">
  <CardHeader>Título</CardHeader>
  <CardContent>Conteúdo aqui</CardContent>
  <CardFooter>Rodapé</CardFooter>
</Card>

// Variantes: default, elevated, outlined
```

### Input
```tsx
import Input from '@/components/ui/Input'

<Input
  label="Email"
  type="email"
  placeholder="seu@email.com"
  error={errors.email}
  helperText="Digite seu email"
/>
```

---

## 🔄 Supabase Integration

### Conectar ao Supabase
```tsx
import { supabase } from '@/lib/supabase'

// Query
const { data, error } = await supabase
  .from('contracts')
  .select('*')
  .eq('status', 'pending')

// Insert
const { data, error } = await supabase
  .from('contracts')
  .insert([{ title: 'Contract 1', status: 'draft' }])

// Update
const { data, error } = await supabase
  .from('contracts')
  .update({ status: 'approved' })
  .eq('id', contractId)
```

### Autenticação
```tsx
import { signInWithEmail, signOut } from '@/lib/supabase'

// Login
await signInWithEmail('user@email.com', 'password')

// Logout
await signOut()
```

---

## 📝 Utilitários Úteis

```tsx
import { cn, formatCurrency, formatDate, truncate, getInitials } from '@/lib/utils'

// Merge CSS classes
cn('px-4', 'py-2', condition && 'bg-red-500')

// Formatar moeda
formatCurrency(1500) // R$ 1.500,00

// Formatar data
formatDate(new Date()) // 12 de maio de 2026

// Truncar texto
truncate('Texto muito longo...', 20) // Texto muito lo...

// Iniciais de nome
getInitials('João Silva') // JS
```

---

## 🎬 Próximo: Integrar Vídeos

Quando tiver os 3 vídeos Veo3:

1. **Coloque em** `public/videos/`
   ```
   public/
   └── videos/
       ├── hero-video-1.mp4 (Sala Maker - Robotics)
       ├── hero-video-2.mp4 (Professor - Programação)
       └── hero-video-3.mp4 (Diversidade - Maker)
   ```

2. **Integre ao hero** `src/app/page.tsx`
   ```tsx
   <video
     src="/videos/hero-video-1.mp4"
     autoPlay
     muted
     loop
     className="w-full h-96 object-cover rounded-lg"
   />
   ```

3. **Teste** em `http://localhost:3000`

---

## 📚 Documentação Completa

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Sistema de design, componentes, cores
- **[TYPOGRAPHY_GUIDE.md](./TYPOGRAPHY_GUIDE.md)** - Tipografia, fontes, escalas
- **[ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)** - Explicação da arquitetura
- **[VEO3_PROMPT_VIDEOS.md](./VEO3_PROMPT_VIDEOS.md)** - Prompts para vídeos
- **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** - Resumo do que foi feito
- **[README.md](./README.md)** - Documentação geral do projeto

---

## 🛠 Scripts Comuns

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local

# Build
npm run build           # Build para produção
npm start              # Roda build em produção

# Verificação
npm run lint           # Verifica linting
npm run type-check     # Verifica tipos TypeScript

# Formatação
npm run format         # Formata código
npm run format:check   # Verifica formatação
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- ❌ Nunca commite `.env.local`
- ❌ Nunca publique suas chaves Supabase/Stripe
- ✅ Use `.env.example` como referência
- ✅ Sempre valide dados do usuário
- ✅ Use Row Level Security no Supabase

---

## 📱 Responsividade

O projeto é mobile-first e responsivo:

```tsx
// Mobile: < 640px
// Tablet: 640px - 768px
// Desktop: > 768px

// Em Tailwind:
<div className="md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 coluna, Tablet: 2 colunas, Desktop: 3 colunas */}
</div>
```

---

## 🐛 Debugging

### VS Code + Next.js
Crie `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Supabase
Acesse o dashboard: https://app.supabase.com

---

## ❓ Dúvidas Comuns

### Como adicionar uma nova página?
```tsx
// src/app/contracts/page.tsx
export default function ContractsPage() {
  return <div>Contratos</div>
}
```
Acesse em: `http://localhost:3000/contracts`

### Como importar um componente?
```tsx
import Button from '@/components/ui/Button'
// Ou
import { Card, CardContent } from '@/components/ui/Card'
```

### Como usar uma imagem?
```tsx
import Image from 'next/image'

<Image
  src="/images/logo.svg"
  alt="Logo"
  width={40}
  height={40}
/>
```

### Como fazer uma query Supabase?
```tsx
const { data: contracts, error } = await supabase
  .from('contracts')
  .select('id, title, status')
  .order('created_at', { ascending: false })
```

---

## 🚀 Próximos Passos

1. ✅ Setup completo
2. ⏳ Gerar 3 vídeos Veo3
3. ⏳ Integrar vídeos ao hero
4. ⏳ Criar página de dashboard/contratos
5. ⏳ Implementar gestão de contratos
6. ⏳ Deploy em produção (Vercel)

---

## 💬 Precisa de Ajuda?

- Documentação: Ver links acima
- Código: Veja exemplos em `src/`
- GitHub Issues: Crie uma issue no repositório
- Contato: contato@wemake.tec.br

---

**Bem-vindo à We Make! "nós criamos" ✨**

Happy coding! 🎉
