-- ============================================================
-- SEGURANÇA: Configuração de RLS e Políticas de Acesso
-- Preparação para Deploy (V1)
-- ============================================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE supervisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carga_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_trocas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_estoque ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas existentes (para permitir re-execução do script)
-- Limpamos nomes antigos e variações (incluindo em português da mensagem de erro)
DROP POLICY IF EXISTS "Public access to verify login" ON supervisores;
DROP POLICY IF EXISTS "Verify supervisor login" ON supervisores;
DROP POLICY IF EXISTS "Verificar login supervisor" ON supervisores;
DROP POLICY IF EXISTS "Public access to verify login" ON usuarios_estoque;
DROP POLICY IF EXISTS "Verify stock login" ON usuarios_estoque;
DROP POLICY IF EXISTS "Public select for authenticated app context" ON tecnicos;
DROP POLICY IF EXISTS "Read technicians" ON tecnicos;
DROP POLICY IF EXISTS "Public select for authenticated app context" ON carga_tecnicos;
DROP POLICY IF EXISTS "Read technician load" ON carga_tecnicos;
DROP POLICY IF EXISTS "Public access for exchanges" ON historico_trocas;
DROP POLICY IF EXISTS "Handle exchange history" ON historico_trocas;

-- 3. POLÍTICAS PARA 'supervisores' e 'usuarios_estoque'
-- Permitimos SELECT para anon, o filtro de senha é feito no client ou RPC.
CREATE POLICY "Verify supervisor login" ON supervisores 
FOR SELECT TO anon 
USING (true);

CREATE POLICY "Verify stock login" ON usuarios_estoque 
FOR SELECT TO anon 
USING (true);

-- 4. POLÍTICAS PARA TÉCNICOS E CARGA
CREATE POLICY "Read technicians" ON tecnicos FOR SELECT TO anon USING (true);
CREATE POLICY "Read technician load" ON carga_tecnicos FOR SELECT TO anon USING (true);

-- 5. POLÍTICAS PARA HISTÓRICO DE TROCAS
CREATE POLICY "Handle exchange history" ON historico_trocas 
FOR ALL TO anon 
USING (true)
WITH CHECK (true);

-- 6. FUNÇÃO DE LOGIN SEGURA (RPC)
CREATE OR REPLACE FUNCTION login_supervisor(p_matricula TEXT, p_senha TEXT)
RETURNS TABLE (id UUID, matricula TEXT, nome TEXT, setor TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.matricula, s.nome, s.setor
    FROM supervisores s
    WHERE s.matricula = p_matricula AND s.senha = p_senha
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION login_estoque(p_matricula TEXT, p_senha TEXT)
RETURNS TABLE (id UUID, matricula TEXT, nome TEXT, cargo TEXT, ativo BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.matricula, u.nome, u.cargo, u.ativo
    FROM usuarios_estoque u
    WHERE u.matricula = p_matricula AND u.senha = p_senha AND u.ativo = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
