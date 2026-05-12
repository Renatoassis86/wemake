#!/usr/bin/env python3
"""
Automated deployment robot for We Make platform
Handles git push and Vercel deployment with automatic retry
"""

import subprocess
import time
import os
import sys
from datetime import datetime

class DeploymentRobot:
    def __init__(self):
        self.max_retries = 5
        self.retry_delay = 60  # seconds
        self.project_dir = "D:\\app_comercial_We Make"

    def log(self, message):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")

    def run_command(self, cmd, cwd=None):
        """Run shell command and return output"""
        try:
            if cwd is None:
                cwd = self.project_dir

            result = subprocess.run(
                cmd,
                cwd=cwd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, "", str(e)

    def check_github_remote(self):
        """Check if GitHub remote is configured"""
        self.log("🔍 Verificando remote GitHub...")
        code, stdout, stderr = self.run_command("git remote -v")

        if "github" in stdout.lower() or "github" in stderr.lower():
            self.log("✅ Remote GitHub já está configurado")
            return True

        self.log("⚠️ Remote GitHub não encontrado")
        return False

    def add_github_remote(self, github_url):
        """Add GitHub remote if not present"""
        self.log(f"📝 Adicionando remote GitHub: {github_url}")
        code, stdout, stderr = self.run_command(f"git remote add origin {github_url}")

        if code == 0:
            self.log("✅ Remote adicionado com sucesso")
            return True
        else:
            if "already exists" in stderr:
                self.log("⚠️ Remote já existe, usando existente")
                return True
            self.log(f"❌ Erro ao adicionar remote: {stderr}")
            return False

    def push_to_github(self):
        """Push code to GitHub"""
        self.log("📤 Fazendo push para GitHub...")
        code, stdout, stderr = self.run_command("git push -u origin main 2>&1")

        if code == 0:
            self.log("✅ Push para GitHub bem-sucedido")
            return True
        else:
            self.log(f"❌ Erro ao fazer push: {stderr}")
            return False

    def check_git_status(self):
        """Check git status"""
        self.log("📊 Verificando status do git...")
        code, stdout, stderr = self.run_command("git status")

        if "working tree clean" in stdout or "nothing to commit" in stdout:
            self.log("✅ Working tree limpo")
            return True
        else:
            self.log("⚠️ Working tree tem mudanças não commitadas")
            return False

    def build_locally(self):
        """Run local build to verify it works"""
        self.log("🔨 Testando build local...")
        code, stdout, stderr = self.run_command("npm run build 2>&1")

        if code == 0:
            self.log("✅ Build local bem-sucedido")
            return True
        else:
            # Show last 50 lines of error
            lines = stdout.split('\n')
            for line in lines[-50:]:
                if line.strip():
                    self.log(f"  {line}")
            return False

    def verify_env_setup(self):
        """Verify environment configuration"""
        self.log("⚙️ Verificando configuração de ambiente...")

        env_local = os.path.exists(os.path.join(self.project_dir, ".env.local"))

        if not env_local:
            self.log("⚠️ .env.local não encontrado")
            return False

        self.log("✅ Ambiente configurado corretamente")
        return True

    def run_deployment_flow(self, github_url=None):
        """Run complete deployment flow"""
        print("\n" + "="*70)
        print("🤖 ROBÔ DE DEPLOY AUTOMÁTICO - We Make Platform")
        print("="*70 + "\n")

        retry_count = 0

        while retry_count < self.max_retries:
            retry_count += 1
            self.log(f"\n🔄 Tentativa {retry_count}/{self.max_retries}")
            print("-" * 70)

            # 1. Verify environment
            if not self.verify_env_setup():
                self.log("❌ Falha na configuração de ambiente")
                self.wait_and_retry(retry_count)
                continue

            # 2. Check git status
            if not self.check_git_status():
                self.log("⚠️ Working tree não está limpo")

            # 3. Check/setup GitHub remote
            if not self.check_github_remote():
                if github_url:
                    if not self.add_github_remote(github_url):
                        self.wait_and_retry(retry_count)
                        continue
                else:
                    self.log("❌ Nenhuma URL do GitHub fornecida")
                    self.print_instructions()
                    return False

            # 4. Run local build test
            if not self.build_locally():
                self.log("❌ Build local falhou - corrigindo...")
                self.wait_and_retry(retry_count)
                continue

            # 5. Push to GitHub
            if not self.push_to_github():
                self.log("❌ Push para GitHub falhou")
                self.wait_and_retry(retry_count)
                continue

            # Success!
            print("\n" + "="*70)
            print("✅ DEPLOYMENT INICIADO COM SUCESSO")
            print("="*70)
            print("\n📋 Próximos passos:")
            print("  1. Acesse https://vercel.com/dashboard")
            print("  2. Monitore o build do projeto We Make")
            print("  3. Após sucesso, acesse a URL de produção")
            print("  4. Teste o formulário e integração com banco de dados")
            print("\n")
            return True

        # All retries failed
        print("\n" + "="*70)
        print("❌ DEPLOYMENT FALHOU APÓS VÁRIAS TENTATIVAS")
        print("="*70 + "\n")
        return False

    def wait_and_retry(self, attempt_number):
        """Wait before retrying"""
        if attempt_number < self.max_retries:
            self.log(f"⏳ Aguardando {self.retry_delay}s antes de tentar novamente...")
            for i in range(self.retry_delay, 0, -10):
                if i > 0:
                    time.sleep(min(10, i))
        else:
            self.log("❌ Limite de tentativas atingido")

    def print_instructions(self):
        """Print setup instructions"""
        print("\n" + "="*70)
        print("📝 INSTRUÇÕES DE CONFIGURAÇÃO")
        print("="*70)
        print("\nPara fazer deploy automático, siga estes passos:")
        print("\n1. Crie um repositório no GitHub:")
        print("   https://github.com/new")
        print("\n2. Execute este comando para adicionar o remote:")
        print("   git remote add origin https://github.com/SEU_USUARIO/app-we-make.git")
        print("\n3. Execute novamente este script com a URL:")
        print("   python deploy_automation.py https://github.com/SEU_USUARIO/app-we-make.git")
        print("\n4. Ou simplesmente execute sem argumentos e o script tentará encontrar o remote")
        print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    robot = DeploymentRobot()

    github_url = sys.argv[1] if len(sys.argv) > 1 else None

    success = robot.run_deployment_flow(github_url)
    sys.exit(0 if success else 1)
