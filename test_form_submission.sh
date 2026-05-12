#!/bin/bash

# Complete test form data with all required fields
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "resp_email": "test@school.com",
    "razao_social": "Escola de Teste LTDA",
    "nome_fantasia": "Escola Teste",
    "cnpj": "12345678000190",
    "rua": "Rua Principal",
    "numero": "100",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310100",
    "email_institucional": "escola@teste.com",
    "telefone": "1133334444",
    "seg_infantil": true,
    "seg_fundamental_1": true,
    "seg_fundamental_2": false,
    "seg_ensino_medio": false,
    "qtd_infantil": 50,
    "qtd_fundamental_1": 80,
    "qtd_fundamental_2": 0,
    "qtd_ensino_medio": 0,
    "legal_nome": "João Silva",
    "legal_email": "joao@teste.com",
    "legal_rua": "Rua Secundária",
    "legal_numero": "200",
    "legal_bairro": "Vila",
    "legal_cidade": "São Paulo",
    "legal_estado": "SP",
    "legal_cep": "01310100",
    "fin_email_cobranca": "financeiro@teste.com"
  }'
