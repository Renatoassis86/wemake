-- Cartões editáveis do Ciclo Anual da Academia (Conhecer/Explorar/Criar) — o
-- cronograma de pós-venda deixa de ser um documento estático e vira um módulo
-- dinâmico: dá para editar, apagar e adicionar novos cartões direto na tela.
-- Cada cartão pode (opcionalmente) estar ligado a um marco do Painel Mestre
-- (academia_implantacoes.marcos), para o verso do cartão mostrar o kanban real
-- de escolas naquela fase; cartões dos Pilares 2 e 3 ainda não têm marco
-- correspondente até a automação do Painel Mestre ser estendida para eles.
CREATE TABLE IF NOT EXISTS academia_cronograma_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  momento     TEXT NOT NULL CHECK (momento IN ('conhecer', 'explorar', 'criar')),
  ordem       INTEGER NOT NULL DEFAULT 0,
  titulo      TEXT NOT NULL,
  data_label  TEXT NOT NULL DEFAULT '',
  status_tag  TEXT NOT NULL DEFAULT 'sugerido' CHECK (status_tag IN ('dado', 'sugerido', 'decidido')),
  descricao   TEXT NOT NULL DEFAULT '',
  fonte       TEXT,
  marco       TEXT,              -- nome do marco em academia_implantacoes.marcos, quando aplicável
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cronograma_cards_momento ON academia_cronograma_cards(momento, ordem) WHERE ativo;

ALTER TABLE academia_cronograma_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY cronograma_cards_select
  ON academia_cronograma_cards FOR SELECT
  TO authenticated
  USING (true);

-- Escrita só pelo service role (mesmo padrão já usado em academia_tarefas,
-- academia_eventos etc. — o client comum não grava direto nessas tabelas).
