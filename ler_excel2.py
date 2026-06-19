"""Le todas as celulas da aba Calculadora_v3 e Comodato_final sem limite"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import openpyxl

ARQUIVO = r"C:\Users\Renato\Desktop\projetos_wemake\app_comercial_We Make\Régua_de_Parceria_2026_-_We_Make_v4 (2).xlsm"
wb = openpyxl.load_workbook(ARQUIVO, read_only=False, data_only=False, keep_vba=True)

for sheet_name in ["Calculadora_v3", "Comodato_final"]:
    ws = wb[sheet_name]
    print()
    print("=" * 70)
    print(f"ABA: {sheet_name}  — TODAS AS CELULAS")
    print("=" * 70)
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is None:
                continue
            print(f"  {cell.coordinate:8s}  {str(cell.value)[:200]}")

wb.close()
