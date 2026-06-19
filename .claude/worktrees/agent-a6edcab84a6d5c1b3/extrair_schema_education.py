"""
Extrai o schema completo (CREATE TABLE) das tabelas usadas pelo CRM
do Supabase Education, para serem replicadas no Supabase We Make.
"""
import requests, json, sys, re

EDU_URL = 'https://lyisdsnocroocxfblvqf.supabase.co'
EDU_SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aXNkc25vY3Jvb2N4ZmJsdnFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODc4OSwiZXhwIjoyMDkzNTc0Nzg5fQ.hdamjVF-9MfZuFZj24Jh1w2W_eKDBSfj7P3WJnqSzbM'

headers = {'apikey': EDU_SVC, 'Authorization': f'Bearer {EDU_SVC}'}

# Tabelas que vimos sendo usadas no codigo
TABELAS = [
    'escolas', 'escolas_resumo', 'registros', 'negociacoes', 'tarefas',
    'notas_escola', 'contratos', 'contratos_arquivos', 'profiles', 'audit_log',
    'documentos_oficiais', 'formularios', 'agenda_eventos', 'agenda_participantes',
    'leads_universal', 'leads_pessoa', 'leads_escola', 'leads_contato_escola',
    'leads_oikos_live', 'leads_participacao', 'leads_perfil_escola',
    'ciecc_inscritos', 'ciecc_leads_sem_escola', 'transcricoes_reunioes',
    'usuario_escolas_pipeline', 'perfis', 'empresas', 'usuarios_empresas',
]

print('Probing Education tables...\n')
ddl_parts = []
nao_existe = []
existe = []

for t in TABELAS:
    # OPTIONS retorna as colunas + tipos via header Content-Type
    # GET /tabela?select=* limit 0 retorna headers com info
    r = requests.get(f'{EDU_URL}/rest/v1/{t}', headers=headers,
                     params={'select': '*', 'limit': 1}, timeout=15)
    if r.status_code == 200:
        existe.append(t)
        print(f'  OK  {t}')
        sample = r.json()
        if sample:
            cols = list(sample[0].keys())
            print(f'        cols: {", ".join(cols)}')
    elif r.status_code == 404:
        nao_existe.append(t)
        print(f'  --  {t} (nao existe)')
    else:
        print(f'  ??  {t}: HTTP {r.status_code} - {r.text[:100]}')

print(f'\n{"="*60}\nEXISTEM ({len(existe)}): {", ".join(existe)}')
print(f'NAO EXISTEM ({len(nao_existe)}): {", ".join(nao_existe)}')

# Salvar como JSON pra prox passo
with open('education_tables.json', 'w', encoding='utf-8') as f:
    json.dump({'existe': existe, 'nao_existe': nao_existe}, f, indent=2)
print(f'\nSalvo em education_tables.json')
