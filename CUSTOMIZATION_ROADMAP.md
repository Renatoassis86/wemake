# Roadmap de Customização: Education → We Make

## Objetivo
Transformar a plataforma Cidade Viva Education em We Make, mantendo **toda a arquitetura, engenharia de dados e funcionalidades intactas**. Apenas customizar branding, cores, textos e logos.

---

## FASE 1: Assets & Branding (Hoje)

### 1.1 Logos e Imagens ✅
- [x] Logo We Make SVG copiado para `/public/logo-we-make.svg`
- [x] Imagens identidade copiadas para `/public/images/we-make-*.png`
- [x] Arkos symbol disponível em `/public/images/arkos-logo.svg`
- [x] Vídeos já disponíveis: `hero.mp4`, `hero2.mp4`, `bg.mp4`, `bg2.mp4`, `bg3.mp4`, `institucional.mp4`

### 1.2 Cores We Make (Usar consistentemente)
```
Cyan (Primária):  #5FE3D0
Blue (Secundária): #4A7FDB
Purple (Accent):  #7C3AED
Dark BG:          #0f172a
```

---

## FASE 2: Layout & Páginas Principais

### 2.1 Home Page (src/components/hub/HubLanding.tsx) - EM ANDAMENTO
- [ ] Remover ALL mencões a "Cidade Viva Education"
- [ ] Atualizar logo header para We Make
- [ ] Atualizar cores: Orange (#d97706) → Cyan (#5FE3D0)
- [ ] Atualizar hero title: "Cidade Viva Education" → "We Make"
- [ ] Atualizar módulos (3 módulos esperados)
- [ ] Atualizar footer com branding We Make e Arkos
- [ ] Teste: Página deve carregar com branding completo

### 2.2 Login Page (src/app/(auth)/login/page.tsx)
- [ ] Remover todas as referências Education
- [ ] Atualizar logo
- [ ] Atualizar cores (Orange → Cyan/Blue)
- [ ] Atualizar textos: "Equipe Cidade Viva" → "Equipe We Make"
- [ ] Manter estrutura: hero + login card + footer

### 2.3 Layout Raiz (src/app/layout.tsx)
- [ ] Atualizar metadata: title, description
- [ ] Atualizar favicon se necessário
- [ ] Verificar CSS globals para remover estilos Education

---

## FASE 3: Componentes Reutilizáveis

### 3.1 Header/Navbar
- [ ] Atualizar em todos os componentes que usam logo Education
- [ ] Substituir por We Make com cores cyan/blue
- [ ] Manter estrutura de navegação

### 3.2 Footer
- [ ] Atualizar logo (We Make + Arkos symbol)
- [ ] Atualizar contatos e links
- [ ] Manter estrutura de seções

### 3.3 Buttons & CTAs
- [ ] Atualizar gradient: Orange → Cyan/Blue
- [ ] Manter espaçamento e interações
- [ ] Verificar todos os hover states

---

## FASE 4: Dashboard & Páginas Autenticadas

### 4.1 Sidebar (src/components/layout/Sidebar.tsx)
- [ ] Logo no topo → We Make
- [ ] Cores do menu → Cyan/Blue highlights
- [ ] Manter estrutura e navegação

### 4.2 Dashboard Principal (src/app/(dashboard)/page.tsx)
- [ ] Atualizar hero section
- [ ] Manter todos os gráficos e dados
- [ ] Atualizar cores dos cards

### 4.3 Páginas de Gestão
- [ ] Gestão de Escolas
- [ ] Registros de Interações  
- [ ] Pipeline Kanban
- [ ] Jornada do Relacionamento
- [ ] Manter estrutura, atualizar cores/textos

---

## FASE 5: Integração & QA

### 5.1 Verificação de Integrações
- [ ] Supabase connection (sem mudanças)
- [ ] API routes (sem mudanças)
- [ ] Authentication (sem mudanças)
- [ ] Database queries (sem mudanças)

### 5.2 Testes de Funcionalidade
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Dados aparecem corretamente
- [ ] Interações funcionam (cliques, filtros, etc)

### 5.3 Responsive Design
- [ ] Desktop
- [ ] Tablet
- [ ] Mobile

---

## Arquivos Críticos (NÃO MEXER)

```
✋ PROTEGIDO:
- src/lib/supabase/ (conexão database)
- src/lib/actions.ts (server actions)
- src/app/api/ (API routes)
- src/types/ (type definitions)
- src/hooks/ (custom hooks)
- package.json (dependências críticas)
- next.config.ts (config Next.js)
- tsconfig.json (TypeScript config)
```

---

## Checklist de Customização

### Textos para Substituir
- [ ] "Cidade Viva Education" → "We Make"
- [ ] "CVE" → "We Make"
- [ ] "escolas parceiras da Cidade Viva" → "escolas parceiras"
- [ ] Email: "comercial.education@..." → "comercial@wemake.org"
- [ ] Telefone: Atualizar para número We Make
- [ ] Instagram: "@cidadeviva.education" → "@wemakebr"

### Cores para Substituir
- [ ] #d97706 (Orange) → #5FE3D0 (Cyan)
- [ ] #f59e0b (Amber) → #5FE3D0 ou #4A7FDB
- [ ] #b45309 (Dark Orange) → #4A7FDB (Blue)
- [ ] Background overlays: Usar Dark (#0f172a)

### Imagens para Substituir
- [ ] /images/logo-education.png → /logo-we-make.svg
- [ ] Video backgrounds: Usar hero.mp4, hero2.mp4, bg.mp4
- [ ] Icons: Manter Lucide React (sem mudanças)

---

## Ordem Recomendada

1. **Homepage** (HubLanding) - HOJE
2. **Login Page** - Próximo
3. **Layout & Global** - Depois
4. **Header/Footer Components** - Então
5. **Dashboard Pages** - Depois
6. **Admin/Settings** - Último
7. **QA & Testes** - Final

---

## Dicas de Implementação

✅ **Buscar & Substituir Sistemático**
- Abrir projeto em VS Code
- Ctrl+H: Find & Replace
- Substituir "Cidade Viva Education" globalmente
- Substituir cores hex globalmente

✅ **Manter Commits Pequenos**
- 1 commit por página/componente
- Mensagem: "Customize [Page] for We Make branding"
- Fácil de revisar e reverter se necessário

✅ **Verificar Após Cada Mudança**
- Recarregar página no navegador
- Verificar se layout/cores estão corretos
- Não quebrar funcionalidades

✅ **Usar Variables CSS**
- Considerar criar CSS variables para cores
- Fazer future-proofing para mudanças rápidas

---

## Status Atual

```
⏳ HOMEPAGE: Em progresso (HubLanding customizado)
⏳ LOGIN: Pronto para customização
⏳ LAYOUT: Aguardando início
⏳ COMPONENTS: Aguardando início
⏳ DASHBOARD: Aguardando início
⏳ QA: Aguardando início
```

