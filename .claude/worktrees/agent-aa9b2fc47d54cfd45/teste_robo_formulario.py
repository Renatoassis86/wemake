"""
Teste end-to-end do formulario publico We Make.
1. Abre /formulario no navegador (Chrome headless)
2. Preenche todos os campos com dados-teste (CNPJ marcado "TESTE-ROBO")
3. Submete o formulario
4. Verifica mensagem de sucesso
5. Consulta o Supabase para confirmar que o registro chegou
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests
import time
import sys

URL = 'https://wemake-romh.vercel.app/formulario'
SUPABASE_URL = 'https://vpacgvqkrkzskrzpsydg.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIyNjAsImV4cCI6MjA5NDE2ODI2MH0.NNjL1i7XoQzUGYgelW4s6l0XW9d9UA_gX8ZcTkWphRU'
SUPABASE_SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU'
MARCA = f'TESTE-ROBO-{int(time.time())}'  # marca unica para localizar depois

# Dados de teste
DADOS = {
    'resp_email': f'robo+{MARCA}@teste.wemake',
    'cnpj': '00.000.000/0001-91',
    'razao_social': f'Escola Teste Robo {MARCA} LTDA',
    'nome_fantasia': f'Colegio Teste Robo {MARCA}',
    'rua': 'Av Paulista',
    'numero': '1000',
    'bairro': 'Bela Vista',
    'cep': '01310-100',
    'cidade': 'Sao Paulo',
    'estado': 'SP',
    'email_institucional': f'contato+{MARCA}@teste.wemake',
    'alunos_infantil': '50',
    'alunos_fundamental_1': '120',
    'alunos_fundamental_2': '80',
    'alunos_ensino_medio': '60',
    'data_inicio_letivo': '02/02/2027',
    'data_fim_letivo': '15/12/2027',
    'formato_ano_letivo': 'Bimestre',
    'observacoes': f'Registro de teste automatizado - {MARCA}. Pode apagar.',
    'legal_nome': 'Robo Tester da Silva',
    'legal_cpf': '000.000.000-00',
    'legal_email': f'legal+{MARCA}@teste.wemake',
    'legal_whatsapp': '(11) 99999-9999',
    'legal_rua': 'Rua dos Bobos',
    'legal_numero': '0',
    'legal_complemento': 'Sala TESTE',
    'legal_bairro': 'Centro',
    'legal_cidade': 'Sao Paulo',
    'legal_estado': 'SP',
    'legal_cep': '01000-000',
    'fin_email_cobranca': f'financeiro+{MARCA}@teste.wemake',
    'ticket_medio': 'R$ 1.500,00',
}
CHECKBOXES = ['seg_infantil', 'seg_fundamental_1', 'seg_fundamental_2', 'seg_ensino_medio']


def supabase_count_svc():
    """Conta com service_role (bypassa RLS de SELECT)."""
    r = requests.head(
        f'{SUPABASE_URL}/rest/v1/form_precadastro_wemake',
        params={'select': 'id'},
        headers={
            'apikey': SUPABASE_SVC,
            'Authorization': f'Bearer {SUPABASE_SVC}',
            'Prefer': 'count=exact',
        },
        timeout=10,
    )
    rng = r.headers.get('Content-Range', '*/0')
    return int(rng.split('/')[-1])


def supabase_find_by_marca(marca):
    """Tenta encontrar o registro pela marca usada na razao_social (service_role)."""
    r = requests.get(
        f'{SUPABASE_URL}/rest/v1/form_precadastro_wemake',
        params={'select': '*', 'razao_social': f'ilike.*{marca}*'},
        headers={'apikey': SUPABASE_SVC, 'Authorization': f'Bearer {SUPABASE_SVC}'},
        timeout=10,
    )
    return r.json() if r.ok else None


def fill_field(driver, name, value):
    try:
        el = driver.find_element(By.NAME, name)
    except NoSuchElementException:
        print(f'  ! Campo nao encontrado: {name}')
        return
    tag = el.tag_name.lower()
    if tag == 'select':
        Select(el).select_by_visible_text(value)
    else:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        el.clear()
        el.send_keys(value)


def check_checkbox(driver, name):
    try:
        el = driver.find_element(By.ID, name)
        if not el.is_selected():
            driver.execute_script("arguments[0].click();", el)
    except NoSuchElementException:
        print(f'  ! Checkbox nao encontrado: {name}')


def main():
    print('=' * 60)
    print(f'TESTE ROBO We Make | Marca: {MARCA}')
    print('=' * 60)

    print(f'\n[1] Contagem antes do teste...')
    antes = supabase_count_svc()
    print(f'    Registros na tabela (via service_role): {antes}')

    print(f'\n[2] Abrindo navegador headless e acessando {URL}')
    opts = Options()
    opts.add_argument('--headless=new')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('--window-size=1280,900')
    opts.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    driver = webdriver.Chrome(options=opts)
    driver.set_page_load_timeout(45)

    try:
        driver.get(URL)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.NAME, 'resp_email'))
        )
        print('    Pagina carregada.')

        print('\n[3] Preenchendo campos...')
        for name, value in DADOS.items():
            fill_field(driver, name, value)
        for cb in CHECKBOXES:
            check_checkbox(driver, cb)
        print(f'    {len(DADOS)} campos texto/select + {len(CHECKBOXES)} checkboxes preenchidos.')

        # Aguarda o auto-save de 1s salvar no localStorage
        time.sleep(1.5)

        print('\n[4] Clicando em Enviar Formulario...')
        # Procura o botao submit pelo texto
        botoes = driver.find_elements(By.XPATH, "//button[@type='submit']")
        if not botoes:
            botoes = driver.find_elements(By.XPATH, "//button[contains(., 'Enviar')]")
        if not botoes:
            print('    ! Botao submit nao encontrado.')
            return 1
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", botoes[0])
        time.sleep(0.3)
        botoes[0].click()

        print('\n[5] Aguardando mensagem de sucesso...')
        try:
            WebDriverWait(driver, 25).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Recebemos seu pre-cadastro') or contains(text(), 'pré-cadastro com sucesso') or contains(text(), 'salvo com sucesso')]"))
            )
            print('    Mensagem de sucesso detectada na pagina.')
        except TimeoutException:
            print('    ! Mensagem de sucesso NAO apareceu em 25s.')
            print(f'    URL atual: {driver.current_url}')
            # tira screenshot para debug
            driver.save_screenshot('teste_robo_fail.png')
            print('    Screenshot salvo em teste_robo_fail.png')

        # Da tempo para o server action persistir
        time.sleep(3)

        # Dump dos logs do navegador
        print('\n[LOGS] Console do navegador:')
        try:
            for entry in driver.get_log('browser'):
                lvl = entry.get('level', '?')
                msg = entry.get('message', '')[:500]
                print(f'  [{lvl}] {msg}')
        except Exception as e:
            print(f'  (sem logs disponiveis: {e})')

    finally:
        driver.quit()

    print('\n[6] Verificando se chegou ao Supabase...')
    depois = supabase_count_svc()
    print(f'    Registros agora (service_role): {depois}  (delta: {depois - antes})')

    registros = supabase_find_by_marca(MARCA)
    if registros:
        r = registros[0]
        print('\n[SUCESSO] Registro encontrado no banco:')
        print(f'    id              = {r.get("id")}')
        print(f'    created_at      = {r.get("created_at")}')
        print(f'    nome_fantasia   = {r.get("nome_fantasia")}')
        print(f'    razao_social    = {r.get("razao_social")}')
        print(f'    cnpj            = {r.get("cnpj")}')
        print(f'    resp_email      = {r.get("resp_email")}')
        print(f'    cidade/uf       = {r.get("cidade")}/{r.get("estado")}')
        print(f'    legal_nome      = {r.get("legal_nome")}')
        print(f'    ticket_medio    = {r.get("ticket_medio")}')
        print(f'    status          = {r.get("status")}')
        return 0
    else:
        print('\n[FALHA] Registro NAO encontrado no banco com a marca de teste.')
        print(f'  Esperado: razao_social contendo "{MARCA}"')
        return 1


if __name__ == '__main__':
    sys.exit(main())
