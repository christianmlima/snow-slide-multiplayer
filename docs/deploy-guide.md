# Snow Slide Multiplayer - Guia de Deploy e Hospedagem

Este documento detalha o funcionamento do pipeline de CI/CD e as opções de hospedagem para o cliente (Three.js) e servidor (Colyseus).

---

## 1. Link do Pipeline no GitHub
Como o repositório é privado (`christianmlima/snow-slide-multiplayer`), você pode acessar a aba de Actions diretamente por este link:
👉 [Repositório GitHub - Snow Slide Multiplayer](https://github.com/christianmlima/snow-slide-multiplayer/actions)

---

## 2. Vercel (Hospedagem do Cliente via CLI)
Sim, **dá para fazer tudo 100% via linha de comando (CLI)** na Vercel! É a forma mais rápida de colocar o front-end no ar com HTTPS permanente.

### Como usar a CLI da Vercel:
1. **Instalar a CLI globalmente:**
   ```bash
   npm i -g vercel
   ```
2. **Fazer login na sua conta Vercel:**
   ```bash
   vercel login
   ```
3. **Fazer o deploy direto da pasta do cliente:**
   ```bash
   cd /home/chris/projetos/snow-slide-multiplayer/client
   vercel --prod
   ```
   *(A CLI vai perguntar em qual projeto deseja vincular, confirmar o diretório de build `dist` e gerar um link permanente `https://...` instantaneamente).*

---

## 3. O que são o Render e o Railway? (Para o Servidor Colyseus)
Como o seu jogo possui **multiplayer em tempo real**, o servidor Node.js (Colyseus) precisa rodar em um servidor dedicado na nuvem (diferente do front-end que é apenas arquivos estáticos).

### 🚂 Railway (`railway.app`)
- **O que é:** Uma plataforma de nuvem moderna e extremamente simples para desenvolvedores. Ela lê o seu repositório do GitHub e detecta automaticamente o projeto Node.js.
- **Vantagens:** 
  - Deploy automático a cada commit.
  - Fornece uma URL WebSocket permanente (ex: `wss://sua-api.railway.app`).
  - Excelente camada gratuita para protótipos e jogos indie.

### RENDER (`render.com`)
- **O que é:** Um "Heroku moderno", focado em hospedar Web Services, Workers e Bancos de Dados PostgreSQL/Redis de forma gerenciada.
- **Vantagens:**
  - Configuração muito intuitiva via painel web ou arquivo `render.yaml`.
  - Plano gratuito para Web Services (com suspensão após inatividade prolongada, ideal para testes).

---

## 4. Arquivo de Configuração para o Render (`render.yaml`)
Para automatizar o deploy do servidor no Render, criamos o arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: snow-slide-server
    env: node
    region: ohio
    plan: free
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: PORT
        value: 2567
```
