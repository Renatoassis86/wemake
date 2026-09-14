-- ============================================================
-- alunos_historico — registro append-only do número de alunos ao longo
-- da negociação de cada escola.
--
-- Contexto: o número de alunos de uma escola pode mudar durante a
-- negociação (cadastro inicial → proposta → contrato). Antes disso não
-- havia histórico: cada tabela (escolas, propostas, contratos) só guarda
-- o valor mais recente, sobrescrevendo o anterior. Esta tabela nunca é
-- atualizada, só recebe novas linhas — o valor original do formulário
-- de pré-cadastro fica preservado (populado pelo backfill abaixo) e cada
-- novo número registrado manualmente vira uma linha nova, mantendo a
-- linha do tempo completa.
-- ============================================================

CREATE TABLE IF NOT EXISTS alunos_historico (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id      UUID          NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  negociacao_id  UUID          REFERENCES negociacoes(id) ON DELETE SET NULL,
  valor          INTEGER       NOT NULL CHECK (valor >= 0),
  origem         TEXT          NOT NULL DEFAULT 'manual' CHECK (origem IN ('cadastro', 'proposta', 'manual')),
  observacao     TEXT,
  created_by     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alunos_historico_escola
  ON alunos_historico (escola_id, created_at DESC);

ALTER TABLE alunos_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alunos_historico_select ON public.alunos_historico;
DROP POLICY IF EXISTS alunos_historico_insert ON public.alunos_historico;

-- Mesma lógica de visibilidade de registros/negociações: gerente/supervisor
-- vê tudo, consultor/assistente vê o que é da escola que ele é responsável
-- ou que ainda não tem dono (pool). Sem UPDATE/DELETE — é um log, não se edita.
CREATE POLICY alunos_historico_select
  ON public.alunos_historico FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = alunos_historico.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY alunos_historico_insert
  ON public.alunos_historico FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = alunos_historico.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

-- ─── Backfill: preserva o número original (cadastro) de cada escola já
-- existente como a primeira linha do histórico, na data de criação da
-- escola — só roda pra escola que ainda não tem nenhuma linha, então é
-- seguro rodar este arquivo de novo sem duplicar.
INSERT INTO alunos_historico (escola_id, valor, origem, created_at)
SELECT e.id, e.total_alunos, 'cadastro', e.created_at
FROM escolas e
WHERE e.total_alunos IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM alunos_historico h WHERE h.escola_id = e.id
  );
