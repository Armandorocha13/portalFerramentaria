-- 1. Remove a função antiga que estava causando o conflito de tipo
DROP FUNCTION IF EXISTS public.login_supervisor(text, text);

-- 2. Recria a função devolvendo também um 'id' genérico para não quebrar o React
CREATE OR REPLACE FUNCTION public.login_supervisor(
  p_matricula text,
  p_senha text
)
RETURNS TABLE (
  id text,
  matricula text,
  nome text,
  setor text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.matricula AS id, -- Usa a própria matrícula como ID virtual
    s.matricula,
    s.nome,
    s.setor
  FROM public.supervisores s
  WHERE s.matricula = p_matricula
    AND s.senha = p_senha
    AND s.situacao = 'ATIVO';
END;
$$;
