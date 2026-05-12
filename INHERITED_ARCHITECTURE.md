# 🏗️ Arquitetura Herdada - We Make Platform

## O Que Foi Herdado

A plataforma We Make foi construída herdando a **arquitetura completa de gestão comercial** do projeto original de referência, mantendo 100% da funcionalidade e apenas customizando a identidade visual para We Make.

---

## 📁 Estrutura Herdada

### **Dashboard** (`src/app/dashboard/`)
```
dashboard/
├── page.tsx                    # Dashboard principal (overview)
├── layout.tsx                  # Layout do dashboard
├── contratos/                  # Gestão de contratos
│   ├── page.tsx               # Listagem de contratos
│   ├── [id]/page.tsx          # Detalhes do contrato
│   └── novo/page.tsx          # Criar novo contrato
├── documentos/                 # Gestão de documentos
│   ├── page.tsx               # Listagem de documentos
│   ├── [id]/detalhe/page.tsx  # Detalhes do documento
│   ├── emitir/[id]/page.tsx   # Emissão de documentos
│   └── alunos/                # Documentos de alunos
├── assinaturas/               # Gestão de assinaturas
├── templates/                 # Templates de contratos
├── modulos/                   # Módulos de gestão
├── empresas/                  # Gestão de empresas
├── pessoas/                   # Gestão de pessoas/usuários
├── tipos-contrato/            # Tipos de contrato
├── usuarios/                  # Gestão de usuários
└── clm/                       # Contract Lifecycle Management
```

### **API Routes** (`src/app/api/`)
```
api/
├── documentos/                # Endpoints para documentos
│   ├── [id]/gerar/route.ts    # Gerar documento
│   ├── batch/[id]/route.ts    # Processamento em lote
│   └── bulk/route.ts          # Upload em massa
├── planilha/                  # Endpoints para planilhas
│   ├── modelo/route.ts        # Modelo de planilha
│   └── modelo/pessoas/route.ts # Modelo de pessoas
├── jobs/                      # Jobs/tarefas
│   └── alertas/route.ts       # Sistema de alertas
├── webhooks/                  # Webhooks para integrações
│   └── signature/[provider]/route.ts
├── health/route.ts            # Health check
└── (mais rotas de integração)
```

### **Autenticação** (`src/app/login/`)
```
login/
├── page.tsx                   # Página de login
└── login.module.css           # Estilos de login
```

### **Componentes** (`src/components/`)
```
components/
├── ui/                        # Componentes UI base (Button, Card, Input)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        # Menu lateral
│   │   └── CompanySwitcher.tsx # Seletor de empresa
│   ├── forms/
│   │   └── TemplateSelector.tsx # Seletor de templates
│   ├── templates/
│   │   └── TemplateActions.tsx # Ações de templates
│   ├── Footer.tsx             # Rodapé
│   ├── ScrollToTop.tsx        # Scroll para topo
│   └── (mais componentes)
└── (componentes customizados)
```

---

## 🔄 Fluxos Implementados

### **Gestão de Contratos**
```
Novo Contrato
    ↓
Preenchimento de Dados
    ↓
Seleção de Template
    ↓
Revisão
    ↓
Assinatura Digital
    ↓
Armazenamento
    ↓
Histórico & Relatórios
```

### **Gestão de Documentos**
```
Upload de Documentos
    ↓
Processamento (OCR, validação)
    ↓
Armazenamento em Supabase
    ↓
Emissão de Documentos Novos
    ↓
Rastreamento e Auditoria
```

### **Autenticação & Autorização**
```
Login (Supabase Auth)
    ↓
Verificação de Credenciais
    ↓
Geração de Sessão
    ↓
Row Level Security (RLS)
    ↓
Acesso ao Dashboard
```

---

## 💾 Database Schema (Supabase)

O projeto utiliza as seguintes tabelas principais:

- `users` - Usuários do sistema
- `companies` - Empresas/Escolas
- `contracts` - Contratos
- `documents` - Documentos
- `signatures` - Assinaturas digitais
- `templates` - Templates de contratos
- `modules` - Módulos do sistema
- `people` - Pessoas (alunos, professores, etc)
- `audit_logs` - Logs de auditoria
- `notifications` - Sistema de notificações
- `webhooks` - Integrações com webhooks

---

## 🔐 Segurança Implementada

### **Row Level Security (RLS)**
- Cada usuário vê apenas seus dados
- Políticas por role/função
- Validação em tempo de execução

### **Autenticação**
- Supabase Auth (JWT)
- Senhas criptografadas
- Session management

### **Validação**
- Validação de entrada em APIs
- Type checking com TypeScript
- CSRF protection

---

## 📡 Integrações

### **Supabase**
- Autenticação
- Database PostgreSQL
- Storage de arquivos
- Real-time subscriptions
- Row Level Security

### **Webhooks**
- Integrações externas
- Processamento de eventos
- Sincronização de dados

### **APIs Externas**
- Processamento de documentos
- Validação de dados
- Geradores de relatórios

---

## 🎨 Customizações para We Make

As seguintes customizações foram aplicadas mantendo 100% da funcionalidade:

### **Branding**
- ✅ Cores Cyan (#5FE3D0) + Blue (#4A7FDB)
- ✅ Tipografia Inter
- ✅ Logo We Make
- ✅ Tagline "nós criamos"

### **Texto & Contexto**
- ✅ Referências para educação tecnológica
- ✅ Linguagem voltada para escolas
- ✅ Contexto de maker spaces e STEM

### **Funcionalidades**
- ✅ Todas mantidas 100%
- ✅ Dashboard completo
- ✅ Gestão de contratos
- ✅ Assinaturas digitais
- ✅ Gestão de documentos

---

## 📊 Funcionalidades Disponíveis

### **Gestão de Contratos**
- ✅ Criar contratos
- ✅ Editar contratos
- ✅ Visualizar histórico
- ✅ Buscar e filtrar
- ✅ Exportar contratos
- ✅ Assinatura digital

### **Gestão de Documentos**
- ✅ Upload de documentos
- ✅ Emissão de documentos
- ✅ Armazenamento seguro
- ✅ Rastreamento de acesso
- ✅ Auditoria completa

### **Gestão de Pessoas**
- ✅ Cadastro de usuários
- ✅ Atribuição de roles
- ✅ Permissões por função
- ✅ Histórico de atividades

### **Templates**
- ✅ Criar templates
- ✅ Preencher templates
- ✅ Reutilizar templates
- ✅ Versioning de templates

### **Relatórios**
- ✅ Dashboards analíticos
- ✅ Exportação de dados
- ✅ Filtros e busca
- ✅ Gráficos e visualizações

---

## 🚀 Como Usar

### **Acessar Dashboard**
```
http://localhost:3000/dashboard
```

### **Login**
```
http://localhost:3000/login
```

### **Criar Contrato**
```
1. Ir para: Dashboard → Contratos
2. Clicar em "Novo Contrato"
3. Selecionar Template
4. Preencher Dados
5. Revisar
6. Assinar
7. Confirmar
```

### **Gerenciar Documentos**
```
1. Ir para: Dashboard → Documentos
2. Upload ou Emissão
3. Validar
4. Armazenar
5. Rastrear
```

---

## 🔧 Configuração Necessária

### **Variáveis de Ambiente**
```env
NEXT_PUBLIC_SUPABASE_URL=https://vpacgvqkrkzskrzpsydg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sb_publishable_...
```

### **Banco de Dados**
- Supabase já configurado
- Tabelas criadas
- RLS ativado
- Políticas aplicadas

### **Autenticação**
- Supabase Auth configurado
- Providers disponíveis
- Session management ativo

---

## 📈 Estrutura de Dados

### **User Model**
```typescript
interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'user' | 'viewer'
  company_id: string
  created_at: Date
  updated_at: Date
}
```

### **Contract Model**
```typescript
interface Contract {
  id: string
  title: string
  description: string
  template_id: string
  status: 'draft' | 'pending' | 'approved' | 'signed' | 'archived'
  created_by: string
  signed_at: Date
  created_at: Date
  updated_at: Date
}
```

### **Document Model**
```typescript
interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  company_id: string
  created_at: Date
}
```

---

## 🔗 Relacionamentos

```
Users (muitos) ─────→ Company (um)
  ↓
Contracts (muitos)
  ↓
Templates (um por contrato)
  ↓
Documents (muitos por contrato)
  ↓
Signatures (muitos por documento)
  ↓
Audit Logs (muitos)
```

---

## 🧪 Testes

A arquitetura está pronta para:
- ✅ Testes unitários (Vitest/Jest)
- ✅ Testes de integração (Cypress)
- ✅ Testes E2E
- ✅ Cobertura de código

---

## 📚 Documentação Técnica

- **API Documentation**: `/api/docs` (quando implementado)
- **Component Stories**: Storybook (quando implementado)
- **Database Schema**: Supabase dashboard
- **Type Definitions**: `src/types/index.ts`

---

## 🔄 Manutenção & Updates

### **Atualizações de Componentes**
A arquitetura permite atualizações sem quebra de compatibilidade:
- Adicione novos componentes em `src/components/`
- Estenda tipos em `src/types/`
- Crie novas rotas em `src/app/`

### **Mudanças de Schema**
- Use migrations do Supabase
- Mantenha RLS policies
- Valide em tempo de execução

---

## ✅ Checklist de Implementação

- [x] Dashboard estruturado
- [x] Autenticação implementada
- [x] API routes criadas
- [x] Componentes reutilizáveis
- [x] Supabase integrado
- [x] RLS configurado
- [x] Branding We Make aplicado
- [ ] Testes automatizados (próximo)
- [ ] Deploy em produção (próximo)

---

## 🎯 Próximos Passos

1. **Customizar styles/cores** dos componentes herdados para We Make
2. **Integrar vídeos** Veo3 na landing page
3. **Testar fluxos** completos de contratos
4. **Implementar testes** automatizados
5. **Deploy em Vercel** ou servidor próprio

---

## 📞 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Repository**: https://github.com/Renatoassis86/wemake.git

---

**A plataforma We Make agora possui toda a funcionalidade de gestão comercial, 100% compatível com a arquitetura original, apenas com branding atualizado!** ✨

*We Make - "nós criamos"*
