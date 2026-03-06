-- O erro de "invalid input syntax for type uuid" aconteceu porque a tabela antiga de
-- historico_trocas ainda estava esperando que os IDs fossem no formato longo (UUID).
-- Como agora usamos a Matrícula, precisamos converter essas duas colunas para aceitar Texto (numérico).

ALTER TABLE public.historico_trocas 
  ALTER COLUMN supervisor_id TYPE TEXT USING supervisor_id::text;

ALTER TABLE public.historico_trocas 
  ALTER COLUMN tecnico_id TYPE TEXT USING tecnico_id::text;

ALTER TABLE public.historico_trocas 
  ALTER COLUMN tecnico_id DROP NOT NULL;
