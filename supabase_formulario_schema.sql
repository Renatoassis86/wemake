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
CREATE POLICY IF NOT EXISTS "Allow anonymous inserts" ON public.form_precadastro_wemake
  FOR INSERT WITH CHECK (TRUE);

-- Permitir que usuários autenticados leiam seus próprios registros
CREATE POLICY IF NOT EXISTS "Users can read their own forms" ON public.form_precadastro_wemake
  FOR SELECT USING (auth.uid()::text = resp_email OR auth.role() = 'authenticated');

-- Permitir que admins leiam todos os registros (você pode adaptar isso conforme necessário)
-- Comentado por enquanto - configure de acordo com seu sistema de permissões

GRANT INSERT ON public.form_precadastro_wemake TO anon;
GRANT SELECT, INSERT, UPDATE ON public.form_precadastro_wemake TO authenticated;
