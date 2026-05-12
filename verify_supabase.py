#!/usr/bin/env python3
"""Verifica e cria tabela form_precadastro_wemake no Supabase"""

import os
import sys
from supabase import create_client, Client

# Configuração - usando as credenciais do .env.local
SUPABASE_URL = 'https://vpacgvqkrkzskrzpsydg.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIyNjAsImV4cCI6MjA5NDE2ODI2MH0.NNjL1i7XoQzUGYgelW4s6l0XW9d9UA_gX8ZcTkWphRU'

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✓ Conectado ao Supabase")
except Exception as e:
    print(f"✗ Erro ao conectar: {e}")
    sys.exit(1)

print("\n🔍 Verificando tabela form_precadastro_wemake...")

# Tentar verificar a tabela
try:
    response = supabase.table('form_precadastro_wemake').select('*').limit(1).execute()
    print(f"✓ Tabela existe! Total de colunas: {len(response.data[0]) if response.data else 0}")
    if response.data:
        keys = list(response.data[0].keys())
        print(f"  Colunas: {', '.join(keys[:5])}...")
except Exception as e:
    print(f"✗ Erro ao acessar tabela: {e}")
    sys.exit(1)

# Listar últimos registros
print("\n📋 Últimos 5 registros enviados:")
try:
    response = supabase.table('form_precadastro_wemake').select('nome_fantasia, email_institucional, created_at, status').order('created_at', desc=True).limit(5).execute()
    if response.data:
        for i, row in enumerate(response.data, 1):
            created = row.get('created_at', 'N/A')[:10] if row.get('created_at') else 'N/A'
            print(f"  {i}. {row.get('nome_fantasia', 'N/A')[:30]} | {row.get('email_institucional', 'N/A')[:30]} | {created} | {row.get('status', 'N/A')}")
    else:
        print("  Nenhum registro encontrado")
except Exception as e:
    print(f"✗ Erro ao listar: {e}")

print("\n✓ Verificação concluída!")
