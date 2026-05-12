#!/usr/bin/env python3
"""
Script para verificar se a tabela de usuários foi criada no Supabase
"""

import requests

class VerificadorTabela:
    def __init__(self):
        self.url = "https://vpacgvqkrkzskrzpsydg.supabase.co"
        self.service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU"
        self.headers = {
            "apikey": self.service_key,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.service_key}"
        }

    def verificar_tabela_usuarios(self):
        """Verifica se a tabela usuarios existe"""

        print("╔════════════════════════════════════════════════════════════════╗")
        print("║        🔍 VERIFICANDO TABELA DE USUÁRIOS NO SUPABASE           ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()

        table_url = f"{self.url}/rest/v1/usuarios?select=*&limit=1"

        print(f"Tentando acessar: {table_url}")
        print()

        response = requests.get(table_url, headers=self.headers)

        print(f"Status Code: {response.status_code}")
        print()

        if response.status_code == 200:
            print("✅ TABELA 'usuarios' EXISTE!")
            print()

            try:
                dados = response.json()
                print(f"Registros na tabela: {len(dados)}")
                print()

                if dados:
                    print("📋 Dados encontrados:")
                    for idx, usuario in enumerate(dados, 1):
                        print(f"\n  Usuário {idx}:")
                        print(f"    ID: {usuario.get('id', 'N/A')}")
                        print(f"    Email: {usuario.get('email', 'N/A')}")
                        print(f"    Nome: {usuario.get('nome_completo', 'N/A')}")
                        print(f"    Role: {usuario.get('role', 'N/A')}")
                        print(f"    Ativo: {usuario.get('ativo', 'N/A')}")
                else:
                    print("A tabela existe mas está vazia")

            except Exception as e:
                print(f"Erro ao processar dados: {e}")

            return True

        elif response.status_code == 404:
            print("❌ TABELA 'usuarios' NÃO EXISTE")
            print()
            print("Erro:", response.json().get('message', 'Tabela não encontrada'))
            return False

        else:
            print(f"❌ ERRO: Status {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

    def verificar_usuario_renato(self):
        """Verifica se o usuário Renato existe"""

        print()
        print("─" * 70)
        print("🔍 Verificando usuário Renato...")
        print("─" * 70)
        print()

        table_url = f"{self.url}/rest/v1/usuarios?email=eq.renato086@gmail.com&select=*"

        response = requests.get(table_url, headers=self.headers)

        if response.status_code == 200:
            dados = response.json()

            if dados:
                usuario = dados[0]
                print("✅ USUÁRIO RENATO ENCONTRADO!")
                print()
                print(f"  ID: {usuario.get('id', 'N/A')}")
                print(f"  Email: {usuario.get('email', 'N/A')}")
                print(f"  Nome Completo: {usuario.get('nome_completo', 'N/A')}")
                print(f"  Role: {usuario.get('role', 'N/A')}")
                print(f"  Ativo: {usuario.get('ativo', 'N/A')}")
                print(f"  Data de Criação: {usuario.get('created_at', 'N/A')}")
                print()

                if usuario.get('role') == 'admin':
                    print("  ✅ Usuário é ADMIN")
                else:
                    print("  ⚠️ Usuário NÃO é admin")

                return True
            else:
                print("❌ USUÁRIO RENATO NÃO ENCONTRADO NA TABELA")
                print()
                print("Possíveis causas:")
                print("  1. A tabela 'usuarios' ainda não foi criada")
                print("  2. O usuário não foi inserido na tabela")
                print()
                return False
        else:
            print(f"❌ Erro ao buscar usuário: {response.status_code}")
            return False

    def gerar_relatorio(self):
        """Gera um relatório completo"""

        print()
        print("=" * 70)
        print("📊 RELATÓRIO FINAL")
        print("=" * 70)
        print()

        tabela_existe = self.verificar_tabela_usuarios()

        if tabela_existe:
            usuario_existe = self.verificar_usuario_renato()

            print()
            print("=" * 70)
            print("✅ STATUS FINAL")
            print("=" * 70)
            print()
            print("✅ Tabela 'usuarios' criada com sucesso")
            print("✅ Banco de dados pronto para uso")
            print()

            if usuario_existe:
                print("✅ Usuário Renato pronto para fazer login")
                print()
                print("🔑 Credenciais de Acesso:")
                print("  Email: renato086@gmail.com")
                print("  Senha: admin123")
                print()
                print("🚀 Próximos passos:")
                print("  1. Acesse http://localhost:3000/auth/login")
                print("  2. Faça login com as credenciais acima")
                print("  3. Comece a usar a plataforma!")
            else:
                print("⚠️ Usuário Renato ainda não está na tabela")
                print()
                print("Execute este SQL no Dashboard:")
                print("  INSERT INTO usuarios (id, email, nome_completo, role, ativo)")
                print("  SELECT id, email, 'Renato Silva de Assis', 'admin', true")
                print("  FROM auth.users WHERE email = 'renato086@gmail.com'")

        else:
            print()
            print("=" * 70)
            print("❌ ERRO: Tabela não foi criada")
            print("=" * 70)
            print()
            print("Solução:")
            print("  1. Acesse https://app.supabase.com")
            print("  2. Vá para SQL Editor")
            print("  3. Copie todo o conteúdo de: criar_tabela_usuarios.sql")
            print("  4. Execute no Dashboard")
            print("  5. Rode este script novamente")
            print()

        print()

if __name__ == "__main__":
    verificador = VerificadorTabela()
    verificador.gerar_relatorio()
