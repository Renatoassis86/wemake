-- ============================================================
-- RLS — Políticas de segurança do CRM
--
-- Modelo:
--   Gerente/supervisor   → vê e edita tudo
--   Consultor/Assistente → vê escolas onde é responsavel_id OU sem dono (pool)
--                          vê registros/negociações/contratos da escola que pode ver
--   Leads_universal      → todos autenticados (free pool)
--   Profiles             → todos autenticados leem; usuário edita o próprio
--   Audit_log            → só gerente/supervisor
--   Agenda               → criador + participantes
--
-- IMPORTANTE: as policies não bloqueiam o service_role (admin no servidor).
-- ============================================================

-- ─── 1) FUNÇÃO HELPER ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_gerente_or_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('gerente','supervisor')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_gerente_or_supervisor() TO authenticated, anon;

-- ─── 2) DROPA TODAS AS POLICIES ANTIGAS (para re-rodar idempotente) ───
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','escolas','registros','negociacoes','contratos',
                        'formularios','leads_universal','agenda_eventos',
                        'agenda_participantes','audit_log')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- ============================================================
-- PROFILES
-- Todos autenticados leem (necessário para JOIN de responsavel_nome).
-- Usuário pode editar o próprio. Gerente pode editar qualquer um.
-- ============================================================
CREATE POLICY profiles_select_all
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY profiles_update_own_or_admin
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_gerente_or_supervisor())
  WITH CHECK (id = auth.uid() OR public.is_gerente_or_supervisor());

CREATE POLICY profiles_insert_admin
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_gerente_or_supervisor());

CREATE POLICY profiles_delete_admin
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- ============================================================
-- ESCOLAS
-- Gerente/supervisor: tudo
-- Consultor: vê onde é responsável OU responsavel_id IS NULL (pool)
-- Consultor pode INSERIR (precisa) e UPDATE só onde é responsável
-- Apenas gerente DELETA
-- ============================================================
CREATE POLICY escolas_select
  ON public.escolas FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR responsavel_id = auth.uid()
    OR responsavel_id IS NULL
  );

CREATE POLICY escolas_insert
  ON public.escolas FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- qualquer autenticado pode cadastrar

CREATE POLICY escolas_update
  ON public.escolas FOR UPDATE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR responsavel_id = auth.uid()
    OR responsavel_id IS NULL
  )
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR responsavel_id = auth.uid()
    OR responsavel_id IS NULL
  );

CREATE POLICY escolas_delete
  ON public.escolas FOR DELETE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- ============================================================
-- REGISTROS — herda visibilidade da escola
-- ============================================================
CREATE POLICY registros_select
  ON public.registros FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = registros.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY registros_insert
  ON public.registros FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = registros.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY registros_update
  ON public.registros FOR UPDATE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = registros.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY registros_delete
  ON public.registros FOR DELETE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = registros.escola_id AND e.responsavel_id = auth.uid()
    )
  );

-- ============================================================
-- NEGOCIACOES — mesma lógica
-- ============================================================
CREATE POLICY negociacoes_select
  ON public.negociacoes FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = negociacoes.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY negociacoes_insert
  ON public.negociacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = negociacoes.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY negociacoes_update
  ON public.negociacoes FOR UPDATE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = negociacoes.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY negociacoes_delete
  ON public.negociacoes FOR DELETE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = negociacoes.escola_id AND e.responsavel_id = auth.uid()
    )
  );

-- ============================================================
-- CONTRATOS — mesma lógica
-- ============================================================
CREATE POLICY contratos_select
  ON public.contratos FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = contratos.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY contratos_insert
  ON public.contratos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = contratos.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY contratos_update
  ON public.contratos FOR UPDATE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.escolas e
      WHERE e.id = contratos.escola_id
        AND (e.responsavel_id = auth.uid() OR e.responsavel_id IS NULL)
    )
  );

CREATE POLICY contratos_delete
  ON public.contratos FOR DELETE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- ============================================================
-- FORMULARIOS — não tem escola_id (são pré-cadastros).
-- Todos autenticados leem; só gerente edita/deleta.
-- ============================================================
CREATE POLICY formularios_select
  ON public.formularios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY formularios_insert_public
  ON public.formularios FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);  -- formulário público pode submeter

CREATE POLICY formularios_update_admin
  ON public.formularios FOR UPDATE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

CREATE POLICY formularios_delete_admin
  ON public.formularios FOR DELETE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- ============================================================
-- LEADS_UNIVERSAL — pool aberto (todos veem/mexem; só gerente deleta)
-- ============================================================
CREATE POLICY leads_select
  ON public.leads_universal FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY leads_insert
  ON public.leads_universal FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY leads_update
  ON public.leads_universal FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY leads_delete_admin
  ON public.leads_universal FOR DELETE
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- ============================================================
-- AGENDA_EVENTOS — criador + participantes veem; criador edita
-- ============================================================
CREATE POLICY agenda_eventos_select
  ON public.agenda_eventos FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agenda_participantes ap
      WHERE ap.evento_id = agenda_eventos.id AND ap.profile_id = auth.uid()
    )
  );

CREATE POLICY agenda_eventos_insert
  ON public.agenda_eventos FOR INSERT
  TO authenticated
  WITH CHECK (criado_por = auth.uid());

CREATE POLICY agenda_eventos_update
  ON public.agenda_eventos FOR UPDATE
  TO authenticated
  USING (criado_por = auth.uid() OR public.is_gerente_or_supervisor());

CREATE POLICY agenda_eventos_delete
  ON public.agenda_eventos FOR DELETE
  TO authenticated
  USING (criado_por = auth.uid() OR public.is_gerente_or_supervisor());

-- ============================================================
-- AGENDA_PARTICIPANTES — quem está no evento vê; criador do evento edita
-- ============================================================
CREATE POLICY agenda_participantes_select
  ON public.agenda_participantes FOR SELECT
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agenda_eventos e
      WHERE e.id = agenda_participantes.evento_id AND e.criado_por = auth.uid()
    )
  );

CREATE POLICY agenda_participantes_insert
  ON public.agenda_participantes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.agenda_eventos e
      WHERE e.id = agenda_participantes.evento_id AND e.criado_por = auth.uid()
    )
  );

CREATE POLICY agenda_participantes_update
  ON public.agenda_participantes FOR UPDATE
  TO authenticated
  USING (
    profile_id = auth.uid()  -- próprio participante pode mudar status
    OR public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.agenda_eventos e
      WHERE e.id = agenda_participantes.evento_id AND e.criado_por = auth.uid()
    )
  );

CREATE POLICY agenda_participantes_delete
  ON public.agenda_participantes FOR DELETE
  TO authenticated
  USING (
    public.is_gerente_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.agenda_eventos e
      WHERE e.id = agenda_participantes.evento_id AND e.criado_por = auth.uid()
    )
  );

-- ============================================================
-- AUDIT_LOG — só gerente/supervisor lê. Insert via trigger (service_role).
-- ============================================================
CREATE POLICY audit_log_select_admin
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_gerente_or_supervisor());

-- (sem policy de INSERT/UPDATE/DELETE → ninguém via API consegue mexer.
--  Apenas o service_role conseguirá, o que é o esperado.)

-- ============================================================
-- Recarrega cache do PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
