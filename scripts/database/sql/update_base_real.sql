-- 1. SUPERVISORES\n
-- 2. TÉCNICOS
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003403', 'ALBERTO SANDRO BARBOSA DA HORA DO NASCIMENTO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002438', 'DECIO FERREIRA DA SILVA', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004417', 'DIOGO CAMILO ROCHA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002494', 'FABIO DA SILVA XAVIER', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004648', 'GUSTAVO DA SILVA FERREIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002999', 'JULIO CESAR DE PAULA FONTES DA SILVA', 'TIM GPON - RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003921', 'LUIZ FELIPE DE ALBUQUERQUE WERNECK', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002612', 'LUIZ FELIPE LUIZ NERI', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104872', 'RAFAEL FONTES DA SILVA COSTA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003082', 'RENAN SALERMO DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004649', 'REYNAN DA LUZ GOMES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004697', 'ROD JORGE DOS SANTOS DE MATTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004710', 'THIAGO DANTAS BRAGA DE FIGUEIREDO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002793', 'ALEX MOREIRA DE SOUSA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004411', 'BENJAMIN CORTES DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002883', 'BRUNO MADUREIRA E SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700010', 'CARLOS EDUARDO FERREIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003045', 'CLAUDIO DE JESUS BISPO PIRES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004434', 'DIEGO DE OLIVEIRA SOARES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700092', 'ELTON CEZAR DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003539', 'FABIO LUIZ DIEGUES DA CUNHA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004628', 'FABRICIO GAMA DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002485', 'FELIPE GOMES PEREIRA', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004598', 'FERNANDO DE OLIVEIRA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004377', 'GUILHERME ANTONIO DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002884', 'JOSIVAN CARLOS MENDES SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004617', 'LUCIANO BRANDAO DA CRUZ', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700108', 'MARCELO JOSE RODRIGUES FERNANDES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003111', 'MIGUEL ALMEIDA ALVES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003582', 'RAFAEL FREITAS DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004390', 'RIVANILDO FERREIRA DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004387', 'ROGER IGOR REZENDE DURAES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004543', 'RONALDO LIMA SOARES JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004820', 'SERGIO LUIZ LISBOA DA CONCEICAO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004606', 'WENDELL ALVES DE CARVALHO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003651', 'ADELCY ANTONIO DE LIMA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004132', 'ALEXANDRE DE OLIVEIRA AMARO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004459', 'ALEXANDRE NUNES RODRIGUES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700077', 'BRENO HENRIQUE BARBOSA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004415', 'BRUNO FERNANDO ARRUDAS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700080', 'CARLOS WELLINGTON FRANCISCO DE CARVALHO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002820', 'FRANCISCO CRISTIANO LOPES DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002570', 'LEONARDO DE OLIVEIRA CARNEIRO', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003985', 'MAICON LUIZ REIS BASTOS DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004158', 'NERI JALBAS DA SILVA NERI', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700125', 'NEY ALEXANDRE ROCHA MARCELINO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004000', 'RICARDO DA CONCEICAO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700061', 'RONALDO XAVIER DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004152', 'TASSIO EMANOEL SILVA DE FREITAS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700117', 'WEIDER TIERRY POLICARPO DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004798', 'ALEXANDRE DOS SANTOS VIEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004646', 'ANDRE DE SOUZA VIEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004382', 'ANDRE GONCALVES CARINO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('114954', 'BRUNO DA SILVA TIMOTEO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004792', 'JONATHAN REIS GAMA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004463', 'JORGE LUIZ CARDOSO DE ASSIS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002434', 'LUCAS BENTO BASTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104958', 'LUCAS DOMINGUES COSTA DO NASCIMENTO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004681', 'LUCAS GOMES LEAL', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104959', 'RAPHAEL VASCONCELLOS ALBUQUERQUE', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004548', 'ROBERTO ALVES DE MORAES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004462', 'RODRIGO GARCIA DETULIO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002816', 'SELMO DO NASCIMENTO SILVA', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004546', 'SILVINO ANTONIO DE LIMA NETO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004529', 'WILSON DE SOUZA PINTO JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004401', 'ANDERSON COSTA MAIA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004683', 'CLAUDINEI DA SILVA DA CONCEICAO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004673', 'JACSON RODRIGO OLIVEIRA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004954', 'JEFFERSON GEYSSON NASCIMENTO DA CRUZ', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004542', 'MAICON GOMES PARREIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003697', 'MARCOS PORFIRIO DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002881', 'OTAVIO CARLOS SABOIA', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004559', 'SYDNEY PEDREIRA MAIA JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003281', 'MARCOS ANTONIO BERNARDES DE AZEVEDO', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004725', 'CAIO BRAYEN DA SILVA LIMA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004386', 'CARLOS RODOLFO LOPES CARVALHO MESQUITA DE LIMA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004351', 'CLAUDIO ROBERTO SANTOS CARNEIRO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004973', 'EDSON SOARES DE SOUZA JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004795', 'EDUARDO BARBOSA DA CONCEICAO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002964', 'GABRIEL DE SOUZA FERREIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700102', 'HUGO MACHADO DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002963', 'JAIME CERQUEIRA VASQUES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104913', 'MARCOS JUNIOR DA SILVA LIMA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004518', 'MARCUS HENRIQUE DIEGUES DA CUNHA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104857', 'RAPHAEL HENRIQUE DA SILVA MELO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004721', 'RICARDO DE SOUZA ORNELAS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003986', 'ROBERTO DA SILVA OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003016', 'VITOR DE OLIVEIRA ALVES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003705', 'ALEX BRITO SOARES DE SOUZA', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002526', 'ALEXANDRE DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104873', 'ANDERSON FIRMINO GOMES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003665', 'GILCIMAR GIESTEIRA DA COSTA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003329', 'JERFSON RODRIGUES DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004952', 'LUIZ CLAUDIO DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004162', 'MAICON RODRIGO ALVES VALIM', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003328', 'MARCELO DE OLIVEIRA CUNHA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004755', 'MARCIO FERREIRA DE CARVALHO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104874', 'MIGUEL CARLOS DE OLIVEIRA FILHO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004443', 'PAULO ROBERTO NEIPP', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700062', 'RODRIGO DA SILVA COSTA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004616', 'RYAN PABLO COSTA DE SOUZA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002828', 'WALLACE CLAYTON DAS NEVES MOURA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002641', 'WEVERTON DA SILVA SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004376', 'ALEX SANDRO MACHADO DE OLIVEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004446', 'CARLOS EDUARDO TORRES DE ALMEIDA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004713', 'CLAUDIO DA SILVA COIMBRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004654', 'CRISTIANO DA SILVA MEDEIROS', 'SUPERVISOR INSTALAÇÃO IHS RJ', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004560', 'EDNEI DE AZEVEDO DAMASIO JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004436', 'FABRICIO VIEIRA DA LUZ', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004924', 'FELIPE DA SILVA THOMAZ', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004498', 'JORGE LUIZ PORTO DE ALMEIDA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002615', 'JOSE MARCOS CHAGAS ROCHA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004528', 'LINCOLN GONCALVES NUNES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700106', 'LUIZ CARLOS CORREA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004444', 'MAXWELL WILLIAM COSTA DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004569', 'RAFAEL ALMEIDA DOS SANTOS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004565', 'VINICIUS DE JESUS MIRANDA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004508', 'ALEXSANDER ROCHA DE CARVALHO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004620', 'BRUNO CESAR MORAES SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004699', 'CAIO BERNARDO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104847', 'CARLOS FERNANDO ARAUJO BRAGA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002962', 'DIOGO DE LIMA COSTA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004700', 'DYOGO COSTA BASTOS DA MATA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004853', 'EDVALDO VINICIO ALCANTARA VIEIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004489', 'EMERSON MOREIRA CAMPOS DE SOUZA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004567', 'JORGE RODRIGUES DOS SANTOS JUNIOR', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004787', 'RONNY SODRE MACHADO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004536', 'RUAN ALEX DA SILVA CASEIRO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('700057', 'ALEX GOMES RAMALHEDA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004159', 'CARLOS ALBERTO DE ANDRADE LIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004615', 'DIEGO RIBEIRO JACOB', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004596', 'DJALMA GARCIA DETULIO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004910', 'EVANDRO PONTES SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004618', 'FABRICIO PEDRO DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004499', 'JAILSON CORREIA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004716', 'JEFFERSON BARBOSA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104957', 'JOAO VICTOR DE PAULA REIS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004921', 'LUCAS FERRARO SUZANO ROSAS', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('002475', 'MARCOS FERREIRA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004627', 'MAXIMILIANO MESSIAS ROCHA JORDAO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004530', 'RODRIGO CLEMENTE RODRIGUES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('104860', 'SAMUEL IVES DA SILVA GUIMARAES', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004458', 'ANSELMO CORREA DA COSTA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003695', 'DANIEL ERIK RODRIGUES ARAUJO', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003805', 'DIEGO CARVALHO LUIZ', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('004406', 'FELIPE SILVA DE FRANCA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('003044', 'SANDRO VIANA DA SILVA', 'MULTSKILL IHS RJO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
INSERT INTO tecnicos (matricula, nome, cargo, setor, status, supervisor_id) 
VALUES ('001590', 'PAULO AFONSO DE FREITAS LIMA', 'CLASSE G MANUTENÇÃO CLARO', 'FROTA', 'ativo', NULL)
ON CONFLICT (matricula) DO UPDATE SET 
    nome = EXCLUDED.nome, 
    cargo = EXCLUDED.cargo, 
    setor = EXCLUDED.setor, 
    supervisor_id = EXCLUDED.supervisor_id;
