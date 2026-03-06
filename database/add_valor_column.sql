-- Adicionar coluna de valor para rastreamento financeiro nas trocas
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0;
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS tecnico_cargo TEXT;
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS tecnico_setor TEXT;

-- Se a tabela de carga tiver valor, podemos adicionar aqui também (opcional, dependendo do CSV de origem)
ALTER TABLE carga_tecnicos ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0;
