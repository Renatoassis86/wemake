# Implementação Completa — Gestão Comercial (2026-05-12)

## 📋 Resumo Executivo

Realizamos uma **auditoria completa** da plataforma e identificamos + corrigimos:
1. ✅ **Problemas RLS** — Deletions/Updates bloqueados
2. ✅ **Autocomplete em EscolaSelector** — Visual aprimorado
3. ✅ Documentação de fix para aplicação imediata

---

## 🔴 CRÍTICO: RLS Precisa Ser Aplicado AGORA

### Problemas Identificados

| Problema | Tabela | Impacto | Status |
|----------|--------|--------|--------|
| **DELETE policy faltando** | negociacoes | Não remove do pipeline | ❌ CRÍTICO |
| **DELETE restritivo** | escolas | Apenas gerente pode deletar | ⚠️ Muito restritivo |
| **UPDATE restritivo** | escolas, registros, tarefas | Consultores não podem editar | ⚠️ Afeta workflow |

### Como Fixar (2 minutos)

#### Passo 1: Abrir SQL Editor
https://supabase.com/dashboard/project/lyisdsnocroocxfblvqf/sql/new

#### Passo 2: Copiar e colar este SQL:

```sql
create or replace function is_supervisor()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select role in ('gerente','supervisor') from profiles where id = auth.uid()),
    false
  )
$$;

create or replace function can_view_all()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select role in ('gerente','supervisor','consultor') from profiles where id = auth.uid()),
    false
  )
$$;

-- FIX 1: Permitir supervisores deletarem escolas
drop policy if exists "Deletar escolas (apenas gerente)" on escolas;
create policy "Deletar escolas (apenas supervisor)" on escolas
for delete using (is_supervisor());

-- FIX 2: ADICIONAR DELETE POLICY PARA NEGOCIAÇÕES (estava faltando!)
drop policy if exists "Deletar negociações" on negociacoes;
create policy "Deletar negociações" on negociacoes
for delete using (
  is_supervisor() or responsavel_id = auth.uid() or created_by = auth.uid()
);

-- FIX 3: Atualizar UPDATE policies
drop policy if exists "Atualizar escolas" on escolas;
create policy "Atualizar escolas" on escolas
for update using (
  is_supervisor() or responsavel_id = auth.uid() or responsavel_id is null
);

drop policy if exists "Atualizar negociações" on negociacoes;
create policy "Atualizar negociações" on negociacoes
for update using (
  is_supervisor() or responsavel_id = auth.uid() or created_by = auth.uid()
);

drop policy if exists "Atualizar registros" on registros;
create policy "Atualizar registros" on registros
for update using (
  is_supervisor() or responsavel_id = auth.uid() or created_by = auth.uid()
);

drop policy if exists "Atualizar tarefas" on tarefas;
create policy "Atualizar tarefas" on tarefas
for update using (
  is_supervisor() or responsavel_id = auth.uid() or created_by = auth.uid()
);

-- DELETE policies
drop policy if exists "Deletar registros" on registros;
create policy "Deletar registros" on registros
for delete using (is_supervisor() or created_by = auth.uid());

drop policy if exists "Deletar tarefas" on tarefas;
create policy "Deletar tarefas" on tarefas
for delete using (is_supervisor() or created_by = auth.uid());

drop policy if exists "Deletar notas" on notas_escola;
create policy "Deletar notas" on notas_escola
for delete using (is_supervisor() or created_by = auth.uid());

drop policy if exists "Deletar contatos" on contatos_escola;
create policy "Deletar contatos" on contatos_escola
for delete using (is_supervisor() or created_by = auth.uid());

select 'RLS FIXADO ✅' as resultado;
```

#### Passo 3: Clique em **Run** (Ctrl+Enter)
Deve mostrar: `RLS FIXADO ✅`

#### Passo 4: Reinicie Next.js
```bash
npm run dev
```

#### Passo 5: Limpe a sessão
- Logout
- Login novamente

---

## ✅ Nova Feature: Autocomplete Melhorado

### O que mudou no EscolaSelector

#### Antes ❌
- Input com placeholder genérico
- Sem feedback visual ao digitar
- Contador oculto nas categorias

#### Depois ✅
- **Placeholder claro**: "Digite para buscar escola, cidade ou estado..."
- **Visual feedback**: Border azul ao digitar, shadow colorido
- **Contador visível**: Mostra quantas escolas encontradas
- **Empty state melhorado**: Mensagens diferentes para "nada encontrado" vs "digite para buscar"
- **Responsivo**: Funciona em todas as páginas que usam o componente

### Onde está disponível
- Jornada Visual (`/comercial/jornada-visual`)
- Jornada Relacional (`/comercial/jornada`)
- Pipeline (`/comercial/pipeline`)
- Contratos (`/contratos`)

### Como usar
1. Clique no campo "Selecionar Escola"
2. **Digite qualquer parte do nome, cidade ou estado**
3. Os resultados aparecem automaticamente filtrados
4. Clique em uma escola para selecionar

---

## 📁 Arquivos Criados/Modificados

### RLS Fixes
- `supabase/fix_rls_complete.sql` — SQL completo com todos os fixes
- `supabase/FIXES_RLS.md` — Documentação detalhada dos problemas
- `RLS_FIX_APLICAR_AGORA.md` — Quick start para aplicar os fixes

### Code Changes
- `src/components/ui/EscolaSelector.tsx` — Melhorias de UX

### Memory/Docs
- `memory/rls_authorization_architecture.md` — Análise completa da arquitetura RLS
- `memory/MEMORY.md` — Atualizado com referência ao RLS doc

---

## 🧪 Como Testar

Depois de aplicar o RLS fix, teste cada funcionalidade:

### 1. Deletar Escola
- [ ] Ir para `/comercial/escolas`
- [ ] Clicar em uma escola
- [ ] Clicar botão "Excluir Escola"
- [ ] ✅ Deve desaparecer da lista

### 2. Remover do Pipeline
- [ ] Ir para `/comercial/pipeline`
- [ ] Clicar o "X" em uma negociação
- [ ] ✅ Deve remover do pipeline

### 3. Editar Como Consultor
- [ ] Ir para `/comercial/escolas`
- [ ] Clicar "Editar" em uma escola atribuída a você
- [ ] ✅ Deve permitir editar todos os campos

### 4. Buscar com Autocomplete
- [ ] Abrir Jornada Visual (`/comercial/jornada-visual`)
- [ ] Clicar no campo "Selecionar Escola"
- [ ] Digitar "Colegio", "São Paulo", "PE", etc.
- [ ] ✅ Resultados aparecem em tempo real
- [ ] ✅ Mostra contador de resultados

---

## 📊 Status Geral

| Item | Status | Prioridade |
|------|--------|-----------|
| RLS Fixes | ⏳ Aguardando execução manual | 🔴 CRÍTICA |
| Autocomplete UX | ✅ Implementado | 🟢 Concluído |
| Build | ✅ Passing | 🟢 OK |
| Git | ✅ Commit 4fed5e3 | 🟢 Pushed |

---

## 🚀 Próximos Passos

1. **AGORA**: Abrir Supabase e executar o SQL do fix RLS
2. Reiniciar Next.js
3. Testar deletions/updates
4. Verificar autocomplete nas páginas
5. Se tudo OK, comunicar ao time que está 100% funcional

---

## 📞 Dúvidas?

Se algo não funcionar após aplicar o RLS:

1. Verifique se o SQL executou sem erros
2. Confirme seu role no banco:
   ```sql
   select id, email, role from profiles where email = 'seu-email@cidadeviva.org';
   ```
3. Limpe cache do browser (Ctrl+Shift+Delete)
4. Faça logout/login novamente

---

**Data**: 2026-05-12 23:45
**Versão**: comercial_nextjs v1.4
**Deploy**: gestaocomercial.arkosintelligence.com
