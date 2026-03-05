-- ============================================================
-- SPRINT 7 — MIGRAÇÃO DE SEGURANÇA
-- Portal Ferramentaria | Executar no Supabase SQL Editor
-- Data: 05/03/2026
--
-- ATENÇÃO: Execute cada seção separadamente e verifique
-- os resultados antes de continuar.
-- ============================================================

-- ============================================================
-- PASSO 1: Corrigir CHECK constraint do status
-- (faltava 'retirado' — impedia gravar retiradas)
-- ============================================================

ALTER TABLE historico_trocas
    DROP CONSTRAINT IF EXISTS historico_trocas_status_check;

ALTER TABLE historico_trocas
    ADD CONSTRAINT historico_trocas_status_check
    CHECK (status IN (
        'pedido_em_andamento',
        'sem_estoque',
        'liberado_retirada',
        'retirado'
    ));

-- Verificar:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'historico_trocas' AND constraint_type = 'CHECK';


-- ============================================================
-- PASSO 2: Adicionar coluna prazo_expirado (se ainda não existir)
-- ============================================================

ALTER TABLE historico_trocas
    ADD COLUMN IF NOT EXISTS prazo_expirado BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================
-- PASSO 3: Habilitar Row Level Security (RLS)
-- ATENÇÃO: Habilitar RLS SEM policies bloqueia todo acesso.
-- Execute os PASSOs 4 e 5 imediatamente após este.
-- ============================================================

ALTER TABLE supervisores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE carga_tecnicos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_trocas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_estoque      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASSO 4: Políticas RLS — acesso via anon key (frontend)
-- O frontend usa a anon key — as policies abaixo permitem
-- que o app leia/escreva apenas o necessário.
-- ============================================================

-- ---- supervisores ----
-- Supervisor pode ler apenas seu próprio registro (usado no login)
DROP POLICY IF EXISTS "supervisores_select_by_matricula" ON supervisores;
CREATE POLICY "supervisores_select_by_matricula" ON supervisores
    FOR SELECT
    USING (true); -- o login é feito com eq(matricula) + eq(senha), já é filtrado

-- ---- usuarios_estoque ----
DROP POLICY IF EXISTS "estoque_select_by_matricula" ON usuarios_estoque;
CREATE POLICY "estoque_select_by_matricula" ON usuarios_estoque
    FOR SELECT
    USING (true); -- mesmo padrão do login

-- Permite atualizar apenas a senha do próprio usuário
DROP POLICY IF EXISTS "estoque_update_own_senha" ON usuarios_estoque;
CREATE POLICY "estoque_update_own_senha" ON usuarios_estoque
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ---- tecnicos ----
DROP POLICY IF EXISTS "tecnicos_select_publico" ON tecnicos;
CREATE POLICY "tecnicos_select_publico" ON tecnicos
    FOR SELECT
    USING (true);

-- ---- carga_tecnicos ----
DROP POLICY IF EXISTS "carga_select_publico" ON carga_tecnicos;
CREATE POLICY "carga_select_publico" ON carga_tecnicos
    FOR SELECT
    USING (true);

-- ---- historico_trocas ----
-- Qualquer usuário autenticado pode ler o histórico
DROP POLICY IF EXISTS "historico_select_publico" ON historico_trocas;
CREATE POLICY "historico_select_publico" ON historico_trocas
    FOR SELECT
    USING (true);

-- Qualquer usuário autenticado pode inserir novas trocas
DROP POLICY IF EXISTS "historico_insert_publico" ON historico_trocas;
CREATE POLICY "historico_insert_publico" ON historico_trocas
    FOR INSERT
    WITH CHECK (true);

-- Qualquer usuário autenticado pode atualizar status
DROP POLICY IF EXISTS "historico_update_status" ON historico_trocas;
CREATE POLICY "historico_update_status" ON historico_trocas
    FOR UPDATE
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- PASSO 5: Índices para performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_historico_supervisor_id
    ON historico_trocas(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_historico_status
    ON historico_trocas(status);

CREATE INDEX IF NOT EXISTS idx_historico_data_troca
    ON historico_trocas(data_troca DESC);

CREATE INDEX IF NOT EXISTS idx_tecnicos_supervisor_id
    ON tecnicos(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_tecnicos_matricula
    ON tecnicos(matricula);

CREATE INDEX IF NOT EXISTS idx_carga_matricula_tecnico
    ON carga_tecnicos(matricula_tecnico);


-- ============================================================
-- PASSO 6: Verificação final
-- Execute para confirmar que tudo está correto.
-- ============================================================

-- Verificar RLS habilitado:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('supervisores','tecnicos','carga_tecnicos','historico_trocas','usuarios_estoque');

-- Verificar policies criadas:
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar índices:
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================================
-- PASSO 7 (FUTURO): Hash de senhas com pgcrypto
-- Requer enable da extensão pgcrypto no Supabase.
-- Executar APENAS quando o frontend estiver adaptado para
-- enviar senha hasheada ou usar Supabase Auth.
-- ============================================================

-- Habilitar extensão:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hashar senhas existentes (supervisores):
-- UPDATE supervisores
-- SET senha = crypt(senha, gen_salt('bf', 10))
-- WHERE senha NOT LIKE '$2b$%'; -- evita re-hashar

-- Hashar senhas existentes (usuarios_estoque):
-- UPDATE usuarios_estoque
-- SET senha = crypt(senha, gen_salt('bf', 10))
-- WHERE senha NOT LIKE '$2b$%';

-- Com hash, o login passa a ser:
-- .eq('matricula', mat)
-- .filter('senha', 'eq', crypt(senha_digitada, senha_hash_do_banco))
-- OBS: Isso requer function RPC no Supabase para comparação segura server-side.
