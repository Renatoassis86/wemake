# Prompt para Agente Antigravity Hub de Plataformas Cidade Viva Education

## Contexto: Estado Atual do Projeto

O hub de plataformas da Cidade Viva Education foi criado e testado localmente com sucesso:

### ✅ Estrutura Implementada
- **Landing page central** (`src/components/hub/HubLanding.tsx`) com vídeo hero
- **3 módulos integrados**:
  - Gestão Comercial (ativo, rotas em `/dashboard`, `/comercial`)
  - Gestão de Pedidos (placeholder, rota `/hub/pedidos`)
  - Gestão de Contratos (placeholder, rota `/hub/contratos`)
- **Routes públicas/protegidas** configuradas em `src/proxy.ts`:
  - `/` (hub público)
  - `/hub/*` (hub subpáginas público)
  - `/login` (público)
  - `/comercial`, `/dashboard/*` (protegidos requerem auth)
- **Fluxo de autenticação**:
  - Usuário não autenticado vê hub clica em módulo redirecionado para `/login`
  - Usuário autenticado em `/login` redirecionado para `/` (hub)
  - Usuário autenticado acesso direto aos módulos

### 📱 Ambiente
- **Local**: http://localhost:3000 (dev server rodando com `npm run dev`)
- **Produção**: gestaocomercial.arkosintelligence.com
- **Stack**: Next.js 16 + React 19 + Supabase + TypeScript

---

## 🎯 PRÓXIMOS PASSOS Ordem de Prioridade

### 🔴 ALTA PRIORIDADE: Redesign Visual da Landing Page

**Objetivo**: Transformar o hub de um protótipo funcional em uma página profissional que reflita a identidade Cidade Viva Education.

#### 1.1 Análise de Cores e Identidade Visual
- **Tarefa**: Extrair a paleta de cores primária/secundária da logo Cidade Viva Education
  - Logo está em: `/public/images/` (procurar por `*education*`, `*logo*`)
  - Substituir cores genéricas atuais:
    - Âmbar (#d97706) → cor primária da logo
    - Azul (#0ea5e9) → cor secundária da logo
    - Verde (#16a34a) → cor terciária da logo
  - Manter tom escuro (#0f172a) como background
- **Onde aplicar**: `src/components/hub/HubLanding.tsx` (linhas com `background: 'linear-gradient'`, `color: '#...'`)

#### 1.2 Imagens Generativas (AI)
- **Tarefa**: Selecionar ou gerar 3 imagens via DALL-E/Midjourney que correspondam a:
  1. **Gestão Comercial**: Executivos em reunião, gráficos, negociação, parceria B2B
  2. **Gestão de Pedidos**: Logística, estoque, entrega, organização escolar
  3. **Gestão de Contratos**: Documentos, assinaturas digitais, conformidade, contrato
- **Estilo**: Deve seguir o padrão visual do site cidadeviva.education.org
  - Observar: paleta de cores, composição (profissional/corporativo), tom de imagem
  - Referência visual: acessar https://cidadeviva.education.org e analisar imagens usadas
- **Armazenamento**: Salvar em `/public/images/hub/` com nomes descritivos (`gestao-comercial.png`, `gestao-pedidos.png`, `gestao-contratos.png`)
- **Integração**: Atualizar `HubLanding.tsx` para importar e exibir essas imagens nos cards dos módulos

#### 1.3 Footer com Crédito Arkos
- **Tarefa**: Adicionar no final de `HubLanding.tsx`:
  - Texto: "Página criada pela Arkos Intelligence"
  - Link para: https://arkosintelligence.com (ou conforme definido)
  - Estilo: discreto, alinhado com design geral (small text, cor neutra)

#### 1.4 Validação Visual
- **Tarefa**: Após mudanças, testar localmente em:
  - Desktop (1920x1080, 1440x900)
  - Tablet (768px)
  - Mobile (375px)
  - Verificar responsiveness de cards, vídeo hero, tipografia

---

### 🟡 MÉDIA PRIORIDADE: Análise de Arquitetura para Gestão Unificada

**Objetivo**: Entender como Gestão de Contratos e Registro de Estoques estão estruturados para extrair padrões reutilizáveis na criação de uma página de gestão unificada.

#### 2.1 Benchmark Gestão de Contratos
- **Localização**: `/app_gestao_contratos` (pasta na raiz do projeto)
- **Análise necessária**:
  - Estrutura de rotas (App Router)
  - Layout de dashboard/tabelas
  - Componentes de CRUD (Create, Read, Update, Delete)
  - Queries ao banco de dados (Supabase RLS)
  - Padrão de autenticação e autorização
  - Paginação, filtros, busca
  - Modais, formulários, validação
- **Documentar**: Padrões reutilizáveis, componentes base, estrutura de pasta

#### 2.2 Benchmark Registro de Estoques
- **Localização**: `/app_registro_estoque` (pasta na raiz do projeto)
- **Análise necessária**:
  - Idem ao item 2.1
  - Diferenças em relação a Contratos (se houver)
  - Componentes específicos de inventário/estoque

#### 2.3 Proposta de Arquitetura Unificada
- **Saída esperada**: Um diagrama ou documento descrevendo:
  - Componentes base reutilizáveis
  - Estrutura de folder comum
  - Padrão de API/queries
  - Como integrar 3+ módulos em um dashboard único
- **Objetivo final**: Facilitar a integração rápida de novos módulos no hub

---

### 🟢 BAIXA PRIORIDADE: Integração do Módulo de Pedidos

**Objetivo**: Preparar a plataforma para receber e integrar o app de Pedidos quando fornecido pelo usuário.

#### 3.1 Estrutura do Placeholder
- Atualmente: `/hub/pedidos/page.tsx` é uma página simples com "Em Breve"
- Quando o app for fornecido:
  - Analisar estrutura
  - Integrá-la sob `/hub/pedidos/` ou `/pedidos/` (decidir path)
  - Manter consistência com autenticação e layout

#### 3.2 Testes Locais
- Validar fluxo completo:
  - Usuário não autenticado acessa `/` → vê hub → clica em Pedidos → redirecionado para login
  - Usuário autenticado acessa `/` → clica em Pedidos → acessa `/hub/pedidos/`
  - Validar dados, CRUD, filtros no novo módulo

---

## 📝 Arquivos Principais a Modificar

| Arquivo | Tarefa | Status |
|---------|--------|--------|
| `src/components/hub/HubLanding.tsx` | Atualizar cores, adicionar imagens, footer Arkos | 🔴 PRIORITÁRIO |
| `src/proxy.ts` | Revisar routes (sem mudanças esperadas) | ✅ OK |
| `src/app/page.tsx` | Sem mudanças esperadas | ✅ OK |
| `/public/images/hub/*` | Criar pasta e adicionar 3 imagens AI | 🔴 PRIORITÁRIO |
| `/app_gestao_contratos` | Análise de arquitetura | 🟡 ANÁLISE |
| `/app_registro_estoque` | Análise de arquitetura | 🟡 ANÁLISE |

---

## 🧪 Checklist de Validação Pós-Implementação

- [ ] Cores da logo Cidade Viva Education aplicadas corretamente no hub
- [ ] 3 imagens AI carregadas e exibidas nos cards dos módulos
- [ ] Footer com crédito "Página criada pela Arkos Intelligence" visível
- [ ] Responsividade testada em desktop, tablet, mobile
- [ ] Fluxo de autenticação funciona corretamente
- [ ] Vídeo hero (`institucional.mp4`) carrega e autoplay funciona
- [ ] Links para módulos funcionam e redirecionam corretamente
- [ ] Sem erros TypeScript ou console do navegador
- [ ] Performance: LCP < 2.5s, FID < 100ms (Lighthouse)
- [ ] Pronto para deploy em produção

---

## 🚀 Próximas Fases (Após Este Ciclo)

1. **Integração do App de Pedidos**: Quando o usuário fornecer a pasta `/app_gestao_pedidos`
2. **Dashboard Unificado**: Criar página de gestão que combine dados de todos os módulos
3. **Relatórios e Analytics**: Implementar visão consolidada de dados
4. **Mobile App**: Estender plataforma para PWA/App Mobile

---

## 📌 Observações Importantes

- **Ambiente de teste**: Tudo deve ser testado localmente (`localhost:3000`) ANTES de push para produção
- **Git workflow**: Não fazer commits diretos em `main`. Usar branch feature ou teste local apenas
- **Performance**: Stack atual é otimizado (Next.js 16 com Turbopack) manter builds rápidos
- **Segurança**: Supabase RLS está configurado respeitar policies ao modificar queries
- **Accessibilidade**: Adicionar `alt` text em imagens, manter contraste de cores (WCAG AA mínimo)

---

## 💬 Dúvidas ou Blockers?

Se encontrar qualquer impedimento:
1. Verifique a estrutura das pastas (`/app_gestao_contratos`, `/app_registro_estoque`)
2. Teste localmente antes de assumir erro
3. Revise `proxy.ts` se houver problemas de routing
4. Valide Supabase keys em `.env.local`

**Boa sorte! 🚀**
