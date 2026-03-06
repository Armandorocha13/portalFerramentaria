-- Sprint 11 — Painel de SLA e Métricas de Atendimento
-- Executar no Supabase SQL Editor

-- Quem atendeu o pedido (operador do estoque)
ALTER TABLE historico_trocas
  ADD COLUMN IF NOT EXISTS atendido_por TEXT;

-- Quando o pedido foi atendido (para cálculo de SLA)
ALTER TABLE historico_trocas
  ADD COLUMN IF NOT EXISTS data_atendimento TIMESTAMPTZ;
