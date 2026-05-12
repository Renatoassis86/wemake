#!/usr/bin/env python3
"""
Integração com Supabase para gerenciar o banco de dados da We Make
Credenciais configuradas para acesso completo
"""

import os
import sys
import json
from datetime import datetime
import requests

class SupabaseClient:
    def __init__(self):
        self.url = "https://vpacgvqkrkzskrzpsydg.supabase.co"
        self.anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIyNjAsImV4cCI6MjA5NDE2ODI2MH0.NNjL1i7XoQzUGYgelW4s6l0XW9d9UA_gX8ZcTkWphRU"
        self.service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU"
        self.headers_anon = {
            "apikey": self.anon_key,
            "Content-Type": "application/json"
        }
        self.headers_service = {
            "apikey": self.service_key,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.service_key}"
        }

    def execute_sql(self, sql: str) -> dict:
        """Executa SQL diretamente no Supabase (requer service role)"""
        endpoint = f"{self.url}/rest/v1/rpc/pg_query"

        # Usar query builder em vez de rpc
        print(f"⚠️  Para executar SQL, use o Supabase Dashboard ou migração de banco")
        return {"error": "Use POST com SQL direto"}

    def table(self, table_name: str):
        """Acessa uma tabela específica"""
        return TableClient(self, table_name)

    def query(self, sql: str):
        """Execute raw SQL (requer acesso via admin)"""
        endpoint = f"{self.url}/rest/v1/rpc/pg_query"
        # PostgreSQL RPC não está habilitado por padrão
        # Use o método insert/update/select normal
        pass


class TableClient:
    def __init__(self, client: SupabaseClient, table_name: str):
        self.client = client
        self.table_name = table_name
        self.url = f"{client.url}/rest/v1/{table_name}"

    def select(self, columns: str = "*"):
        """SELECT query"""
        self.query_params = f"select={columns}"
        return self

    def eq(self, column: str, value):
        """WHERE column = value"""
        if not hasattr(self, 'query_params'):
            self.query_params = "select=*"
        self.query_params += f"&{column}=eq.{value}"
        return self

    def order(self, column: str, desc: bool = False):
        """ORDER BY"""
        direction = "desc" if desc else "asc"
        if not hasattr(self, 'query_params'):
            self.query_params = "select=*"
        self.query_params += f"&order={column}.{direction}"
        return self

    def limit(self, count: int):
        """LIMIT"""
        if not hasattr(self, 'query_params'):
            self.query_params = "select=*"
        self.query_params += f"&limit={count}"
        return self

    def execute(self):
        """Execute a SELECT query"""
        url = f"{self.url}?{self.query_params}"
        response = requests.get(url, headers=self.client.headers_service)
        return response.json() if response.status_code == 200 else {"error": response.text}

    def insert(self, data: dict):
        """INSERT new record"""
        response = requests.post(self.url, json=data, headers=self.client.headers_service)
        return {
            "success": response.status_code in [200, 201],
            "data": response.json() if response.status_code in [200, 201] else None,
            "error": response.text if response.status_code not in [200, 201] else None
        }

    def count(self):
        """Count records"""
        response = requests.head(f"{self.url}?select=id", headers=self.client.headers_service)
        try:
            return int(response.headers.get('content-range', '0').split('/')[-1])
        except:
            return 0


def create_form_table():
    """Cria a tabela form_precadastro_wemake"""
    print("📋 Para criar a tabela, execute o SQL no Supabase Dashboard:")
    print("\n" + "="*80)

    sql = """
-- Criar tabela form_precadastro_wemake
CREATE TABLE IF NOT EXISTS public.form_precadastro_wemake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seção 1: Responsável
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

  -- Seção 3: Acadêmica
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_form_precadastro_cnpj ON public.form_precadastro_wemake(cnpj);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_email ON public.form_precadastro_wemake(email_institucional);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_status ON public.form_precadastro_wemake(status);
CREATE INDEX IF NOT EXISTS idx_form_precadastro_created_at ON public.form_precadastro_wemake(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.form_precadastro_wemake ENABLE ROW LEVEL SECURITY;

-- Política para inserção anônima
CREATE POLICY "Allow anonymous inserts on form_precadastro_wemake" ON public.form_precadastro_wemake
  FOR INSERT
  WITH CHECK (true);

-- Política para leitura autenticada
CREATE POLICY "Allow authenticated users to read forms" ON public.form_precadastro_wemake
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_form_precadastro_updated_at ON public.form_precadastro_wemake;
CREATE TRIGGER update_form_precadastro_updated_at BEFORE UPDATE ON public.form_precadastro_wemake
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

    print(sql)
    print("="*80)
    print("\n✅ Passos:")
    print("1. Copie o SQL acima")
    print("2. Abra: https://vpacgvqkrkzskrzpsydg.supabase.co/project/default/sql/new")
    print("3. Cole e execute")
    print("4. Execute 'python supabase_integration.py --verify' para confirmar")


def verify_table():
    """Verifica se a tabela existe e lista registros"""
    client = SupabaseClient()

    print("\n🔍 Verificando tabela form_precadastro_wemake...")

    try:
        response = client.table('form_precadastro_wemake').select('id').limit(1).execute()

        if isinstance(response, list):
            print("✅ Tabela existe!")

            # Contar registros
            count = client.table('form_precadastro_wemake').select('id').execute()
            total = len(count) if isinstance(count, list) else 0
            print(f"📊 Total de registros: {total}")

            # Últimos 5 registros
            if total > 0:
                print("\n📋 Últimos 5 envios:")
                recent = client.table('form_precadastro_wemake').select('nome_fantasia,email_institucional,created_at,status').order('created_at', desc=True).limit(5).execute()

                for i, row in enumerate(recent, 1):
                    created = row.get('created_at', 'N/A')[:10] if row.get('created_at') else 'N/A'
                    nome = row.get('nome_fantasia', 'N/A')[:35]
                    email = row.get('email_institucional', 'N/A')[:35]
                    status = row.get('status', 'N/A')
                    print(f"  {i}. {nome:35} | {email:35} | {created} | {status}")
        else:
            print(f"❌ Erro: {response}")
    except Exception as e:
        print(f"❌ Erro ao acessar tabela: {e}")


def list_forms(limit: int = 10):
    """Lista formulários enviados"""
    client = SupabaseClient()

    print(f"\n📋 Últimos {limit} formulários:\n")

    try:
        forms = client.table('form_precadastro_wemake').select('*').order('created_at', desc=True).limit(limit).execute()

        if isinstance(forms, list):
            for i, form in enumerate(forms, 1):
                print(f"  {i}. {form.get('nome_fantasia')} ({form.get('cidade')})")
                print(f"     CNPJ: {form.get('cnpj')} | Email: {form.get('email_institucional')}")
                print(f"     Alunos: Infantil({form.get('alunos_infantil')}) Fund1({form.get('alunos_fundamental_1')}) Fund2({form.get('alunos_fundamental_2')}) Médio({form.get('alunos_ensino_medio')})")
                print(f"     Status: {form.get('status')} | Data: {form.get('created_at')[:10]}")
                print()
        else:
            print(f"❌ Erro: {forms}")
    except Exception as e:
        print(f"❌ Erro: {e}")


def insert_test_form():
    """Insere um formulário de teste"""
    client = SupabaseClient()

    test_data = {
        "resp_email": "teste@escola.org",
        "cnpj": "12.345.678/0001-90",
        "razao_social": "Escola Teste LTDA",
        "nome_fantasia": "Escola Teste We Make",
        "rua": "Rua Teste",
        "numero": "123",
        "bairro": "Bairro Teste",
        "cep": "01234-567",
        "cidade": "São Paulo",
        "estado": "SP",
        "email_institucional": "contato@escolateste.org",
        "seg_infantil": True,
        "seg_fundamental_1": True,
        "alunos_infantil": 50,
        "alunos_fundamental_1": 80,
        "data_inicio_letivo": "2025-02-01",
        "data_fim_letivo": "2025-12-20",
        "formato_ano_letivo": "Semestral",
        "observacoes": "Teste de integração Python",
        "legal_nome": "João Silva",
        "legal_cpf": "123.456.789-00",
        "legal_email": "joao@escolateste.org",
        "legal_whatsapp": "(11) 99999-9999",
        "legal_rua": "Rua Teste",
        "legal_numero": "123",
        "legal_bairro": "Bairro Teste",
        "legal_cidade": "São Paulo",
        "legal_estado": "SP",
        "legal_cep": "01234-567",
        "fin_email_cobranca": "financeiro@escolateste.org",
        "ticket_medio": "R$ 5.000,00",
        "status": "pendente"
    }

    print("📝 Inserindo formulário de teste...")
    result = client.table('form_precadastro_wemake').insert(test_data)

    if result['success']:
        print("✅ Formulário inserido com sucesso!")
        print(f"   ID: {result['data'][0]['id'] if result['data'] else 'N/A'}")
    else:
        print(f"❌ Erro: {result['error']}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "--create":
            create_form_table()
        elif command == "--verify":
            verify_table()
        elif command == "--list":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            list_forms(limit)
        elif command == "--test":
            insert_test_form()
        else:
            print(f"❌ Comando desconhecido: {command}")
    else:
        print("🚀 Integração Supabase - We Make")
        print("\nUsos:")
        print("  python supabase_integration.py --create    # Exibe SQL para criar tabela")
        print("  python supabase_integration.py --verify    # Verifica se tabela existe")
        print("  python supabase_integration.py --list [n]  # Lista últimos N formulários")
        print("  python supabase_integration.py --test      # Insere formulário de teste")
