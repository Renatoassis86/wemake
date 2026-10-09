-- Status por escola de cada cartão do Ciclo Anual. academia_cronograma_cards
-- continua sendo o "molde" (título, janela de referência, descrição, momento);
-- esta tabela guarda o andamento real de UMA escola específica naquele
-- cartão — status de execução, prazo (editável, já que pode variar por
-- escola) e anotações. Uma linha só existe depois que alguém mexe no cartão
-- para aquela escola; sem linha = "Não iniciado" por padrão na tela.
CREATE TABLE IF NOT EXISTS academia_cronograma_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES academia_cronograma_cards(id) ON DELETE CASCADE,
  escola_id   UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'Não iniciado'
              CHECK (status IN ('Não iniciado', 'Em andamento', 'Aguardando escola', 'Aguardando We Make', 'Concluído', 'Bloqueado')),
  prazo_data  DATE,
  anotacoes   TEXT NOT NULL DEFAULT '',
  updated_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_id, escola_id)
);

CREATE INDEX IF NOT EXISTS idx_cronograma_status_escola ON academia_cronograma_status(escola_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_status_prazo ON academia_cronograma_status(escola_id, prazo_data) WHERE status <> 'Concluído';

ALTER TABLE academia_cronograma_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY cronograma_status_select
  ON academia_cronograma_status FOR SELECT
  TO authenticated
  USING (true);

-- Escrita só pelo service role (mesmo padrão de academia_cronograma_cards).

-- Status padrão do cartão: aplica a TODAS as escolas automaticamente — quem
-- marca "contratos enviados" como Concluído aqui não precisa repetir escola
-- por escola, e qualquer escola nova cadastrada depois já nasce com esse
-- status. Uma linha em academia_cronograma_status é a EXCEÇÃO de uma escola
-- específica (ela some do padrão); sem linha, a escola usa o padrão do cartão.
ALTER TABLE academia_cronograma_cards
  ADD COLUMN IF NOT EXISTS status_padrao TEXT NOT NULL DEFAULT 'Não iniciado'
  CHECK (status_padrao IN ('Não iniciado', 'Em andamento', 'Aguardando escola', 'Aguardando We Make', 'Concluído', 'Bloqueado'));
