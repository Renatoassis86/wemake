#!/usr/bin/env python3
"""
Robô de teste para validar o formulário de pré-cadastro We Make
Testa: preenchimento, mensagem de sucesso, persistência em banco de dados
"""

import time
import json
import subprocess
import requests
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from supabase_integration import SupabaseClient

class RoboTesteFormulario:
    def __init__(self):
        self.url_formulario = "http://localhost:3000/formulario"
        self.num_testes = 0
        self.testes_sucesso = 0
        self.testes_erro = 0
        self.driver = None
        self.supabase = SupabaseClient()

    def iniciar_navegador(self):
        """Inicia o navegador Chrome em headless mode"""
        print("🌐 Iniciando navegador Chrome...")
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")

        try:
            self.driver = webdriver.Chrome(options=options)
            print("✅ Navegador iniciado com sucesso")
            return True
        except Exception as e:
            print(f"❌ Erro ao iniciar navegador: {e}")
            return False

    def fechar_navegador(self):
        """Fecha o navegador"""
        if self.driver:
            self.driver.quit()
            print("🔚 Navegador fechado")

    def gerar_dados_teste(self, numero_teste):
        """Gera dados únicos para cada teste"""
        timestamp = int(time.time())
        numero = timestamp + numero_teste

        return {
            "resp_email": f"diretor{numero}@escolateste.org",
            "cnpj": f"1234567800{numero % 100:02d}",
            "razao_social": f"Escola Teste {numero} LTDA",
            "nome_fantasia": f"Escola Teste {numero}",
            "rua": f"Rua Teste {numero}",
            "numero": str(100 + numero_teste),
            "bairro": "Bairro Centro",
            "cep": "01234567",
            "cidade": "São Paulo",
            "estado": "SP",
            "email_institucional": f"contato{numero}@escolateste.org",
            "seg_infantil": True,
            "seg_fundamental_1": True,
            "alunos_infantil": 30 + numero_teste,
            "alunos_fundamental_1": 50 + numero_teste,
            "data_inicio_letivo": "2027-02-01",
            "data_fim_letivo": "2027-12-20",
            "formato_ano_letivo": "Semestral",
            "observacoes": f"Teste automático {numero}",
            "legal_nome": f"João Silva {numero}",
            "legal_cpf": f"12345678{numero % 100:03d}",
            "legal_email": f"joao{numero}@escolateste.org",
            "legal_whatsapp": "11999999999",
            "legal_rua": f"Rua Teste {numero}",
            "legal_numero": str(100 + numero_teste),
            "legal_bairro": "Bairro Centro",
            "legal_cidade": "São Paulo",
            "legal_estado": "SP",
            "legal_cep": "01234567",
            "fin_email_cobranca": f"financeiro{numero}@escolateste.org",
            "ticket_medio": "5000"
        }

    def preencher_formulario(self, dados):
        """Preenche o formulário com os dados fornecidos"""
        print("📝 Preenchendo formulário...")

        try:
            # Aguarda o formulário carregar
            wait = WebDriverWait(self.driver, 10)
            form = wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))

            # Preenche campos de texto
            campos_texto = [
                "resp_email", "cnpj", "razao_social", "nome_fantasia",
                "rua", "numero", "bairro", "cep", "cidade", "email_institucional",
                "alunos_infantil", "alunos_fundamental_1", "alunos_fundamental_2",
                "alunos_ensino_medio", "legal_nome", "legal_cpf", "legal_email",
                "legal_whatsapp", "legal_rua", "legal_numero", "legal_bairro",
                "legal_cidade", "legal_cep", "fin_email_cobranca", "ticket_medio",
                "observacoes"
            ]

            for campo in campos_texto:
                if campo in dados:
                    try:
                        elemento = self.driver.find_element(By.NAME, campo)
                        elemento.clear()
                        elemento.send_keys(str(dados[campo]))
                        print(f"  ✓ {campo}: {dados[campo]}")
                    except Exception as e:
                        print(f"  ⚠ Campo {campo} não encontrado: {e}")

            # Preenche selects (dropdowns)
            try:
                select_estado = Select(self.driver.find_element(By.NAME, "estado"))
                select_estado.select_by_value("SP")
                print(f"  ✓ estado: SP")
            except Exception as e:
                print(f"  ⚠ Erro ao selecionar estado: {e}")

            try:
                select_estado_legal = Select(self.driver.find_element(By.NAME, "legal_estado"))
                select_estado_legal.select_by_value("SP")
                print(f"  ✓ legal_estado: SP")
            except Exception as e:
                print(f"  ⚠ Erro ao selecionar legal_estado: {e}")

            try:
                select_formato = Select(self.driver.find_element(By.NAME, "formato_ano_letivo"))
                select_formato.select_by_value("Semestral")
                print(f"  ✓ formato_ano_letivo: Semestral")
            except Exception as e:
                print(f"  ⚠ Erro ao selecionar formato: {e}")

            # Marca checkboxes
            checkboxes = ["seg_infantil", "seg_fundamental_1"]
            for checkbox in checkboxes:
                try:
                    elemento = self.driver.find_element(By.NAME, checkbox)
                    if not elemento.is_selected():
                        elemento.click()
                    print(f"  ✓ {checkbox}: marcado")
                except Exception as e:
                    print(f"  ⚠ Erro ao marcar {checkbox}: {e}")

            # Preenche datas
            datas = ["data_inicio_letivo", "data_fim_letivo"]
            for data in datas:
                try:
                    elemento = self.driver.find_element(By.NAME, data)
                    elemento.clear()
                    elemento.send_keys(dados.get(data, ""))
                    print(f"  ✓ {data}: {dados.get(data)}")
                except Exception as e:
                    print(f"  ⚠ Erro ao preencher {data}: {e}")

            print("✅ Formulário preenchido com sucesso")
            return True

        except Exception as e:
            print(f"❌ Erro ao preencher formulário: {e}")
            return False

    def submeter_formulario(self):
        """Submete o formulário"""
        print("🔄 Submetendo formulário...")

        try:
            # Encontra o botão de envio
            botao_envio = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

            # Faz scroll até o botão
            self.driver.execute_script("arguments[0].scrollIntoView(true);", botao_envio)
            print("✓ Scrolled até o botão de envio")

            # Aguarda um pouco
            time.sleep(1)

            # Clica usando JavaScript para evitar interceptação
            self.driver.execute_script("arguments[0].click();", botao_envio)
            print("✓ Botão de envio clicado com sucesso")

            # Aguarda a mensagem de sucesso aparecer
            wait = WebDriverWait(self.driver, 15)
            mensagem_sucesso = wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Seu registro foi salvo com sucesso')]"))
            )

            mensagem_texto = mensagem_sucesso.text
            print(f"✅ Mensagem de sucesso detectada: {mensagem_texto}")
            return True

        except Exception as e:
            print(f"❌ Erro ao submeter ou validar resposta: {e}")
            return False

    def verificar_no_banco_dados(self, nome_fantasia):
        """Verifica se os dados foram inseridos no banco de dados"""
        print("🔍 Verificando banco de dados...")

        try:
            # Aguarda um pouco para o servidor processar
            time.sleep(2)

            # Consulta o banco para verificar o registro
            resultado = self.supabase.table('form_precadastro_wemake').select(
                "id,nome_fantasia,email_institucional,created_at"
            ).order('created_at', desc=True).limit(1).execute()

            if resultado and len(resultado) > 0:
                ultimo = resultado[0]
                if ultimo['nome_fantasia'] == nome_fantasia:
                    print(f"✅ Dados encontrados no banco de dados!")
                    print(f"   Nome: {ultimo['nome_fantasia']}")
                    print(f"   Email: {ultimo['email_institucional']}")
                    print(f"   Data: {ultimo['created_at']}")
                    return True
                else:
                    print(f"⚠ Último registro não corresponde (esperado: {nome_fantasia}, encontrado: {ultimo['nome_fantasia']})")
                    return False
            else:
                print("❌ Nenhum registro encontrado no banco de dados")
                return False

        except Exception as e:
            print(f"❌ Erro ao consultar banco de dados: {e}")
            return False

    def executar_teste(self, numero_teste):
        """Executa um ciclo completo de teste"""
        print(f"\n{'='*80}")
        print(f"🧪 TESTE #{numero_teste} - {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*80}")

        self.num_testes += 1

        try:
            # Gera dados de teste
            dados = self.gerar_dados_teste(numero_teste)
            nome_fantasia = dados['nome_fantasia']

            # Abre o formulário
            print(f"📱 Abrindo {self.url_formulario}")
            self.driver.get(self.url_formulario)
            time.sleep(2)

            # Preenche o formulário
            if not self.preencher_formulario(dados):
                self.testes_erro += 1
                return False

            # Submete o formulário
            if not self.submeter_formulario():
                self.testes_erro += 1
                return False

            # Aguarda o redirecionamento (5 segundos + margem)
            time.sleep(7)

            # Verifica se os dados foram inseridos no banco
            if not self.verificar_no_banco_dados(nome_fantasia):
                self.testes_erro += 1
                return False

            print(f"\n✅ TESTE #{numero_teste} PASSOU!")
            self.testes_sucesso += 1
            return True

        except Exception as e:
            print(f"\n❌ TESTE #{numero_teste} FALHOU: {e}")
            self.testes_erro += 1
            return False

    def exibir_resumo(self):
        """Exibe um resumo dos testes executados"""
        print(f"\n{'='*80}")
        print(f"📊 RESUMO DOS TESTES")
        print(f"{'='*80}")
        print(f"Total de testes: {self.num_testes}")
        print(f"✅ Sucessos: {self.testes_sucesso}")
        print(f"❌ Erros: {self.testes_erro}")
        taxa_sucesso = (self.testes_sucesso / self.num_testes * 100) if self.num_testes > 0 else 0
        print(f"📈 Taxa de sucesso: {taxa_sucesso:.1f}%")
        print(f"{'='*80}\n")

    def executar_loop_testes(self, num_iteracoes=3):
        """Executa múltiplos testes em loop"""
        print(f"\n🤖 INICIANDO ROBÔ DE TESTES - {num_iteracoes} iterações")
        print(f"{'='*80}\n")

        if not self.iniciar_navegador():
            print("❌ Não foi possível iniciar o navegador")
            return False

        try:
            for i in range(1, num_iteracoes + 1):
                sucesso = self.executar_teste(i)

                if i < num_iteracoes:
                    print(f"\n⏳ Aguardando 5 segundos antes do próximo teste...")
                    time.sleep(5)

            self.exibir_resumo()

            # Verifica se todos os testes passaram
            if self.testes_erro == 0:
                print("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!")
                return True
            else:
                print("⚠️ ALGUNS TESTES FALHARAM - Veja o relatório acima")
                return False

        except KeyboardInterrupt:
            print("\n\n⚠️ Testes interrompidos pelo usuário")
            self.exibir_resumo()
            return False
        finally:
            self.fechar_navegador()


if __name__ == "__main__":
    robo = RoboTesteFormulario()

    # Executa 3 testes em loop
    sucesso = robo.executar_loop_testes(num_iteracoes=3)

    if sucesso:
        exit(0)
    else:
        exit(1)
