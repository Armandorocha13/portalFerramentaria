-- Adiciona a coluna 'senha' na tabela supervisores
ALTER TABLE public.supervisores ADD COLUMN senha TEXT;

-- Define a senha inicial igual à matrícula para todos os supervisores já inseridos
UPDATE public.supervisores SET senha = matricula WHERE senha IS NULL;
