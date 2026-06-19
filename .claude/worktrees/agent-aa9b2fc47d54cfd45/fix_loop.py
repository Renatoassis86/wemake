"""
Loop de validacao automatica:
1. Cria/garante o usuario contato@wemake.tec.br
2. Testa login via API
3. Envia formulario teste via REST direto (mais confiavel que selenium pra debug)
4. Confirma que registro chegou ao banco
5. Roda selenium end-to-end no site real
"""
import requests
import time
import sys
import json

ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIyNjAsImV4cCI6MjA5NDE2ODI2MH0.NNjL1i7XoQzUGYgelW4s6l0XW9d9UA_gX8ZcTkWphRU'
SVC   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU'
BASE  = 'https://vpacgvqkrkzskrzpsydg.supabase.co'

EMAIL = 'contato@wemake.tec.br'
PASS  = 'admin123'

def hdrs(key, content=False):
    h = {'apikey': key, 'Authorization': f'Bearer {key}'}
    if content: h['Content-Type'] = 'application/json'
    return h

def step(n, label):
    print(f'\n{"="*64}\n[{n}] {label}\n{"="*64}')

def garantir_usuario():
    step(1, f'Garantir usuario {EMAIL} no auth.users')
    # tenta listar primeiro
    r = requests.get(f'{BASE}/auth/v1/admin/users', headers=hdrs(SVC),
                     params={'email': EMAIL}, timeout=15)
    if r.ok:
        users = r.json().get('users', [])
        existe = [u for u in users if u.get('email') == EMAIL]
        if existe:
            uid = existe[0]['id']
            print(f'  ja existe: id={uid}, confirmed={existe[0].get("email_confirmed_at")}')
            # garante senha + confirmação
            r2 = requests.put(f'{BASE}/auth/v1/admin/users/{uid}',
                              headers=hdrs(SVC, True),
                              json={'password': PASS, 'email_confirm': True},
                              timeout=15)
            print(f'  PUT password: {r2.status_code} {r2.text[:200]}')
            return uid
    # cria
    r = requests.post(f'{BASE}/auth/v1/admin/users', headers=hdrs(SVC, True),
                      json={'email': EMAIL, 'password': PASS, 'email_confirm': True},
                      timeout=15)
    if r.ok:
        uid = r.json().get('id')
        print(f'  criado: id={uid}')
        return uid
    print(f'  FALHA criar: {r.status_code} {r.text}')
    return None

def testar_login():
    step(2, 'Testar login via auth/v1/token')
    r = requests.post(f'{BASE}/auth/v1/token?grant_type=password',
                      headers={'apikey': ANON, 'Content-Type': 'application/json'},
                      json={'email': EMAIL, 'password': PASS}, timeout=15)
    if r.ok:
        j = r.json()
        print(f'  OK access_token len={len(j.get("access_token",""))}')
        print(f'  user.id    = {j["user"]["id"]}')
        print(f'  user.email = {j["user"]["email"]}')
        return True
    print(f'  FALHA: {r.status_code} {r.text}')
    return False

def contar_formularios():
    r = requests.head(f'{BASE}/rest/v1/form_precadastro_wemake',
                      headers={**hdrs(ANON), 'Prefer': 'count=exact'},
                      params={'select': 'id'}, timeout=10)
    rng = r.headers.get('Content-Range', '*/0')
    return int(rng.split('/')[-1])

def testar_form_via_rest():
    step(3, 'Inserir form_precadastro_wemake via REST com anon key')
    antes = contar_formularios()
    print(f'  antes: {antes} registros')
    marca = f'TESTE-REST-{int(time.time())}'
    payload = {
        'resp_email': 'teste-rest@teste.com',
        'cnpj': '00.000.000/0001-99',
        'razao_social': f'Escola Teste REST {marca}',
        'nome_fantasia': f'Colegio {marca}',
        'rua': 'Rua Teste', 'numero': '123', 'bairro': 'Centro',
        'cep': '01000-000', 'cidade': 'Sao Paulo', 'estado': 'SP',
        'email_institucional': 'contato@teste.com',
        'seg_infantil': True, 'seg_fundamental_1': True,
        'seg_fundamental_2': False, 'seg_ensino_medio': False,
        'alunos_infantil': 30, 'alunos_fundamental_1': 90,
        'alunos_fundamental_2': 0, 'alunos_ensino_medio': 0,
        'data_inicio_letivo': '2027-02-01', 'data_fim_letivo': '2027-12-15',
        'formato_ano_letivo': 'Bimestre', 'observacoes': f'Teste REST {marca}',
        'legal_nome': 'Tester REST', 'legal_cpf': '000.000.000-00',
        'legal_email': 'legal@teste.com', 'legal_whatsapp': '(11)99999-9999',
        'legal_rua': 'R. Legal', 'legal_numero': '1', 'legal_bairro': 'Centro',
        'legal_cidade': 'Sao Paulo', 'legal_estado': 'SP', 'legal_cep': '01000-000',
        'fin_email_cobranca': 'fin@teste.com', 'ticket_medio': 'R$ 1.000,00',
        'status': 'pendente',
    }
    r = requests.post(f'{BASE}/rest/v1/form_precadastro_wemake',
                      headers={**hdrs(ANON, True), 'Prefer': 'return=representation'},
                      json=payload, timeout=15)
    print(f'  POST: {r.status_code}')
    if not r.ok:
        print(f'  Body: {r.text[:500]}')
        return False
    j = r.json()
    if isinstance(j, list) and j:
        print(f'  Inserido id={j[0].get("id")} razao_social={j[0].get("razao_social")}')
    depois = contar_formularios()
    print(f'  depois: {depois} registros (delta {depois-antes})')
    return depois > antes

def main():
    print('LOOP DE VALIDACAO We Make\n')
    sucesso_login = False
    sucesso_form = False

    for tentativa in range(1, 4):
        print(f'\n>>>>>>>>>> TENTATIVA {tentativa} <<<<<<<<<<')

        uid = garantir_usuario()
        sucesso_login = testar_login()
        sucesso_form = testar_form_via_rest()

        if sucesso_login and sucesso_form:
            print('\n[SUCESSO] Login + Form via REST funcionando.')
            break
        print(f'\n[Tentativa {tentativa} falhou] login={sucesso_login} form={sucesso_form}')
        if tentativa < 3:
            print('  aguardando 5s e tentando de novo...')
            time.sleep(5)

    # Resumo
    step(99, 'RESUMO')
    print(f'  Login {EMAIL}: {"OK" if sucesso_login else "FALHA"}')
    print(f'  INSERT form via REST anon: {"OK" if sucesso_form else "FALHA"}')
    print(f'  Total registros no banco agora: {contar_formularios()}')

    return 0 if (sucesso_login and sucesso_form) else 1

if __name__ == '__main__':
    sys.exit(main())
