-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informações básicas
  email VARCHAR(255) NOT NULL UNIQUE,
  nome_completo VARCHAR(255),
  foto_perfil VARCHAR(500),

  -- Informações de empresa/escola
  empresa_id UUID,
  escola_id UUID,
  departamento VARCHAR(100),
  cargo VARCHAR(100),

  -- Status e permissões
  ativo BOOLEAN DEFAULT true,
  role VARCHAR(50) DEFAULT 'usuario', -- 'admin', 'gerente', 'vendedor', 'usuario'
  permissoes JSONB DEFAULT '{}',

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,

  -- Índices para performance
  CONSTRAINT usuarios_email_unique UNIQUE (email)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Permitir que usuários vejam apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id);

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON usuarios
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir que admins vejam todos os usuários
CREATE POLICY "Admins podem ver todos os usuários" ON usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_timestamp_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_timestamp_usuarios
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_timestamp_usuarios();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role, ativo)
  VALUES (NEW.id, NEW.email, 'usuario', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_perfil_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_usuario();

-- Insertar o usuário renato086@gmail.com na tabela usuarios
-- (O ID será o mesmo do auth.users)
-- Este SQL será executado manualmente após a criação do usuário no auth
INSERT INTO public.usuarios (id, email, nome_completo, role, ativo)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'renato086@gmail.com'),
  'renato086@gmail.com',
  'Renato Silva de Assis',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET role = 'admin', ativo = true;

-- Conceder permissões ao usuário autenticado
GRANT SELECT ON usuarios TO authenticated;
GRANT UPDATE ON usuarios TO authenticated;
