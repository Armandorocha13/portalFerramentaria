# Etapa 1: Build da aplicacao (Node.js)
FROM node:20-alpine AS build

# Define o diretorio de trabalho
WORKDIR /app

# Ativa corepack para usar o pnpm especifico do projeto
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia os arquivos de dependencia
COPY package.json pnpm-lock.yaml ./

# Baixa as dependencias usando o Lock
RUN pnpm install --frozen-lockfile

# Copia todo o restante do codigo (exceto o que estiver no .dockerignore)
COPY . .

# Faz o build de producao para a pasta /dist
RUN pnpm run build

# Etapa 2: Servidor Web de Producao (Nginx)
FROM nginx:alpine

# Copia a configuracao customizada do Nginx para suportar roteamento SPA do React
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados da etapa anterior (dist) para a pasta html do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expoe a porta 80 por padrao do container
EXPOSE 80

# Comando padrao do Nginx para rodar na tela
CMD ["nginx", "-g", "daemon off;"]
