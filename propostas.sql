-- =============================================================
-- propostas table — We Make comercial app
-- =============================================================

CREATE TABLE IF NOT EXISTS propostas (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  token                 UUID          UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  escola_id             UUID          REFERENCES escolas(id) ON DELETE SET NULL,
  escola_nome           TEXT          NOT NULL,
  escola_logo_url       TEXT,
  escola_email          TEXT,
  escola_pin            TEXT          NOT NULL DEFAULT LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  tipo                  TEXT          NOT NULL DEFAULT 'curriculo'
                                        CHECK (tipo IN ('curriculo', 'curriculo_comodato')),
  validade              DATE          NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  num_alunos            INTEGER       NOT NULL DEFAULT 100,
  segmentos             INTEGER       NOT NULL DEFAULT 2,
  valor_aluno_ano       NUMERIC(10,2) NOT NULL DEFAULT 0,
  num_parcelas          INTEGER       NOT NULL DEFAULT 12,
  duracao_meses         INTEGER       NOT NULL DEFAULT 48,
  comodato_pv           NUMERIC(12,2),
  comodato_parcela      NUMERIC(10,2),
  comodato_retorno_pct  NUMERIC(6,2),
  comodato_tx_rate      NUMERIC(5,4),
  comodato_notebooks    INTEGER,
  dados_calculo         JSONB,
  texto_personalizado   TEXT,
  status                TEXT          NOT NULL DEFAULT 'ativa'
                                        CHECK (status IN ('ativa', 'expirada', 'aceita', 'recusada')),
  criado_por            UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  visualizacoes         INTEGER       NOT NULL DEFAULT 0,
  visualizado_em        TIMESTAMPTZ
);

-- -----------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- Authenticated users (team) can do everything
CREATE POLICY "authenticated manage propostas"
  ON propostas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anonymous users (schools, external viewers) can read by token
CREATE POLICY "anon read propostas by token"
  ON propostas
  FOR SELECT
  TO anon
  USING (true);

-- -----------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION propostas_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW
  EXECUTE FUNCTION propostas_set_updated_at();

-- -----------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_propostas_token ON propostas (token);
