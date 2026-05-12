# Configuração de Variáveis de Ambiente no Vercel

## Problema
A aplicação retorna erro 500 no Vercel porque as variáveis de ambiente Supabase não estão configuradas.

## Solução - Configure no Vercel:

### Passo 1: Acesse o Vercel Dashboard
- URL: https://vercel.com/renatos-projects-a493f2df/wemake-romh/settings/environment-variables

### Passo 2: Adicione as Variáveis

1. **Clique em "Add New"**

2. **Adicione estas 2 variáveis:**

#### Variável 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://vpacgvqkrkzskrzpsydg.supabase.co`
- **Environments:** Production, Preview, Development

#### Variável 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIyNjAsImV4cCI6MjA5NDE2ODI2MH0.NNjL1i7XoQzUGYgelW4s6l0XW9d9UA_gX8ZcTkWphRU`
- **Environments:** Production, Preview, Development

### Passo 3: Redeploy
1. Clique em "Deployments"
2. Selecione o deploy atual (o que está falhando)
3. Clique em "Redeploy" (no menu ...)

### Passo 4: Aguarde
O Vercel fará um rebuild com as variáveis configuradas. Após alguns minutos, acesse:
- https://wemake-romh.vercel.app

## Credenciais Supabase

**Projeto:** vpacgvqkrkzskrzpsydg  
**URL:** https://vpacgvqkrkzskrzpsydg.supabase.co  
**User Admin:** renato086@gmail.com  
**Password:** admin123

## Se Continuar com Erro

1. Verifique se as variáveis foram salvas (reload a página)
2. Clique em "Redeploy" novamente
3. Aguarde 2-3 minutos para o build completar
4. Verifique os Logs do deployment (aba "Logs")
