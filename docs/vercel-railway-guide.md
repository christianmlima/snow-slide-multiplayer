# Guia de Deploy Definitivo: Vercel + Railway

Este documento resume os passos para colocar o cliente na Vercel e o servidor no Railway.

## 1. Servidor no Railway (`railway.app`)
1. Acesse [railway.app](https://railway.app) e faça login com sua conta do GitHub.
2. Clique em **New Project** ➔ **Deploy from GitHub repo**.
3. Selecione o repositório `christianmlima/snow-slide-multiplayer`.
4. Defina o **Root Directory** como `/server` (ou deixe o Railway detectar).
5. O Railway vai gerar um domínio público (ex: `snow-slide-server.up.railway.app`). Copie essa URL WebSocket (`wss://...`).

## 2. Cliente na Vercel (`vercel.com`)
1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub.
2. Clique em **Add New...** ➔ **Project** e importe `christianmlima/snow-slide-multiplayer`.
3. Configure as opções de Build:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Na aba de variáveis de ambiente (`Environment Variables`), adicione a URL do seu servidor do Railway para que o cliente se conecte ao WebSocket correto.
5. Clique em **Deploy**!
