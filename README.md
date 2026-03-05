# Portal da Ferramentaria Central

## 1. Introdução

O presente repositório contém o código-fonte e a documentação técnica do **Portal de Gestão de Estoque e Ferramentaria**. Este sistema foi projetado com o objetivo de modernizar e automatizar o fluxo de substituição e controle de ferramentas de produção. A plataforma visa substituir o uso métodos descentralizados (como planilhas isoladas) por um sistema integrado, síncrono e centralizado, com níveis rigorosos de controle de acesso (RBAC - Role-Based Access Control).

---

## 2. Visão Geral da Arquitetura e Funcionalidades

O sistema foi estruturado para atender a dois perfis principais de usuários operacionais: **Supervisores de Linha** e **Operadores de Estoque/Ferramentaria**. 

Dentre as principais funcionalidades, destacam-se:

* **Controle de Acesso Baseado em Perfis (RBAC):** Autenticação unificada por matrícula institucional. O roteamento da aplicação (Single Page Application) garante o isolamento seguro das áreas de atuação de cada perfil, impedindo acesso não autorizado às demais dependências do sistema.
* **Processo Guiado para Supervisores:** Implementação de um fluxo de cinco etapas (Stepper) para solicitação de troca de itens. O sistema realiza validação ativa dos dados do colaborador, exibe os itens atualmente sob sua responsabilidade (patrimônio) e exige a categorização do motivo da troca (ex. desgaste, quebra, etc.).
* **Painel Dinâmico de Ferramentaria:** Interface dedicada ao gerenciamento do estoque, dotada de sincronização de dados em tempo real (via WebSockets/Polling inteligente). O sistema calcula automaticamente o prazo de encerramento do protocolo (D+1 útil) e possui rotinas nativas para exportação de relatórios em formato `.xlsx`.
* **Políticas de Segurança em Interface:** Incorporação de mecanismos mitigatórios de ataques de força bruta, incluindo limitação de taxa (Rate Limiting) estruturado e restrição temporária por excesso de tentativas frustradas, validados no ciclo de vida da sessão.

---

## 3. Especificações Tecnológicas

A aplicação foi desenvolvida seguindo os padrões modernos de engenharia de software frontend, assegurando escalabilidade, performance e confiabilidade tipográfica:

* **Núcleo de Software (Frontend):** Framework `React (v18)` instrumentado pelo `Vite` e inteiramente desenvolvido sob o superset `TypeScript`.
* **Interface de Usuário (UI):** Construída de maneira fluida e responsiva utilizando os paradigmas do `TailwindCSS`, `Lucide React` para componente de ícones integrados e estilos nativos adaptativos (Vanilla CSS).
* **Qualidade de Software (Testes):** Cobertura de testes unitários e de integração de ponta a ponta (E2E) estruturada sobre os frameworks `Vitest` e `React Testing Library`, simulando o ecossistema `JSDOM`.
* **Persistência de Dados e Backend as a Service (BaaS):** Adoção da plataforma `Supabase` operando `PostgreSQL 15`. A segurança em nível de registro é garantida através de políticas estritas RLS (Row Level Security).
* **Infraestrutura e Implantação:** O ambiente produtivo é estritamente isolado via tecnologias de containerização (`Docker` e `Docker-Compose`), sendo o tráfego estático gerenciado e armazenado verticalmente em servidor `NGINX`.

---

## 4. Configuração do Ambiente e Variáveis de Sistema

Para o correto funcionamento em ambiente hospedado (deploy), é estritamente necessária a configuração de variáveis de ambiente. A raiz do repositório provê um arquivo base `/.env.example`.

O operador responsável deverá criar uma cópia sob a nomenclatura `.env` e imputar as credenciais associadas à instância relacional na nuvem:

```env
VITE_SUPABASE_URL=url_instancia_supabase.co
VITE_SUPABASE_ANON_KEY=chave_anonima_publica_da_api
```

*(Nota: O arquivo .env consta no .gitignore e sob nenhuma hipótese deve ser enviado para os repositórios versionados).*

---

## 5. Procedimentos de Implantação (Deployment em Docker)

O sistema conta com um processo de compilação multi-estágio (*Multi-Stage Build*). Este modelo separa a carga de transpilação (Node.js) da carga de hospedagem final (NGINX), resultando em um contêiner altamente otimizado para servidores produtivos on-premises ou em nuvem.

Para implantar a aplicação, execute sequencialmente as seguintes diretrizes:

**5.1. Compilação da Imagem do Contêiner:**
```bash
docker build -t portal-ferramentaria:latest .
```

**5.2. Execução Simples Mapeada em Porta Externa:**
```bash
# Implanta a aplicação na porta HTTP (8080) abstrata no host
docker run -p 8080:80 -d --name portal_webapp portal-ferramentaria:latest
```
Após o sucesso do comando, a interface de uso portará disponibilidade em `http://localhost:8080`.

---

## 6. Procedimentos de Execução em Ambiente de Desenvolvimento

Para prosseguir com os trabalhos de engenharia na base do código ou depurar funcionalidades, observe o escopo estipulado abaixo:

```bash
# 1. Instalação e provisionamento do gerenciador pacotes:
npm install -g pnpm

# 2. Instalação local da dependência dos módulos:
pnpm install

# 3. Execução da suíte padronizada de testes:
pnpm test:run

# 4. Inicialização do servidor estático com Hot-Reload (desenvolvimento):
pnpm run dev
```

> **Considerações Finais:** O desenvolvimento desta aplicação constitui o escopo de implementações estruturadas ao longo de sucessivas metodologias ágeis (Sprints), contemplando modelagem desde a idealização da interface e refatoração arquitetural, até procedimentos agressivos de otimização de performance (*Lazy Loading*) e rotinas de pipeline sistêmico.
