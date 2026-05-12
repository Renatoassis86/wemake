# Setup do Formulário We Make

## 1. Criar a Tabela no Supabase

### Via SQL (Recomendado)

Acesse o Supabase Console → SQL Editor e execute o script:

```sql
-- Criar tabela de pré-cadastro de escolas para We Make
CREATE TABLE IF NOT EXISTS public.form_precadastro_wemake (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  -- 1. Responsável pelo Preenchimento
  resp_email VARCHAR(255) NOT NULL,

  -- 2. Dados da Escola
  cnpj VARCHAR(18),
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  cep VARCHAR(9),
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  email_institucional VARCHAR(255) NOT NULL,

  -- 3. Informações Acadêmicas - Segmentos
  seg_infantil BOOLEAN DEFAULT FALSE,
  seg_fundamental_1 BOOLEAN DEFAULT FALSE,
  seg_fundamental_2 BOOLEAN DEFAULT FALSE,
  seg_ensino_medio BOOLEAN DEFAULT FALSE,

  -- 3. Quantidade de Alunos por Segmento
  alunos_infantil INTEGER DEFAULT 0,
  alunos_fundamental_1 INTEGER DEFAULT 0,
  alunos_fundamental_2 INTEGER DEFAULT 0,
  alunos_ensino_medio INTEGER DEFAULT 0,

  -- 3. Datas e Formato
  data_inicio_letivo DATE,
  data_fim_letivo DATE,
  formato_ano_letivo VARCHAR(50),
  observacoes TEXT,

  -- 4. Representante Legal
  legal_nome VARCHAR(255) NOT NULL,
  legal_cpf VARCHAR(14),
  legal_email VARCHAR(255) NOT NULL,
  legal_whatsapp VARCHAR(20),
  legal_rua VARCHAR(255) NOT NULL,
  legal_numero VARCHAR(10) NOT NULL,
  legal_complemento VARCHAR(100),
  legal_bairro VARCHAR(100) NOT NULL,
  legal_cidade VARCHAR(100) NOT NULL,
  legal_estado VARCHAR(2) NOT NULL,
  legal_cep VARCHAR(9),

  -- 5. Financeiro e Faturamento
  fin_email_cobranca VARCHAR(255) NOT NULL,
  ticket_medio VARCHAR(50),

  -- Status de processamento
  status VARCHAR(50) DEFAULT 'pendente',
  notas TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_form_precadastro_cnpj ON public.form_precadastro_wemake(cnpj);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_email ON public.form_precadastro_wemake(resp_email);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_status ON public.form_precadastro_wemake(status);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_created ON public.form_precadastro_wemake(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.form_precadastro_wemake ENABLE ROW LEVEL SECURITY;

-- Permitir insert de usuários anônimos (para o formulário público)
CREATE POLICY "Allow anonymous inserts" ON public.form_precadastro_wemake
  FOR INSERT WITH CHECK (TRUE);

-- Permitir que usuários autenticados leiam
CREATE POLICY "Users can read forms" ON public.form_precadastro_wemake
  FOR SELECT USING (TRUE);

GRANT INSERT ON public.form_precadastro_wemake TO anon;
GRANT SELECT, INSERT ON public.form_precadastro_wemake TO authenticated;
```

## 2. Estrutura do Formulário

### Seções do Formulário

#### 1. Responsável pelo Preenchimento
- E-mail (obrigatório)

#### 2. Dados da Escola
- CNPJ
- Razão Social (obrigatório)
- Nome Fantasia (obrigatório)
- Endereço: Rua, Número, Bairro, CEP
- Cidade (obrigatório), Estado (obrigatório)
- E-mail Institucional (obrigatório)

#### 3. Informações Acadêmicas
- Checkboxes para segmentos: Infantil, Fundamental 1, Fundamental 2, Ensino Médio
- Quantidade de alunos por segmento
- Previsão de Início do Ano Letivo 2027
- Previsão de Término do Ano Letivo 2027
- Formato do Ano Letivo (Bimestre/Trimestre/Semestral)
- Observações Adicionais

#### 4. Representante Legal
- Nome Completo (obrigatório)
- CPF
- E-mail (Assinatura) (obrigatório)
- WhatsApp (obrigatório)
- Endereço: Rua, Número, Complemento, Bairro, Cidade, Estado, CEP

#### 5. Financeiro e Faturamento
- E-mail (Cobrança e Envio de NF) (obrigatório)
- Valor do Ticket Médio da Escola

## 3. Funcionalidades Implementadas

✅ **Página de Formulário** (`src/app/formulario/page.tsx`)
- Design We Make com cores cyan (#5FE3D0) e blue (#4A7FDB)
- Logo We Make no topo
- Todos os 5 campos solicitados
- Campos com validação obrigatória
- Comportamento responsivo
- Focus states personalizados

✅ **Server Action** (`src/lib/actions.ts`)
- Função `enviarFormularioPublico` atualizada
- Salva dados na tabela `form_precadastro_wemake`
- Integração com tabela `escolas` do CRM
- Cria/atualiza escola automaticamente

✅ **Página de Confirmação** (`src/app/formulario/obrigado/page.tsx`)
- Mensagem de sucesso com design We Make
- Próximos passos explicados
- Contato de suporte

✅ **Branding We Make**
- Removidas todas referências a "Cidade Viva Education"
- Logo We Make em SVG
- Cores: Cyan primária, Blue secundária
- Tipografia: Cormorant (títulos), Inter (corpo)

## 4. Testando o Formulário

1. Inicie o servidor: `npm run dev`
2. Acesse `http://localhost:3000/formulario`
3. Preencha todos os campos obrigatórios
4. Clique em "Enviar Formulário"
5. Você será redirecionado para `/formulario/obrigado`

## 5. Verificando os Dados

No Supabase Console:
- Vá para **Table Editor**
- Procure por `form_precadastro_wemake`
- Você verá todos os formulários enviados

## 6. Próximas Etapas

- [ ] Criar dashboard para gerentes visualizarem os formulários
- [ ] Implementar envio de e-mail de confirmação (usando Resend)
- [ ] Criar fluxo de aprovação de pré-cadastros
- [ ] Adicionar integração com CRM de escolas
- [ ] Implementar notificações para equipe comercial

## 7. Campos Obrigatórios

Os campos marcados com `required` no código:

1. **Seção 1:**
   - resp_email

2. **Seção 2:**
   - cnpj (será validado)
   - razao_social
   - nome_fantasia
   - rua
   - numero
   - bairro
   - cep
   - cidade
   - estado
   - email_institucional

3. **Seção 3:**
   - data_inicio_letivo
   - data_fim_letivo
   - formato_ano_letivo

4. **Seção 4:**
   - legal_nome
   - legal_email
   - legal_whatsapp
   - legal_rua
   - legal_numero
   - legal_bairro
   - legal_cidade
   - legal_estado
   - legal_cep

5. **Seção 5:**
   - fin_email_cobranca

**Total: 25 campos obrigatórios**

## 8. Arquivo de Schema SQL

Um arquivo SQL completo está em: `supabase_formulario_schema.sql`

Execute esse arquivo no Supabase SQL Editor se preferir usar via arquivo.
