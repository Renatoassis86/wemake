#!/usr/bin/env python3
"""
Script para criar a tabela de usuários no Supabase
"""

import requests

class ExecutadorSQL:
    def __init__(self):
        self.url = "https://vpacgvqkrkzskrzpsydg.supabase.co"
        self.service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU"

    def executar_sql_admin(self, sql):
        """Executa SQL usando a API do Supabase"""

        print("╔════════════════════════════════════════════════════════════════╗")
        print("║          📋 CRIANDO TABELA DE USUÁRIOS NO SUPABASE             ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()

        # O Supabase não tem um endpoint REST para executar SQL arbitrário
        # Você precisa executar no Dashboard do Supabase

        print("⚠️  IMPORTANTE:")
        print("─" * 70)
        print()
        print("O SQL precisa ser executado manualmente no Dashboard do Supabase.")
        print("Siga estes passos:")
        print()
        print("1. Acesse: https://app.supabase.com")
        print("2. Selecione o projeto 'vpacgvqkrkzskrzpsydg'")
        print("3. Vá para 'SQL Editor'")
        print("4. Clique em 'New Query'")
        print("5. Cole todo o SQL do arquivo 'criar_tabela_usuarios.sql'")
        print("6. Clique em 'Run'")
        print()
        print("─" * 70)
        print()

        # Ler o SQL do arquivo
        try:
            with open('criar_tabela_usuarios.sql', 'r', encoding='utf-8') as f:
                sql_content = f.read()

            print("📄 SQL a executar:")
            print("─" * 70)
            print(sql_content[:500] + "..." if len(sql_content) > 500 else sql_content)
            print("─" * 70)
            print()

            # Salvar em arquivo de texto para copiar facilmente
            with open('SQL_PARA_EXECUTAR.txt', 'w', encoding='utf-8') as f:
                f.write(sql_content)

            print("✅ SQL salvo em: SQL_PARA_EXECUTAR.txt")
            print()
            print("Você pode:")
            print("  1. Copiar o conteúdo do arquivo e colar no SQL Editor")
            print("  2. Ou executar via CLI do Supabase")
            print()

        except FileNotFoundError:
            print("❌ Arquivo 'criar_tabela_usuarios.sql' não encontrado!")
            return False

        return True

    def verificar_tabela_usuarios(self):
        """Verifica se a tabela foi criada"""

        print()
        print("🔍 Verificando tabela...")
        print("─" * 70)

        headers = {
            "apikey": self.service_key,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.service_key}"
        }

        table_url = f"{self.url}/rest/v1/usuarios?select=*&limit=1"
        response = requests.get(table_url, headers=headers)

        if response.status_code == 200:
            print("✅ Tabela 'usuarios' foi criada com sucesso!")
            return True
        else:
            print("⏳ Tabela ainda não foi criada. Execute o SQL no Dashboard.")
            return False

if __name__ == "__main__":
    executor = ExecutadorSQL()
    executor.executar_sql_admin("")

    print()
    print("=" * 70)
    print("PRÓXIMOS PASSOS:")
    print("=" * 70)
    print()
    print("1️⃣  Execute o SQL no Dashboard do Supabase")
    print("2️⃣  Volte aqui e execute: python verificar_tabela_usuarios.py")
    print("3️⃣  Pronto! A tabela de usuários estará criada")
    print()
