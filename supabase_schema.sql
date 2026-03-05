-- TABELA DE SUPERVISORES
-- Apenas matrículas aqui podem logar no sistema.
CREATE TABLE IF NOT EXISTS supervisores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL, -- No mundo real, gerenciar via Supabase Auth
    setor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA DE TÉCNICOS
-- Vinculados a um supervisor específico.
CREATE TABLE IF NOT EXISTS tecnicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT,
    setor TEXT,
    status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo', 'ferias', 'afastado'
    supervisor_id UUID REFERENCES supervisores(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA DE CARGA (SALDO)
-- Itens vinculados aos técnicos.
CREATE TABLE IF NOT EXISTS carga_tecnicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tecnico_id UUID REFERENCES tecnicos(id) ON DELETE CASCADE,
    material_nome TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    patrimonio TEXT,
    data_atribuicao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HISTÓRICO DE TROCAS
-- Resumo detalhado de tudo que foi feito.
CREATE TABLE IF NOT EXISTS historico_trocas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID REFERENCES supervisores(id),
    supervisor_matricula TEXT,
    supervisor_nome TEXT,
    tecnico_id UUID REFERENCES tecnicos(id),
    tecnico_matricula TEXT,
    tecnico_nome TEXT,
    item_saida_nome TEXT NOT NULL,
    item_entrada_nome TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pedido_em_andamento'
        CHECK (status IN ('pedido_em_andamento', 'sem_estoque', 'liberado_retirada')),
    data_troca TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRAÇÃO: adicionar coluna status em tabela já existente (execute apenas 1x)
-- ALTER TABLE historico_trocas
--     ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pedido_em_andamento'
--     CHECK (status IN ('pedido_em_andamento', 'sem_estoque', 'liberado_retirada'));

-- DESABILITAR RLS PARA TESTES (OPCIONAL, MAS FACILITA A CARGA INICIAL)
ALTER TABLE supervisores DISABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE carga_tecnicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE historico_trocas DISABLE ROW LEVEL SECURITY;

-- INSERIR SUPERVISOR INICIAL (Para você conseguir logar)
-- Matrícula: SUP001 / Senha: 123456
INSERT INTO supervisores (matricula, nome, senha, setor) 
VALUES ('SUP001', 'ARMANDO ROCHA', '123456', 'GESTÃO FERRAMENTARIA')
ON CONFLICT (matricula) DO NOTHING;
