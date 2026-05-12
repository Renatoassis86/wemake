"""
Script de importação dos leads CIECC para o Supabase.
Executa: python importar_leads.py

Requisitos: pip install pandas openpyxl supabase python-dotenv
"""

import pandas as pd
import re
import uuid
from datetime import datetime
from supabase import create_client, Client

# ── Configuração ──────────────────────────────────────────────
SUPABASE_URL = "https://lyisdsnocroocxfblvqf.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aXNkc25vY3Jvb2N4ZmJsdnFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5ODc4OSwiZXhwIjoyMDkzNTc0Nzg5fQ.hdamjVF-9MfZuFZj24Jh1w2W_eKDBSfj7P3WJnqSzbM"

BASE_DIR = r"D:\repositorio_geral\app_comercial_education_django"

ARQUIVOS = {
    "ciecc_2026": f"{BASE_DIR}\\Banco_Unificado_CIECC_2026 (2).xlsx",
    "ciecc_2025": f"{BASE_DIR}\\Prover 2025.xlsx",
    "crm":        f"{BASE_DIR}\\Education_CRM_FINAL.xlsx",
}

supabase: Client = create_client(SUPABASE_URL, SERVICE_KEY)

# ── Helpers ───────────────────────────────────────────────────

def limpar_texto(v):
    if pd.isna(v) or v is None: return None
    s = str(v).strip()
    return s if s and s.lower() not in ('nan','none','0','0.0') else None

def limpar_tel(v):
    if pd.isna(v) or v is None: return None
    s = re.sub(r'\D', '', str(v).split('.')[0])
    return s if len(s) >= 8 else None

def limpar_cpf(v):
    if pd.isna(v) or v is None: return None
    s = re.sub(r'\D', '', str(v).split('.')[0])
    s = s.zfill(11)  # restaura zeros à esquerda
    return s if len(s) == 11 else None

def limpar_email(v):
    e = limpar_texto(v)
    if not e: return None
    return e.lower().strip()

def limpar_int(v):
    try:
        f = float(str(v).replace(',', '.'))
        return int(f) if not pd.isna(f) else None
    except: return None

def limpar_decimal(v):
    try:
        f = float(str(v).replace(',', '.').replace('R$','').strip())
        return round(f, 2) if not pd.isna(f) else None
    except: return None

def limpar_data(v):
    if pd.isna(v) or v is None: return None
    try:
        if isinstance(v, (datetime, pd.Timestamp)):
            return v.strftime('%Y-%m-%d')
        s = str(v).strip()
        for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y'):
            try: return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
            except: pass
    except: pass
    return None

def detectar_modalidade(lote: str) -> str:
    if not lote: return 'presencial'
    l = lote.upper()
    if 'ONLINE' in l: return 'online'
    return 'presencial'

def batch_insert(tabela: str, registros: list, batch_size=200) -> int:
    inseridos = 0
    for i in range(0, len(registros), batch_size):
        batch = registros[i:i+batch_size]
        try:
            supabase.table(tabela).insert(batch).execute()
            inseridos += len(batch)
            print(f"  ✓ {tabela}: {inseridos}/{len(registros)}")
        except Exception as e:
            print(f"  ✗ ERRO em {tabela} batch {i}: {e}")
    return inseridos

# ══════════════════════════════════════════════════════════════
# FASE 1 — Importar Escolas do CRM (aba "1 · Todas as Escolas")
# ══════════════════════════════════════════════════════════════

def importar_escolas_crm():
    print("\n📋 Fase 1: Escolas do CRM...")

    # Ler com header nas primeiras 3 linhas (estrutura especial do CRM)
    df_raw = pd.read_excel(ARQUIVOS["crm"], sheet_name=0, header=None)

    # Encontrar linha com os headers reais
    header_row = None
    for i, row in df_raw.iterrows():
        vals = [str(v) for v in row.values if str(v) not in ('nan', 'None')]
        if any('Escola' in v or 'CNPJ' in v or 'Cidade' in v for v in vals):
            header_row = i
            break

    if header_row is None:
        # Tentar com header=2
        df = pd.read_excel(ARQUIVOS["crm"], sheet_name=0, header=2)
    else:
        df = pd.read_excel(ARQUIVOS["crm"], sheet_name=0, header=header_row)

    df.columns = [str(c).strip() for c in df.columns]

    # Mapear colunas (limpar emojis e espaços)
    col_map = {}
    for c in df.columns:
        clean = re.sub(r'[^\w\s]', '', c).strip()
        col_map[c] = clean
    df = df.rename(columns=col_map)

    escolas = []
    escola_ids = {}  # nome -> uuid para usar nas fases seguintes

    for _, row in df.iterrows():
        nome = limpar_texto(row.get('Escola') or row.get(' Escola'))
        if not nome or nome in ('nan', 'Escola'): continue

        eid = str(uuid.uuid4())
        escola_ids[nome.upper()] = eid

        escolas.append({
            "id": eid,
            "nome": nome,
            "cnpj": limpar_texto(row.get('CNPJ')),
            "cidade": limpar_texto(row.get('Cidade')),
            "uf": limpar_texto(row.get('UF')),
            "endereco": limpar_texto(row.get('Endereo') or row.get('Endereco')),
            "bairro": limpar_texto(row.get('Bairro')),
            "cep": limpar_texto(row.get('CEP')),
            "qtd_alunos": limpar_int(row.get('Alunos')),
            "status_lead": limpar_texto(row.get('Status Lead') or row.get(' Status Lead')),
            "status_ciecc1": limpar_texto(row.get('Status 1 CIECC') or row.get('Status 1 CIECC')),
            "status_ciecc2": limpar_texto(row.get('Status 2026')),
            "origem": limpar_texto(row.get('Origem') or row.get('Fontes')),
            "observacoes": limpar_texto(row.get('Observaes') or row.get('Observações')),
            "rep_legal_nome": limpar_texto(row.get('Rep Legal') or row.get('Rep. Legal')),
            "rep_legal_email": limpar_email(row.get('Email Rep') or row.get('Email Rep.')),
            "rep_legal_tel": limpar_tel(row.get('Tel Rep') or row.get('Tel Rep.')),
        })

    total = batch_insert("leads_escola", escolas)
    print(f"  → {total} escolas importadas do CRM")
    return escola_ids


# ══════════════════════════════════════════════════════════════
# FASE 2 — Importar Pessoas e Participações dos Congressos
# ══════════════════════════════════════════════════════════════

def importar_congresso(arquivo_key: str, evento: str, escola_ids: dict):
    print(f"\n👥 Fase 2: Inscritos {evento}...")

    df = pd.read_excel(ARQUIVOS[arquivo_key], sheet_name=0)
    df.columns = [str(c).strip() for c in df.columns]

    # Coluna de nome da escola (varia entre planilhas)
    col_escola = next((c for c in df.columns if 'nome da sua institui' in c.lower()
                       or 'nome da sua escola' in c.lower()), None)
    col_tipo   = next((c for c in df.columns if 'tipo de sua inscri' in c.lower()), None)

    pessoas = []
    participacoes = []
    emails_vistos = {}  # email -> pessoa_id (deduplicação)

    for _, row in df.iterrows():
        nome = limpar_texto(row.get('Inscrito'))
        if not nome: continue

        email = limpar_email(row.get('Email'))

        # Deduplicar: se email já visto, reusar pessoa_id
        if email and email in emails_vistos:
            pessoa_id = emails_vistos[email]
        else:
            pessoa_id = str(uuid.uuid4())
            if email:
                emails_vistos[email] = pessoa_id

            # Escola vinculada
            escola_nome = limpar_texto(row.get(col_escola)) if col_escola else None
            escola_id = None
            if escola_nome:
                escola_id = escola_ids.get(escola_nome.upper())

            pessoas.append({
                "id": pessoa_id,
                "nome_completo": nome,
                "cpf": limpar_cpf(row.get('CPF')),
                "rg": limpar_texto(row.get('RG')),
                "email": email,
                "tel_celular": limpar_tel(row.get('Tel. Celular')),
                "tel_fixo": limpar_tel(row.get('Tel. Fixo')),
                "tel_comercial": limpar_tel(row.get('Tel. Comercial')),
                "sexo": limpar_texto(row.get('Sexo', ''))[:1] if limpar_texto(row.get('Sexo')) else None,
                "data_nascimento": limpar_data(row.get('Data Nascimento')),
                "endereco": limpar_texto(row.get('Endereço') or row.get('Endereco')),
                "bairro": limpar_texto(row.get('Bairro')),
                "cidade": limpar_texto(row.get('Cidade')),
                "uf": limpar_texto(row.get('UF')),
                "cep": limpar_texto(row.get('CEP')),
                "tipo_inscricao": limpar_texto(row.get(col_tipo)) if col_tipo else None,
                "cargo": limpar_texto(row.get('Cargo Original')),
                "escola_id": escola_id,
            })

        # Valor total — tenta as duas colunas possíveis
        valor = limpar_decimal(row.get('Valor Total Inscrição') or row.get('Valor Total'))
        lote = limpar_texto(row.get('Lote'))

        participacoes.append({
            "pessoa_id": pessoa_id,
            "escola_id": escola_ids.get((limpar_texto(row.get(col_escola)) or '').upper()),
            "evento": evento,
            "lote": lote,
            "modalidade": detectar_modalidade(lote or ''),
            "valor_lote": limpar_decimal(row.get('Valor Lote')),
            "valor_desconto": limpar_decimal(row.get('Valor do Desconto')),
            "valor_taxa": limpar_decimal(row.get('Valor Taxa')),
            "valor_total": valor,
            "forma_pagamento": limpar_texto(row.get('Forma de Pagamento')),
            "status_financeiro": limpar_texto(row.get('Status Financeiro')),
            "parcelas_pagas": limpar_int(row.get('Parcelas Pagas')),
            "total_parcelas": limpar_int(row.get('Total de Parcelas')),
            "regra_desconto": limpar_texto(row.get('Regra de Desconto')),
            "data_inscricao": limpar_data(row.get('Data Inscrição')),
            "fonte": limpar_texto(row.get('Fonte (Prover/Fórum)', 'Prover')),
            "participou_evento_anterior": str(row.get('Participou I Congresso?', 'Não')).strip().lower() in ('sim', 'yes', '1', 'true'),
        })

    p_total = batch_insert("leads_pessoa", pessoas)
    e_total = batch_insert("leads_participacao", participacoes)
    print(f"  → {p_total} pessoas, {e_total} participações ({evento})")
    return emails_vistos


# ══════════════════════════════════════════════════════════════
# FASE 3 — Importar Leads Oikos Live (aba 7 do CRM)
# ══════════════════════════════════════════════════════════════

def importar_oikos_live():
    print("\n🔥 Fase 3: Leads Oikos Live...")

    df_raw = pd.read_excel(ARQUIVOS["crm"], sheet_name=6, header=None)

    # Achar header
    header_row = 0
    for i, row in df_raw.iterrows():
        vals = [str(v) for v in row.values]
        if any('nome' in v.lower() or 'email' in v.lower() for v in vals):
            header_row = i
            break

    df = pd.read_excel(ARQUIVOS["crm"], sheet_name=6, header=header_row)
    df.columns = [str(c).strip() for c in df.columns]

    # Limpar nome (remove CPF concatenado no início)
    def limpar_nome_oikos(v):
        if pd.isna(v): return None
        s = str(v).strip()
        # Remove CPF no formato "XX.XXX.XXX " no início
        s = re.sub(r'^\d{2}\.\d{3}\.\d{3}\s+', '', s)
        s = re.sub(r'^\d{9,11}\s+', '', s)
        return s.strip() if s else None

    col_nome = next((c for c in df.columns if 'nome' in c.lower()), df.columns[0])
    col_email = next((c for c in df.columns if 'email' in c.lower()), None)
    col_tel = next((c for c in df.columns if 'tel' in c.lower()), None)
    col_data = next((c for c in df.columns if 'data' in c.lower()), None)

    oikos = []
    for _, row in df.iterrows():
        nome = limpar_nome_oikos(row.get(col_nome))
        if not nome: continue

        email_original = limpar_email(row.get(col_email))
        email_alt = limpar_email(row.get('Email Original'))
        email = email_original or email_alt

        tel_original = limpar_tel(row.get(col_tel))
        tel_alt = limpar_tel(row.get('Tel Original'))
        tel = tel_original or tel_alt

        oikos.append({
            "nome": nome,
            "email": email,
            "telefone": tel,
            "data_captacao": limpar_data(row.get(col_data)) if col_data else None,
        })

    total = batch_insert("leads_oikos_live", oikos)
    print(f"  → {total} leads Oikos Live importados")


# ══════════════════════════════════════════════════════════════
# FASE 4 — Contatos das Escolas (aba "1 · Todas as Escolas")
# ══════════════════════════════════════════════════════════════

def importar_contatos_escolas(escola_ids: dict):
    print("\n📞 Fase 4: Contatos das Escolas...")

    df_raw = pd.read_excel(ARQUIVOS["crm"], sheet_name=0, header=None)
    header_row = 0
    for i, row in df_raw.iterrows():
        vals = [str(v) for v in row.values if str(v) not in ('nan','None')]
        if any('Escola' in v or 'Contato' in v for v in vals):
            header_row = i
            break

    df = pd.read_excel(ARQUIVOS["crm"], sheet_name=0, header=header_row)
    df.columns = [str(c).strip() for c in df.columns]

    contatos = []
    for _, row in df.iterrows():
        nome_escola = limpar_texto(row.get('Escola') or row.get(' Escola'))
        if not nome_escola: continue
        escola_id = escola_ids.get(nome_escola.upper())
        if not escola_id: continue

        for i in range(1, 9):
            nome = limpar_texto(row.get(f'Contato {i}') or row.get(f' Contato {i}'))
            if not nome: continue
            cargo = limpar_texto(row.get(f'Cargo {i}'))
            tel   = limpar_tel(row.get(f'Tel {i}'))
            email = limpar_email(row.get(f'Email {i}'))

            if not any([cargo, tel, email]): continue

            contatos.append({
                "escola_id": escola_id,
                "nome": nome,
                "cargo": cargo,
                "telefone": tel,
                "email": email,
                "ordem": i,
            })

    total = batch_insert("leads_contato_escola", contatos)
    print(f"  → {total} contatos de escolas importados")


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("IMPORTAÇÃO DE LEADS CIECC → SUPABASE")
    print("=" * 60)

    try:
        # Fase 1: Escolas (base para vincular tudo)
        escola_ids = importar_escolas_crm()

        # Fase 2: Inscritos 2026
        emails_2026 = importar_congresso("ciecc_2026", "2_CIECC_2026", escola_ids)

        # Fase 2b: Inscritos 2025
        emails_2025 = importar_congresso("ciecc_2025", "1_CIECC_2025", escola_ids)

        # Fase 3: Oikos Live
        importar_oikos_live()

        # Fase 4: Contatos das escolas
        importar_contatos_escolas(escola_ids)

        print("\n" + "=" * 60)
        print("✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
