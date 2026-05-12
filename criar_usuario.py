#!/usr/bin/env python3
"""
Script para criar um usuário no Supabase
"""

import requests
import json

class CriadorUsuarioSupabase:
    def __init__(self):
        self.url = "https://vpacgvqkrkzskrzpsydg.supabase.co"
        self.service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU"
        self.headers = {
            "apikey": self.service_key,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.service_key}"
        }

    def criar_usuario(self, email, senha, metadata=None):
        """Cria um usuário no Supabase"""

        endpoint = f"{self.url}/auth/v1/admin/users"

        payload = {
            "email": email,
            "password": senha,
            "email_confirm": True,  # Confirma o email automaticamente
            "user_metadata": metadata or {}
        }

        print(f"╔════════════════════════════════════════════════════════════════╗")
        print(f"║            🔐 CRIANDO USUÁRIO NO SUPABASE                      ║")
        print(f"╚════════════════════════════════════════════════════════════════╝")
        print()

        print(f"📧 Email: {email}")
        print(f"🔑 Senha: {senha}")
        print(f"🌐 Endpoint: {endpoint}")
        print()

        print("📤 Enviando requisição...")

        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)

            print(f"📊 Status Code: {response.status_code}")

            if response.status_code in [200, 201]:
                user_data = response.json()
                user_id = user_data.get('id', 'N/A')

                print()
                print("✅ USUÁRIO CRIADO COM SUCESSO!")
                print()
                print(f"👤 Detalhes do Usuário:")
                print(f"  ID: {user_id}")
                print(f"  Email: {email}")
                print(f"  Status: Ativo (email confirmado)")
                print(f"  Data de Criação: {user_data.get('created_at', 'N/A')}")
                print()
                print("🔐 Credenciais de Acesso:")
                print(f"  Email: {email}")
                print(f"  Senha: {senha}")
                print()

                return True
            else:
                print()
                print("❌ ERRO AO CRIAR USUÁRIO")
                print(f"Response: {response.text}")
                return False

        except Exception as e:
            print()
            print(f"❌ ERRO NA REQUISIÇÃO: {e}")
            return False

if __name__ == "__main__":
    criador = CriadorUsuarioSupabase()

    email = "renato086@gmail.com"
    senha = "admin123"

    sucesso = criador.criar_usuario(email, senha)

    if sucesso:
        print("=" * 70)
        print("✅ PRÓXIMAS ETAPAS:")
        print("  1. Acesse: http://localhost:3000/auth/login")
        print(f"  2. Email: {email}")
        print(f"  3. Senha: {senha}")
        print("=" * 70)
        exit(0)
    else:
        exit(1)
