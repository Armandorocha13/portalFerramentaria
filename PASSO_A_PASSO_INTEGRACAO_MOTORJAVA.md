# Guia de Integração: Portal Ferramentaria → MotorJava

Este documento descreve como conectar a API de Histórico de Trocas (Projeto Node.js) ao motor de automação Java (**MotorJava**).

## 📊 Arquitetura da Solução

O **Projeto A (Portal Ferramentaria)** atua como a fonte de dados (Supabase/PostgreSQL) e expõe uma API REST. O **Projeto B (MotorJava)** consome essa API e persiste os dados em um banco MySQL local.

---

## 1. Preparação no Projeto A (Portal Ferramentaria)

Certifique-se de que a API de ponte está rodando no terminal:

```bash
cd c:/Users/user/portalFerramentaria-1
npm run api:start
```
*A API estará disponível em: `http://localhost:3001/api/historico-trocas`*

---

## 2. Implementação no MotorJava

Analisei seu repositório e o local ideal para a implementação é o `FerramentariaService`.

### Passo 2.1: Dependências
Adicione ao seu `pom.xml` (ou certifique-se de que já possui) uma biblioteca para processar JSON. Recomendamos o **Jackson**:

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>
```

### Passo 2.2: Lógica de Sincronização em Java
No arquivo `backend/src/main/java/com/motorjava/service/ferramentaria/FerramentariaService.java`, implemente o método de extração:

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;

public void extrairDadosDoPortal() {
    try {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:3001/api/historico-trocas"))
                .GET()
                .build();

        logger.accept("📡 Conectando à API do Portal...");
        
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            String jsonContent = response.body();
            
            // Converter JSON para Lista de Mapas (ou sua Entidade JPA)
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> dados = mapper.readValue(jsonContent, List.class);
            
            logger.accept("✅ Recebidos " + dados.size() + " registros.");
            
            // Loop para salvar no MySQL local
            for (Map<String, Object> registro : dados) {
                // Lógica de INSERT no seu banco local (DAO ou Repository)
                logger.accept("Processando troca do técnico: " + registro.get("tecnico_nome"));
            }
            
            logger.accept("✨ Sincronização concluída com sucesso!");
        } else {
            logger.accept("❌ Erro na API: Status " + response.statusCode());
        }
    } catch (Exception e) {
        logger.accept("⚠️ Falha crítica: " + e.getMessage());
        e.printStackTrace();
    }
}
```

---

## 3. Ativação via MCP (Opcional)

Se você estiver usando uma IA para gerenciar o **MotorJava**, você pode configurar o **MCP Server** que criamos para que a própria IA dispare a sincronização.

- **Servidor MCP**: `c:/Users/user/portalFerramentaria-1/scripts/mcp_server_ferramentaria.ts`
- **Comando**: `npx tsx <caminho_acima>`

---

## 4. Teste de Fluxo Completo

1. **Ligue a API** no Projeto A.
2. **Acesse o Painel do MotorJava** (normalmente em `localhost:8080` conforme o `LocalServer.java`).
3. **Clique em "Extrair Dados"** na aba de Ferramentaria.
4. Confira o log do console do Java para ver os dados sendo importados do Supabase para o seu MySQL.
