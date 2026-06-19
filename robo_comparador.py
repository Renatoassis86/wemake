"""
Robo de Comparacao: Local vs Producao
Compara as paginas do projeto local com o site em comercial.wemake.tec.br
"""

import asyncio
import os
import sys
import json
from datetime import datetime
from playwright.async_api import async_playwright, Page

# Garante saida UTF-8 no Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL  = "https://comercial.wemake.tec.br"
EMAIL     = "renato086@gmail.com"
PASSWORD  = "admin123"
SCREENSHOT_DIR = "robo_screenshots"

# Páginas esperadas no projeto (rota_live -> descricao)
PAGES = [
    # Públicas
    ("/login",            "Login",                     False),
    ("/formulario",       "Formulário de Escola",      False),
    ("/formulario/obrigado", "Formulário - Obrigado",  False),

    # Autenticadas (dashboard)
    ("/comercial",               "Dashboard Comercial",       True),
    ("/comercial/escolas",       "Gestão de Escolas",         True),
    ("/comercial/pipeline",      "Pipeline Kanban",           True),
    ("/comercial/registros",     "Registros de Interações",   True),
    ("/comercial/leads",         "Leads",                     True),
    ("/comercial/metas",         "Metas",                     True),
    ("/comercial/tabela",        "Tabela Geral",              True),
    ("/comercial/jornada",       "Jornada de Relacionamento", True),
    ("/comercial/jornada-visual","Jornada Visual",            True),
    ("/comercial/contratos",     "Contratos Comercial",       True),
    ("/comercial/pre-cadastros", "Pré-Cadastros",             True),
    ("/agenda",                  "Agenda",                    True),
    ("/calculadora",             "Calculadora",               True),
    ("/sobre",                   "Sobre",                     True),
    ("/exports",                 "Exports / Downloads",       True),
    ("/financeiro",              "Financeiro",                True),
    ("/dashboards",              "Dashboards",                True),
    ("/tutorial",                "Tutorial",                  True),
    ("/adminpanel",              "Admin Panel",               True),
    ("/ai-bob",                  "AI Bob",                    True),
    ("/leads-banco",             "Banco de Leads",            True),
    ("/pesquisa-mercado",        "Pesquisa de Mercado",       True),
    ("/transcricoes",            "Transcrições",              True),
    ("/estoque",                 "Estoque",                   True),
    ("/importacao",              "Importação",                True),
    ("/formularios",             "Formulários",               True),
    ("/contratos",               "Contratos",                 True),

    # Hub externo
    ("/hub/comercial/login",  "Hub Comercial Login", False),
    ("/hub/contratos/login",  "Hub Contratos Login", False),
    ("/hub/pedidos/login",    "Hub Pedidos Login",   False),
]

# ── Textos-chave esperados por página (para verificar conteúdo) ──────────────
EXPECTED_CONTENT = {
    "/login": [
        "Entrar na Plataforma",
        "Acesso Restrito",
        "Equipe We Make",
        "Formulário",
    ],
    "/comercial": [
        "Dashboard Comercial",
        "Total de Escolas",
        "Leads Quentes",
        "Registros",
    ],
    "/comercial/escolas": ["Escolas"],
    "/comercial/pipeline": ["Pipeline"],
    "/comercial/registros": ["Registros"],
    "/comercial/leads": ["Leads"],
    "/comercial/metas": ["Metas"],
    "/comercial/tabela": ["Tabela"],
    "/comercial/jornada": ["Jornada"],
    "/comercial/jornada-visual": ["Jornada"],
    "/calculadora": ["Calculadora"],
    "/sobre": ["Sobre", "We Make"],
    "/formulario": ["Formulário", "escola"],
    "/agenda": ["Agenda"],
    "/exports": ["Export", "Download", "Relatório"],
}

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def slug(path: str) -> str:
    return path.strip("/").replace("/", "_") or "home"

async def check_page(page: Page, path: str, desc: str, logged_in: bool):
    url = BASE_URL + path
    result = {
        "path": path,
        "desc": desc,
        "url": url,
        "requires_auth": logged_in,
        "status": "OK",
        "http_status": None,
        "redirected_to": None,
        "title": None,
        "content_checks": [],
        "errors": [],
        "screenshot": None,
    }

    try:
        response = await page.goto(url, wait_until="networkidle", timeout=20000)
        result["http_status"] = response.status if response else None

        # Verifica se foi redirecionado para o login (página autenticada sem sessão)
        final_url = page.url
        if final_url != url and "/login" in final_url and path != "/login":
            result["redirected_to"] = final_url
            result["status"] = "REDIRECT_TO_LOGIN"

        result["title"] = await page.title()

        # Checa textos esperados
        expected = EXPECTED_CONTENT.get(path, [])
        body_text = await page.inner_text("body")
        for text in expected:
            found = text.lower() in body_text.lower()
            result["content_checks"].append({"text": text, "found": found})
            if not found:
                result["errors"].append(f"Texto não encontrado: '{text}'")

        # Checa erros visíveis na página
        for err_keyword in ["404", "500", "Error", "não encontrado", "not found", "Erro interno"]:
            if err_keyword.lower() in body_text[:500].lower():
                result["errors"].append(f"Possível erro na página: '{err_keyword}' detectado")

        # Screenshot
        shot_path = os.path.join(SCREENSHOT_DIR, f"{slug(path)}.png")
        await page.screenshot(path=shot_path, full_page=False)
        result["screenshot"] = shot_path

        if result["errors"] and result["status"] == "OK":
            result["status"] = "ALERTA"

    except Exception as e:
        result["status"] = "ERRO"
        result["errors"].append(str(e))

    return result

async def main():
    print(f"\n{'='*60}")
    print("   ROBO COMPARADOR - We Make Comercial")
    print(f"   {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"{'='*60}\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="pt-BR",
        )
        page = await context.new_page()

        # ── 1. Páginas PÚBLICAS (sem login) ──────────────────────────
        print("[ 1/3 ] Verificando páginas públicas...\n")
        public_pages = [(p, d, a) for p, d, a in PAGES if not a]
        for path, desc, auth in public_pages:
            print(f"  -> {path}  ({desc})")
            r = await check_page(page, path, desc, auth)
            results.append(r)
            status_icon = "[OK]" if r["status"] == "OK" else ("[!]" if r["status"] == "ALERTA" else "[X]")
            print(f"     {status_icon} {r['status']}  |  HTTP {r['http_status']}  |  {r['title'] or '-'}")
            for e in r["errors"]:
                print(f"       AVISO: {e}")

        # ── 2. Login ─────────────────────────────────────────────────
        print(f"\n[ 2/3 ] Fazendo login em {BASE_URL}/login ...\n")
        await page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        await asyncio.sleep(1)

        # Preenche os campos
        await page.fill('input[type="email"]', EMAIL)
        await asyncio.sleep(0.3)
        await page.fill('input[type="password"]', PASSWORD)
        await asyncio.sleep(0.3)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "_login_before.png"))

        # Clica em submit e aguarda navegacao
        await page.click('button[type="submit"]')

        # Aguarda ate 10 segundos pela navegacao para fora do /login
        try:
            await page.wait_for_url(lambda url: "/login" not in url, timeout=10000)
        except Exception:
            pass  # Pode ter falhado ou ficado no login

        await asyncio.sleep(2)

        login_url = page.url
        # Salva screenshot do estado pos-login (com erro ou sucesso)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "_login_after.png"))

        if "/login" in login_url:
            # Tenta ler mensagem de erro da pagina
            try:
                body = await page.inner_text("body")
                error_lines = [l.strip() for l in body.split("\n") if "inva" in l.lower() or "erro" in l.lower() or "senha" in l.lower()]
                print("  [X] FALHA NO LOGIN")
                print(f"    URL atual: {login_url}")
                if error_lines:
                    print(f"    Mensagem na pagina: {error_lines[0]}")
                print("    Screenshot salva em: robo_screenshots/_login_after.png")
            except:
                print("  [X] FALHA NO LOGIN - nao foi possivel ler mensagem de erro")
            print("\n  ATENCAO: As paginas autenticadas serao verificadas sem login.")
            print("           Os resultados mostram o que um usuario NAO autenticado ve.\n")
            # Continua mesmo sem login para registrar os redirects
        else:
            print(f"  Login OK - redirecionado para: {login_url}")

        # ── 3. Páginas AUTENTICADAS ───────────────────────────────────
        print(f"\n[ 3/3 ] Verificando {len([p for p in PAGES if p[2]])} páginas autenticadas...\n")
        auth_pages = [(p, d, a) for p, d, a in PAGES if a]
        for path, desc, auth in auth_pages:
            print(f"  -> {path}  ({desc})")
            r = await check_page(page, path, desc, auth)
            results.append(r)
            status_icon = "[OK]" if r["status"] == "OK" else ("[!]" if r["status"] == "ALERTA" else "[X]")
            print(f"     {status_icon} {r['status']}  |  HTTP {r['http_status']}  |  {r['title'] or '-'}")
            if r["redirected_to"]:
                print(f"       Redirecionou para: {r['redirected_to']}")
            for e in r["errors"]:
                print(f"       AVISO: {e}")

        await browser.close()

    # ── Gera relatório ────────────────────────────────────────────────────────
    gera_relatorio(results)

def gera_relatorio(results):
    ok      = [r for r in results if r["status"] == "OK"]
    alertas = [r for r in results if r["status"] == "ALERTA"]
    erros   = [r for r in results if r["status"] in ("ERRO", "REDIRECT_TO_LOGIN")]

    print(f"\n{'='*60}")
    print("   RESUMO FINAL")
    print(f"{'='*60}")
    print(f"  Total de paginas verificadas : {len(results)}")
    print(f"  [OK] OK                      : {len(ok)}")
    print(f"  [!]  Com alertas             : {len(alertas)}")
    print(f"  [X]  Com erros/inacessiveis  : {len(erros)}")

    if alertas:
        print(f"\n  ALERTAS:")
        for r in alertas:
            print(f"    [!] {r['path']} ({r['desc']})")
            for e in r["errors"]:
                print(f"       - {e}")

    if erros:
        print(f"\n  ERROS:")
        for r in erros:
            print(f"    [X] {r['path']} ({r['desc']}) - {r['status']}")
            if r["redirected_to"]:
                print(f"       Redirecionou para: {r['redirected_to']}")
            for e in r["errors"]:
                print(f"       - {e}")

    # Salva JSON completo
    json_path = "robo_resultado.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "gerado_em": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "resumo": {"total": len(results), "ok": len(ok), "alertas": len(alertas), "erros": len(erros)},
            "paginas": results,
        }, f, ensure_ascii=False, indent=2)

    # Salva relatório HTML
    html_path = "robo_resultado.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(gera_html(results, ok, alertas, erros))

    print(f"\n  Relatório HTML  → {html_path}")
    print(f"  Dados JSON      → {json_path}")
    print(f"  Screenshots     → {SCREENSHOT_DIR}/")
    print(f"\n{'='*60}\n")

def gera_html(results, ok, alertas, erros):
    rows = ""
    for r in results:
        if r["status"] == "OK":
            cor = "#d1fae5"; icone = "✓"
        elif r["status"] == "ALERTA":
            cor = "#fef3c7"; icone = "⚠"
        else:
            cor = "#fee2e2"; icone = "✗"

        checks_html = ""
        for c in r.get("content_checks", []):
            found_icon = "✓" if c["found"] else "✗"
            found_color = "#059669" if c["found"] else "#dc2626"
            checks_html += f'<span style="color:{found_color};margin-right:6px">{found_icon} {c["text"]}</span>'

        errs_html = ""
        for e in r["errors"]:
            errs_html += f'<div style="color:#b91c1c;font-size:12px">⚠ {e}</div>'

        redir = f'<div style="font-size:11px;color:#6b7280">→ {r["redirected_to"]}</div>' if r["redirected_to"] else ""

        shot = ""
        if r.get("screenshot"):
            shot_file = os.path.basename(r["screenshot"])
            shot = f'<a href="{SCREENSHOT_DIR}/{shot_file}" target="_blank" style="font-size:11px;color:#6366f1">📷 ver</a>'

        rows += f"""
        <tr style="background:{cor}">
          <td style="padding:8px 12px;font-family:monospace;font-size:13px">{icone} {r['path']}</td>
          <td style="padding:8px 12px;font-size:13px">{r['desc']}</td>
          <td style="padding:8px 12px;font-size:13px">{r['http_status'] or '—'}</td>
          <td style="padding:8px 12px;font-size:13px">{r['title'] or '—'}</td>
          <td style="padding:8px 12px;font-size:12px">{checks_html}</td>
          <td style="padding:8px 12px">{errs_html}{redir}</td>
          <td style="padding:8px 12px">{shot}</td>
        </tr>"""

    total  = len(results)
    n_ok   = len(ok)
    n_aler = len(alertas)
    n_err  = len(erros)
    when   = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Robô Comparador — We Make Comercial</title>
<style>
  body {{ font-family: system-ui, sans-serif; background:#f8fafc; margin:0; padding:20px }}
  h1 {{ color:#0f172a; margin-bottom:4px }}
  .sub {{ color:#64748b; font-size:14px; margin-bottom:24px }}
  .stats {{ display:flex; gap:16px; margin-bottom:24px }}
  .stat {{ background:#fff; border-radius:10px; padding:16px 20px; box-shadow:0 1px 4px rgba(0,0,0,.08); min-width:120px }}
  .stat .num {{ font-size:2rem; font-weight:700; line-height:1 }}
  .stat .lbl {{ font-size:12px; color:#64748b; margin-top:4px }}
  table {{ width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.08) }}
  th {{ background:#0f172a; color:#fff; padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.05em }}
  td {{ border-bottom:1px solid #f1f5f9; vertical-align:top }}
</style>
</head>
<body>
<h1>Robô Comparador — We Make Comercial</h1>
<div class="sub">Gerado em {when} · {BASE_URL}</div>
<div class="stats">
  <div class="stat"><div class="num">{total}</div><div class="lbl">Páginas verificadas</div></div>
  <div class="stat"><div class="num" style="color:#059669">{n_ok}</div><div class="lbl">✓ OK</div></div>
  <div class="stat"><div class="num" style="color:#d97706">{n_aler}</div><div class="lbl">⚠ Alertas</div></div>
  <div class="stat"><div class="num" style="color:#dc2626">{n_err}</div><div class="lbl">✗ Erros</div></div>
</div>
<table>
<thead>
  <tr>
    <th>Rota</th><th>Descrição</th><th>HTTP</th><th>Título da página</th><th>Conteúdo esperado</th><th>Observações</th><th>Screenshot</th>
  </tr>
</thead>
<tbody>
{rows}
</tbody>
</table>
</body>
</html>"""

asyncio.run(main())
