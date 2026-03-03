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
-- Resumo de tudo que foi feito.
CREATE TABLE IF NOT EXISTS historico_trocas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID REFERENCES supervisores(id),
    tecnico_id UUID REFERENCES tecnicos(id),
    item_saida_nome TEXT NOT NULL,
    item_entrada_nome TEXT NOT NULL,
    motivo TEXT NOT NULL,
    data_troca TIMESTAMPTZ DEFAULT NOW()
);

-- INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- INSERT INTO supervisores (matricula, nome, senha, setor) VALUES ('SUP001', 'Carlos Supervisor', '123456', 'Linha A');
