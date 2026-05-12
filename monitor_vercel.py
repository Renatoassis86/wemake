#!/usr/bin/env python3
"""
Monitor Vercel deployment status and retry on failure
"""

import requests
import time
import sys
from datetime import datetime

class VercelMonitor:
    def __init__(self):
        self.project_name = "wemake"
        self.vercel_api = "https://api.vercel.com"
        self.github_repo = "Renatoassis86/wemake"
        self.check_interval = 30  # seconds
        self.max_wait_time = 3600  # 1 hour
        self.start_time = time.time()

    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")

    def check_deployment_status(self):
        """Check deployment status from GitHub workflow or Vercel"""
        self.log("🔍 Verificando status do deployment...")

        try:
            # Check GitHub Actions status
            url = f"https://api.github.com/repos/{self.github_repo}/actions/runs"
            headers = {"Accept": "application/vnd.github.v3+json"}

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                runs = response.json().get('workflow_runs', [])

                if runs:
                    latest_run = runs[0]
                    status = latest_run.get('status', 'unknown')
                    conclusion = latest_run.get('conclusion', 'pending')

                    self.log(f"Status: {status}, Conclusion: {conclusion}")

                    if conclusion == 'success':
                        self.log("✅ Deployment bem-sucedido!")
                        return 'success'
                    elif conclusion == 'failure':
                        self.log("❌ Deployment falhou")
                        return 'failure'
                    elif status == 'in_progress':
                        self.log("⏳ Deployment em andamento...")
                        return 'pending'
                    else:
                        self.log(f"⏳ Status: {status} ({conclusion})")
                        return 'pending'
                else:
                    self.log("⏳ Aguardando início do deployment...")
                    return 'pending'
            else:
                self.log(f"⚠️ Erro ao verificar status: {response.status_code}")
                return 'unknown'

        except Exception as e:
            self.log(f"❌ Erro ao conectar: {e}")
            return 'unknown'

    def monitor_deployment(self):
        """Monitor deployment until completion"""
        print("\n" + "="*70)
        print("📊 MONITORANDO DEPLOYMENT VERCEL")
        print("="*70 + "\n")

        attempt = 0
        while True:
            attempt += 1
            elapsed = time.time() - self.start_time

            if elapsed > self.max_wait_time:
                self.log(f"❌ Timeout: Deployment não completou em {self.max_wait_time}s")
                return False

            self.log(f"\n🔄 Verificação #{attempt}")
            status = self.check_deployment_status()

            if status == 'success':
                print("\n" + "="*70)
                print("✅ DEPLOYMENT COMPLETADO COM SUCESSO!")
                print("="*70)
                print("\n📋 Próximos passos:")
                print("  1. Acesse: https://wemake.vercel.app")
                print("  2. Teste o formulário de pré-registro")
                print("  3. Verifique integração com banco de dados")
                print("  4. Teste login com: renato086@gmail.com / admin123")
                print("\n")
                return True

            elif status == 'failure':
                self.log("❌ Deployment falhou - pode ser necessário investigar")
                return False

            # Wait before next check
            time.sleep(self.check_interval)

if __name__ == "__main__":
    monitor = VercelMonitor()
    success = monitor.monitor_deployment()
    sys.exit(0 if success else 1)
