-- Anexos por cartão e por escola no Ciclo Anual — memória do processo: doc,
-- PDF, foto, vídeo, o que for relevante sobre como aquela etapa aconteceu
-- naquela escola específica. Usa o mesmo bucket "documentos-oficiais" já
-- usado pelos outros anexos do Comercial (contratos, propostas).
CREATE TABLE IF NOT EXISTS academia_cronograma_anexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES academia_cronograma_cards(id) ON DELETE CASCADE,
  escola_id   UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  path        TEXT NOT NULL,
  tipo        TEXT,
  tamanho     INTEGER,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cronograma_anexos_card_escola ON academia_cronograma_anexos(card_id, escola_id);

ALTER TABLE academia_cronograma_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY cronograma_anexos_select
  ON academia_cronograma_anexos FOR SELECT
  TO authenticated
  USING (true);

-- Escrita só pelo service role (mesmo padrão de academia_cronograma_status).
