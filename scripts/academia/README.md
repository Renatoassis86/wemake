# Conteúdo da Academia We Make

As páginas de `/academia` são geradas a partir dos documentos da pasta `Academia_wemake`
(textos integrais, sem resumo). Para regerar depois de trocar um documento:

```bash
python scripts/academia/extract.py   # .docx e .pdf  -> src/content/academia/*.json (bruto)
python scripts/academia/xl.py        # planilhas 3.1 e 8 (Docs Diagramados) -> JSON
python scripts/academia/normalize.py # estrutura final (seções, formulários, tabelas)
```

Requer `pymupdf` e `openpyxl`. Os caminhos de origem estão no topo de cada script.
O metadado de cada página (título, ordem, marcos do Painel) fica em `src/lib/academia.ts`.
