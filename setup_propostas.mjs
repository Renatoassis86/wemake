// Setup script using only native fetch (no supabase client, no websocket)
const SUPABASE_URL = 'https://vpacgvqkrkzskrzpsydg.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWNndnFrcmt6c2tyenBzeWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjI2MCwiZXhwIjoyMDk0MTY4MjYwfQ.oQK6ILLnyu-MIC-J240rl26DIK7U84qGpCyrduO5DFU'

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
}

// ── 1. Check if table exists ──────────────────────────────────────────────────
console.log('Checking if propostas table exists...')
const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/propostas?select=id&limit=1`, { headers })
console.log('Table check status:', checkRes.status)

if (checkRes.status === 200) {
  console.log('✓ Table propostas already exists.')
} else {
  const checkBody = await checkRes.text()
  console.log('Table check response:', checkBody.slice(0, 200))

  if (checkRes.status === 404 || checkBody.includes('42P01') || checkBody.includes("doesn't exist")) {
    console.log('Table does not exist. Creating via SQL...')

    const SQL = `
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

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='propostas' AND policyname='authenticated manage propostas') THEN
    CREATE POLICY "authenticated manage propostas" ON propostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='propostas' AND policyname='anon read propostas by token') THEN
    CREATE POLICY "anon read propostas by token" ON propostas FOR SELECT TO anon USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION propostas_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_propostas_updated_at ON propostas;
CREATE TRIGGER trg_propostas_updated_at BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION propostas_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_propostas_token ON propostas (token);
`

    // Try Supabase pg-meta endpoint
    const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: SQL }),
    })
    const sqlBody = await sqlRes.text()
    console.log('exec_sql status:', sqlRes.status, '|', sqlBody.slice(0, 300))

    if (!sqlRes.ok) {
      console.log('\n⚠ Cannot create table via API. Please run this SQL in Supabase Dashboard > SQL Editor:')
      console.log('https://supabase.com/dashboard/project/vpacgvqkrkzskrzpsydg/sql/new')
      console.log('\n--- SQL TO RUN ---')
      console.log(SQL)
      console.log('--- END SQL ---\n')
    }
  } else {
    console.log('Unexpected error checking table:', checkRes.status)
  }
}

// ── 2. Create storage bucket ──────────────────────────────────────────────────
console.log('\nChecking storage bucket proposta-logos...')
const bucketsRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers })
const buckets = await bucketsRes.json()
console.log('Buckets list status:', bucketsRes.status)

if (bucketsRes.ok) {
  const exists = Array.isArray(buckets) && buckets.some(b => b.name === 'proposta-logos')
  if (exists) {
    console.log('✓ Bucket proposta-logos already exists.')
  } else {
    console.log('Creating bucket proposta-logos...')
    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'proposta-logos',
        name: 'proposta-logos',
        public: true,
        file_size_limit: 5 * 1024 * 1024,
        allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
      }),
    })
    const createBody = await createRes.text()
    if (createRes.ok || createBody.includes('already exists')) {
      console.log('✓ Bucket proposta-logos created (public, 5MB, images only).')
    } else {
      console.log('✗ Bucket error:', createRes.status, createBody.slice(0, 200))
    }
  }
} else {
  console.log('Could not list buckets:', bucketsRes.status, JSON.stringify(buckets).slice(0, 200))
}

console.log('\nDone.')
