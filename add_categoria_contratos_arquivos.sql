-- Adiciona uma categoria aos arquivos anexados em contratos_arquivos, pra
-- diferenciar o PDF da proposta comercial (anexado manualmente quando a
-- escola não tem proposta gerada pela Calculadora) dos demais documentos do
-- contrato já suportados hoje (minuta, contrato assinado etc.).
-- Linhas existentes continuam classificadas como 'contrato' (comportamento
-- inalterado); só uploads novos feitos pelo botão de anexar proposta usam
-- categoria = 'proposta'.

ALTER TABLE contratos_arquivos
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'contrato';

-- O bucket "documentos-oficiais" (usado por ContratoUpload.tsx e agora
-- também por AnexarPropostaPdf.tsx) nunca foi criado em produção — por isso
-- contratos_arquivos está vazia até hoje, o upload de contrato nunca
-- funcionou de fato. Cria o bucket público, com o mesmo limite de 20MB já
-- validado no client, aceitando PDF/Word/imagem.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-oficiais',
  'documentos-oficiais',
  true,
  20971520,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Policies mínimas: qualquer usuário autenticado pode enviar/ler/remover
-- arquivos neste bucket (mesmo padrão de acesso já usado nas tabelas do
-- funil — controle é por papel dentro do app, não por policy de storage
-- granular por escola).
DROP POLICY IF EXISTS "documentos-oficiais: authenticated select" ON storage.objects;
CREATE POLICY "documentos-oficiais: authenticated select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos-oficiais' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "documentos-oficiais: authenticated insert" ON storage.objects;
CREATE POLICY "documentos-oficiais: authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos-oficiais' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "documentos-oficiais: authenticated delete" ON storage.objects;
CREATE POLICY "documentos-oficiais: authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos-oficiais' AND auth.role() = 'authenticated');

-- contratos_arquivos também nunca teve policy de INSERT liberada pro client
-- comum (confirmado: 42501 row-level security policy) — é por isso que a
-- tabela está vazia até hoje, apesar do upload em ContratoUpload.tsx já
-- existir. SELECT já funciona (RLS permite), só faltava o INSERT.
DROP POLICY IF EXISTS "contratos_arquivos: authenticated insert" ON contratos_arquivos;
CREATE POLICY "contratos_arquivos: authenticated insert"
  ON contratos_arquivos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
