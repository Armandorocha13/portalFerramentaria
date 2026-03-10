-- ============================================================
-- SCRIPT DE ADAPTAÇÃO DA BASE DE DADOS COM BASE NO SITE.xlsx
-- ============================================================
-- Objetivo: Limpar as tabelas de técnicos e supervisores, 
-- e recriar com as colunas baseadas na extração do arquivo Excel (SITE.xlsx).
-- Inclui o mapeamento de relacionamento e a coluna 'contrato'.

-- 1. Remoção das tabelas existentes (CUIDADO: isso apagará os dados)
DROP TABLE IF EXISTS public.tecnicos CASCADE;
DROP TABLE IF EXISTS public.supervisores CASCADE;

-- 2. Criação da tabela de Supervisores
-- Os supervisores devem ser criados primeiro para estabelecer a Foreign Key
CREATE TABLE public.supervisores (
    matricula TEXT PRIMARY KEY,    -- Mapeado de 'Cod. Supervisor'
    senha TEXT,                    -- A matrícula também será usada como senha
    nome TEXT NOT NULL,            -- Mapeado de 'Supervisor'
    setor TEXT,                    -- Mantido para compatibilidade
    situacao TEXT DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criação da tabela de Técnicos
-- Adaptada 100% com base nas colunas de SITE.xlsx
CREATE TABLE public.tecnicos (
    equipe TEXT,                           -- 'Equipe'
    nome TEXT NOT NULL,                    -- 'Nome'
    codigo_perfil TEXT,                    -- 'Código Perfil'
    perfil TEXT,                           -- 'Perfil'
    supervisor_matricula TEXT,             -- 'Cod. Supervisor'
    cod_fornec TEXT,                       -- 'Cod. Fornec.'
    contrato TEXT,                         -- 'Nome Fornec.' (Conforme instrução: "Lembrando tem uma coluna com o nome Contrato")
    regiao TEXT,                           -- 'Nome da Região'
    data_encerramento TEXT,                -- 'Encerramento'
    matricula TEXT PRIMARY KEY,            -- 'Nº FRE' (Identificador principal / Matrícula)
    funcao TEXT,                           -- 'Função'
    cpf TEXT,                              -- 'CPF'
    data_admissao TEXT,                    -- 'Data Admissão'
    data_demissao TEXT,                    -- 'Data Demissão'
    situacao TEXT,                         -- 'Situação' (ex: ATIVO, DEMITIDO)
    mobile_habilitado TEXT,                -- 'Mobile Habilitado'
    cargo TEXT,                            -- Coluna de compatibilidade caso o app utilize 'cargo'
    setor TEXT,                            -- Coluna de compatibilidade
    status TEXT,                           -- Coluna de compatibilidade (ativo, inativo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Relacionamento com Supervisores
    CONSTRAINT fk_supervisor
      FOREIGN KEY(supervisor_matricula) 
      REFERENCES public.supervisores(matricula)
      ON DELETE SET NULL
);

-- Índices para melhorar a performance de consultas
CREATE INDEX idx_tecnicos_supervisor ON public.tecnicos(supervisor_matricula);
CREATE INDEX idx_tecnicos_situacao ON public.tecnicos(situacao);
CREATE INDEX idx_tecnicos_contrato ON public.tecnicos(contrato);

-- 4. Função ou View para compatibilidade (Opcional, para ajudar o front-end)
-- Caso o sistema precise do formato antigo, podemos preencher automaticamente cargo, setor, e status
CREATE OR REPLACE FUNCTION trg_tecnico_compat_insert()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cargo := NEW.funcao;
    NEW.status := CASE WHEN TRIM(NEW.situacao) = 'ATIVO' THEN 'ativo' ELSE 'inativo' END;
    NEW.setor := COALESCE(NEW.regiao, 'Operações');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tecnico_compat_insert_before
BEFORE INSERT OR UPDATE ON public.tecnicos
FOR EACH ROW EXECUTE FUNCTION trg_tecnico_compat_insert();

-- FIM DO SCRIPT
