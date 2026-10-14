-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Diagnóstico do Espaço Maker — PIN visível na tela do staff
--
-- Antes só o hash do PIN era guardado (nunca dava pra mostrar de novo na tela;
-- só gerando um PIN novo, que invalidava o que já tinha sido mandado pra
-- escola). O time pediu pra mensagem com link + PIN ficar sempre visível no
-- topo da página do diagnóstico, pra poder reenviar sem precisar gerar outro.
-- Como o PIN já é enviado em texto puro pra escola (WhatsApp/e-mail), guardar
-- também em texto puro aqui não abre brecha nova.
--
-- COMO APLICAR: Supabase → SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.academia_diagnosticos
  add column if not exists pin_atual text;
