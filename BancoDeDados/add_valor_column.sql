-- Adicionar coluna de valor para rastreamento financeiro nas trocas
-- Usaremos 'valor' no histórico para simplificar, mapeando da 'valor_total' da carga
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0;
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS tecnico_cargo TEXT;
ALTER TABLE historico_trocas ADD COLUMN IF NOT EXISTS tecnico_setor TEXT;
