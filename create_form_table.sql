-- Criar tabela form_precadastro_wemake para formulário de pré-cadastro de escolas
CREATE TABLE IF NOT EXISTS public.form_precadastro_wemake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seção 1: Responsável pelo Preenchimento
  resp_email VARCHAR(255) NOT NULL,

  -- Seção 2: Dados da Escola
  cnpj VARCHAR(20),
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  cep VARCHAR(10),
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  email_institucional VARCHAR(255) NOT NULL,

  -- Seção 3: Informações Acadêmicas
  seg_infantil BOOLEAN DEFAULT FALSE,
  seg_fundamental_1 BOOLEAN DEFAULT FALSE,
  seg_fundamental_2 BOOLEAN DEFAULT FALSE,
  seg_ensino_medio BOOLEAN DEFAULT FALSE,

  alunos_infantil INTEGER DEFAULT 0,
  alunos_fundamental_1 INTEGER DEFAULT 0,
  alunos_fundamental_2 INTEGER DEFAULT 0,
  alunos_ensino_medio INTEGER DEFAULT 0,

  data_inicio_letivo DATE,
  data_fim_letivo DATE,
  formato_ano_letivo VARCHAR(50),
  observacoes TEXT,

  -- Seção 4: Representante Legal
  legal_nome VARCHAR(255) NOT NULL,
  legal_cpf VARCHAR(20),
  legal_email VARCHAR(255) NOT NULL,
  legal_whatsapp VARCHAR(20),
  legal_rua VARCHAR(255) NOT NULL,
  legal_numero VARCHAR(20) NOT NULL,
  legal_complemento VARCHAR(100),
  legal_bairro VARCHAR(100) NOT NULL,
  legal_cidade VARCHAR(100) NOT NULL,
  legal_estado VARCHAR(2) NOT NULL,
  legal_cep VARCHAR(10),

  -- Seção 5: Financeiro
  fin_email_cobranca VARCHAR(255) NOT NULL,
  ticket_medio VARCHAR(50),

  -- Metadata
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX idx_form_precadastro_cnpj ON public.form_precadastro_wemake(cnpj);
CREATE INDEX idx_form_precadastro_email ON public.form_precadastro_wemake(email_institucional);
CREATE INDEX idx_form_precadastro_status ON public.form_precadastro_wemake(status);
CREATE INDEX idx_form_precadastro_created_at ON public.form_precadastro_wemake(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.form_precadastro_wemake ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção anônima (formulário público)
CREATE POLICY "Allow anonymous inserts on form_precadastro_wemake" ON public.form_precadastro_wemake
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir leitura apenas para usuários autenticados (admin/comercial)
CREATE POLICY "Allow authenticated users to read forms" ON public.form_precadastro_wemake
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_precadastro_updated_at BEFORE UPDATE ON public.form_precadastro_wemake
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mensagens de sucesso
SELECT 'Tabela form_precadastro_wemake criada com sucesso!' AS resultado;
SELECT 'Índices criados!' AS resultado;
SELECT 'RLS e políticas configuradas!' AS resultado;
