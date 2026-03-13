# Guia do MCP Excel Server

Este documento descreve as funcionalidades do servidor MCP (Model Context Protocol) configurado para gerenciar arquivos Excel e realizar análises de dados diretamente através da IA.

## 🚀 O que este MCP pode fazer por você?

O `mcp-excel-server` permite que o assistente interaja com suas planilhas localizadas em `C:/Users/user/Desktop/planilhas` de forma inteligente.

### 1. Operações com Arquivos
*   **Leitura Multi-formato**: Lê arquivos `.xlsx`, `.xls`, `.csv`, `.tsv` e até `.json`.
*   **Escrita e Atualização**: Cria novos arquivos Excel ou atualiza planilhas existentes com novos dados.
*   **Metadados**: Lista nomes de abas (sheets) e obtém informações estruturais do arquivo (colunas, tipos de dados).

### 2. Análise de Dados e Estatística
*   **Resumo Estatístico**: Gera estatísticas descritivas (média, mediana, desvio padrão, etc.) automaticamente.
*   **Tabelas Dinâmicas (Pivot Tables)**: Cria resumos complexos cruzando diferentes colunas.
*   **Filtragem e Consultas**: Filtra dados com base em condições específicas (ex: "mostre apenas vendas acima de R$ 500").
*   **Qualidade de Dados**: Avalia a integridade dos dados, identificando valores nulos ou inconsistências.

### 3. Visualização de Dados
*   **Geração de Gráficos**: Cria gráficos de barras, linhas, dispersão e histogramas.
*   **Exportação**: Gera imagens das visualizações para que você possa ver os resultados graficamente.
*   **Previews**: Gera visualizações rápidas dos dados para conferência.

---

## 🛠️ Ferramentas Disponíveis (Tools)

Você pode pedir para a IA usar as seguintes ferramentas:

| Ferramenta | Descrição |
| :--- | :--- |
| `read_excel` | Lê o conteúdo de uma planilha. |
| `write_excel` | Cria um arquivo Excel do zero. |
| `update_excel` | Adiciona ou altera dados em um arquivo existente. |
| `analyze_excel` | Realiza análise estatística profunda nos dados. |
| `filter_excel` | Retorna apenas as linhas que atendem a um critério. |
| `pivot_table` | Cria uma tabela dinâmica para resumir informações. |
| `export_chart` | Gera um gráfico baseado nos dados da planilha. |
| `get_sheet_names` | Lista todas as abas presentes no arquivo. |

---

## 💡 Exemplos do que você pode pedir

*   *"Analise a planilha 'vendas_marco.xlsx' e me dê um resumo das vendas por vendedor."*
*   *"Crie um gráfico de barras mostrando o crescimento mensal baseado no arquivo 'financeiro.csv'."*
*   *"Filtre todos os produtos com estoque abaixo de 10 na planilha 'inventario.xlsx' e salve o resultado em um novo arquivo."*
*   *"Quais são os nomes das abas no arquivo 'consolidado_anual.xlsx'?"*

---

> [!TIP]
> O servidor está configurado para olhar para a pasta: `C:/Users/user/Desktop/planilhas`. Certifique-se de colocar seus arquivos lá para que a IA possa acessá-los facilmente!
