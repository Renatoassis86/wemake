-- Corrige is_gerente_or_supervisor() para consultar `usuarios` (tabela viva)
-- em vez de `profiles` (tabela legada, hoje vazia). Sem essa correção, a
-- função sempre retorna false, e todas as RLS policies de escolas/registros/
-- negociacoes/contratos caem no ramo restrito (só vê escolas onde é
-- responsavel_id, ou sem responsável) para QUALQUER usuário, inclusive
-- gerentes — cortando o Funil de Contratação e a página de Metas para um
-- recorte pequeno em vez da visão completa da empresa.
CREATE OR REPLACE FUNCTION public.is_gerente_or_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role IN ('gerente','supervisor') AND ativo = true
  );
$$;
