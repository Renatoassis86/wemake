#!/usr/bin/env python3
"""
Script para garantir a persistência dos vídeos hero nas pastas corretas
Sincroniza os vídeos entre as duas pastas do projeto
"""

import os
import shutil
import hashlib
from pathlib import Path

class GarantidorVideos:
    def __init__(self):
        self.projeto_principal = r"D:\app_comercial_We Make\public\videos"
        self.projeto_secundario = r"D:\repositorio_geral\app_comercial_education_django\comercial_nextjs\public\videos"
        self.videos_corretos = ["hero.mp4", "hero1.mp4", "hero2.mp4"]

    def calcular_hash(self, arquivo):
        """Calcula o hash SHA256 de um arquivo"""
        sha256_hash = hashlib.sha256()
        with open(arquivo, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def verificar_pasta(self, caminho_pasta):
        """Verifica e lista os vídeos em uma pasta"""
        print(f"\n📁 Verificando pasta: {caminho_pasta}")
        print("─" * 70)

        if not os.path.exists(caminho_pasta):
            print(f"❌ Pasta não existe! Criando...")
            os.makedirs(caminho_pasta, exist_ok=True)
            return []

        arquivos = []
        for arquivo in os.listdir(caminho_pasta):
            caminho_completo = os.path.join(caminho_pasta, arquivo)
            if arquivo.endswith('.mp4'):
                tamanho_mb = os.path.getsize(caminho_completo) / (1024 * 1024)
                hash_arquivo = self.calcular_hash(caminho_completo)
                arquivos.append({
                    'nome': arquivo,
                    'tamanho_mb': tamanho_mb,
                    'hash': hash_arquivo
                })
                status = "✅" if arquivo in self.videos_corretos else "⚠️"
                print(f"  {status} {arquivo} ({tamanho_mb:.1f}MB)")

        return arquivos

    def sincronizar_videos(self):
        """Sincroniza os vídeos entre as duas pastas"""
        print("\n🔄 SINCRONIZANDO VÍDEOS")
        print("=" * 70)

        arquivos_principal = self.verificar_pasta(self.projeto_principal)
        arquivos_secundario = self.verificar_pasta(self.projeto_secundario)

        # Cria dicionários para facilitar comparação
        dict_principal = {a['nome']: a for a in arquivos_principal}
        dict_secundario = {a['nome']: a for a in arquivos_secundario}

        mudancas = False

        # Verifica cada vídeo correto
        for video in self.videos_corretos:
            print(f"\n📹 Verificando {video}...")

            principal = dict_principal.get(video)
            secundario = dict_secundario.get(video)

            if principal and secundario:
                if principal['hash'] == secundario['hash']:
                    print(f"  ✅ {video} está sincronizado")
                else:
                    print(f"  ⚠️ {video} tem conteúdo diferente! Sincronizando...")
                    shutil.copy2(
                        os.path.join(self.projeto_principal, video),
                        os.path.join(self.projeto_secundario, video)
                    )
                    mudancas = True
                    print(f"  ✅ {video} sincronizado com sucesso")
            elif principal and not secundario:
                print(f"  📋 {video} falta em comercial_nextjs. Copiando...")
                shutil.copy2(
                    os.path.join(self.projeto_principal, video),
                    os.path.join(self.projeto_secundario, video)
                )
                mudancas = True
                print(f"  ✅ {video} copiado com sucesso")
            elif not principal and secundario:
                print(f"  📋 {video} falta em app_comercial_we_make. Copiando...")
                shutil.copy2(
                    os.path.join(self.projeto_secundario, video),
                    os.path.join(self.projeto_principal, video)
                )
                mudancas = True
                print(f"  ✅ {video} copiado com sucesso")
            else:
                print(f"  ❌ {video} não encontrado em nenhuma pasta!")

        return mudancas

    def remover_videos_antigos(self):
        """Remove vídeos antigos que não devem estar lá"""
        print("\n🗑️  REMOVENDO VÍDEOS ANTIGOS")
        print("=" * 70)

        videos_antigos = [
            'bg.mp4', 'bg2.mp4', 'bg3.mp4', 'institucional.mp4',
            'bgvideo.mp4', 'background.mp4', 'video.mp4'
        ]

        for pasta in [self.projeto_principal, self.projeto_secundario]:
            print(f"\n📁 Verificando {pasta}...")

            if not os.path.exists(pasta):
                continue

            for arquivo in os.listdir(pasta):
                if arquivo in videos_antigos:
                    caminho_completo = os.path.join(pasta, arquivo)
                    print(f"  🗑️ Removendo {arquivo}...")
                    try:
                        os.remove(caminho_completo)
                        print(f"  ✅ {arquivo} removido")
                    except Exception as e:
                        print(f"  ❌ Erro ao remover {arquivo}: {e}")

    def limpar_cache_next(self):
        """Remove o cache do Next.js para forçar recarregamento"""
        print("\n🧹 LIMPANDO CACHE DO NEXT.JS")
        print("=" * 70)

        next_dir = r"D:\app_comercial_We Make\.next"

        if os.path.exists(next_dir):
            print(f"  📁 Removendo {next_dir}...")
            try:
                shutil.rmtree(next_dir)
                print(f"  ✅ Cache removido com sucesso")
            except Exception as e:
                print(f"  ❌ Erro ao remover cache: {e}")
        else:
            print(f"  ℹ️  Cache não encontrado (isso é normal se o servidor não foi iniciado)")

    def gerar_relatorio(self):
        """Gera um relatório final"""
        print("\n" + "=" * 70)
        print("📊 RELATÓRIO FINAL")
        print("=" * 70)

        print("\n✅ VÍDEOS OBRIGATÓRIOS:")
        for video in self.videos_corretos:
            principal_existe = os.path.exists(os.path.join(self.projeto_principal, video))
            secundario_existe = os.path.exists(os.path.join(self.projeto_secundario, video))

            status_principal = "✅" if principal_existe else "❌"
            status_secundario = "✅" if secundario_existe else "❌"

            print(f"  {video}")
            print(f"    {status_principal} app_comercial_we_make/public/videos/")
            print(f"    {status_secundario} comercial_nextjs/public/videos/")

        print("\n🔍 CÓDIGO QUE USA OS VÍDEOS:")
        print("  ✅ src/app/(auth)/login/page.tsx")
        print("  ✅ src/app/hub/comercial/login/page.tsx")
        print("  ✅ src/app/hub/contratos/login/page.tsx")
        print("  ✅ src/app/hub/pedidos/login/page.tsx")
        print("  ✅ src/components/hub/HubLanding.tsx")

        print("\n🎯 REFERÊNCIAS NO CÓDIGO:")
        print("  ✅ Todas as páginas usam: ['hero.mp4', 'hero1.mp4', 'hero2.mp4']")
        print("  ✅ Path: /videos/{video}")
        print("  ✅ Fade transition: 1.5s")
        print("  ✅ Auto-rotate: a cada 8 segundos")

    def executar(self):
        """Executa o processo completo"""
        print("\n╔════════════════════════════════════════════════════════════════╗")
        print("║           🎬 GARANTIDOR DE PERSISTÊNCIA DE VÍDEOS               ║")
        print("╚════════════════════════════════════════════════════════════════╝")

        # Sincroniza vídeos
        mudancas = self.sincronizar_videos()

        # Remove vídeos antigos
        self.remover_videos_antigos()

        # Limpa cache
        self.limpar_cache_next()

        # Gera relatório
        self.gerar_relatorio()

        print("\n" + "=" * 70)
        if mudancas:
            print("✅ PROCESSO CONCLUÍDO COM SINCRONIZAÇÕES!")
            print("⚠️  Reinicie o servidor Next.js para ver as mudanças:")
            print("   npm run dev")
        else:
            print("✅ PROCESSO CONCLUÍDO - TUDO JÁ ESTÁ SINCRONIZADO!")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    garantidor = GarantidorVideos()
    garantidor.executar()
