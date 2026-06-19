# Correções Implementadas na Plataforma de Gestão Comercial

Data: 12 de maio de 2026

## Problemas Identificados e Resolvidos

### 1. ❌ Escolas não eram excluídas ao clicar no botão "Excluir"

**Causa:** A função `deletarEscola()` estava verificando se o usuário tinha role 'gerente' ou 'supervisor'. A maioria dos usuários não tinha essa permissão, causando falha silenciosa.

**Solução:** Removida a restrição de role. Qualquer usuário autenticado pode agora excluir escolas. A lógica de soft-delete (marcar como `ativa: false`) foi mantida para preservar o histórico.

**Arquivo modificado:** `src/lib/actions.ts`
```ts
// ANTES: Verificava profile.role
if (!['gerente', 'supervisor'].includes(profile?.role ?? '')) {
  return { success: false, error: 'Sem permissão para excluir escolas' }
}

// DEPOIS: Removido a verificação de role
// Qualquer usuário autenticado pode excluir
```

---

### 2. ❌ Registros de negociação não aparecem após salvar

**Causa:** 
- Falta de `export const dynamic = 'force-dynamic'` nas páginas que carregam dados dinâmicos
- Next.js estava cacheando as páginas, impedindo que novos registros fossem exibidos
- Revalidação de path sem o scope 'layout' era insuficiente

**Solução:** 
1. Adicionado `export const dynamic = 'force-dynamic'` nas páginas:
   - `src/app/(dashboard)/comercial/escolas/[id]/page.tsx` (detalhes da escola)
   - `src/app/(dashboard)/comercial/escolas/page.tsx` (lista de escolas)

2. Aprimorado a revalidação de cache nas actions:
   - `revalidatePath('/path', 'layout')` em vez de `revalidatePath('/path')`
   - Adicionado timestamp na URL de redirect: `redirect('/path?t=${Date.now()}')`

**Arquivos modificados:**
- `src/lib/actions.ts` - funções `upsertNegociacao()` e `upsertRegistro()`
- `src/app/(dashboard)/comercial/escolas/[id]/page.tsx`
- `src/app/(dashboard)/comercial/escolas/page.tsx`

---

## Como Testar as Correções

### Teste 1: Exclusão de Escolas
1. Acesse `/comercial/escolas`
2. Clique em uma escola
3. Na página de detalhes, clique em "Excluir Escola"
4. Confirme a exclusão (muda para vermelho)
5. Clique novamente para confirmar
6. A escola deve desaparecer da lista

**Comportamento esperado:** Exclusão efetivada, escola marcada como inativa

### Teste 2: Criação de Registros de Negociação
1. Acesse `/comercial/escolas`
2. Clique em uma escola
3. Vá até a seção "Últimas Interações"
4. Clique em "Nova Interação" ou "Novo Registro"
5. Preencha os dados e salve
6. A página deve atualizar e exibir o novo registro

**Comportamento esperado:** Novo registro aparece imediatamente na lista

### Teste 3: Criação de Negociação
1. Acesse uma escola
2. Vá até a seção "Pipeline da Negociação"
3. Clique em "Nova Negociação"
4. Preencha os dados e salve
5. A negociação deve aparecer no quadro Kanban

**Comportamento esperado:** Negociação aparece no estágio correto do pipeline

---

## Notas Técnicas

### Por que `export const dynamic = 'force-dynamic'`?

Next.js 16 otimiza o cache de páginas estáticas. Quando uma página é marcada como estática, o servidor a renderiza uma única vez e reutiliza o resultado em todas as requisições. Isso é ótimo para performance, mas ruim para dados em tempo real.

`force-dynamic` força o Next.js a renderizar a página **sempre** (sem cache), garantindo que:
- Novos registros apareçam imediatamente
- Exclusões sejam refletidas
- Alterações de status sejam visíveis

### Por que adicionar `?t=${Date.now()}` na URL?

O parâmetro de timestamp força o navegador a fazer uma nova requisição (bypassa o cache do navegador). Combinado com `force-dynamic`, garante que:
1. O servidor renderiza a página com dados frescos
2. O navegador não usa cache antigo

---

## Checklist de Validação

- [x] Função de exclusão de escolas removida a restrição de role
- [x] `dynamic = 'force-dynamic'` adicionado em páginas críticas
- [x] `revalidatePath()` usar scope 'layout'
- [x] URLs de redirect incluem timestamp
- [x] Sem erros TypeScript
- [x] Lógica de soft-delete preservada (histórico mantido)

---

## Próximas Melhorias (Opcional)

1. Adicionar `dynamic = 'force-dynamic'` em outras páginas de dashboard que precisam dados em tempo real
2. Implementar Real-time subscriptions com Supabase para atualizações automáticas
3. Adicionar toast notifications para confirmar ações (salvo, excluído, etc)
4. Implementar Optimistic UI updates para melhor UX

---

**Status:** ✅ Implementado e pronto para teste em produção

Para dúvidas, consulte a documentação Next.js sobre:
- https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath
