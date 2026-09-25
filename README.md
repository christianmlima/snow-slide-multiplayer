# ❄️ Snow Slide Multiplayer (v3.0.0-PRO)

> Jogo 3D de esportes de inverno, corrida estilo Mario Kart, guerra de neve PvP em tempo real e aventura cooperativa construído com **Three.js**, **TypeScript**, **Vite** e servidor autoritativo **Colyseus**.

🌐 **Deploy em Produção:**
- **Cliente (Vercel):** [https://snow-slide-multiplayer.vercel.app](https://snow-slide-multiplayer.vercel.app)
- **Servidor Multiplayer (Railway):** `wss://truthful-charm-production-bdfb.up.railway.app`

---

## 🏔️ Visão Geral

**Snow Slide Multiplayer** é uma experiência 3D completa no navegador inspirada em clássicos alpinos e jogos casuais de corrida e ação. Com direção de arte no estilo *Designer Vinyl Collectible Toy / Chibi*, o jogo combina:
1. Exploração em terceira pessoa no Vilarejo Alpino cooperativo com chat e emotes.
2. Descida de montanha com mecânica de drift (3 níveis de Mini-Turbo), acrobacias aéreas, caixas de power-ups, armadilhas e moedas colecionáveis.
3. Arena de Guerra de Bolas de Neve PvP multiplayer autoritativa até 8 jogadores (além de modo solo com bots inteligentes).
4. Suporte multiplataforma: **Teclado & Mouse**, **Telas Touch (Mobile/Tablet)** e **Controles Gamepad USB/Bluetooth** (Xbox, PlayStation, genéricos) com vibração háptica *dual-rumble*.

---

## 🎮 Funcionalidades Implementadas

### 1. 🏎️ Corrida Downhill Estilo Mario Kart & Sistema de Drift
- **Drift de 3 Tiers com Mini-Turbo:**
  - Segurar `Shift` (ou `LT`/`LB` no gamepad ou botão `Drift` no mobile) enquanto vira ativa o modo derrapagem.
  - **Tier 1 (Azul):** +30% velocidade temporária com fagulhas azuis.
  - **Tier 2 (Laranja):** +65% velocidade temporária com fagulhas laranjas.
  - **Tier 3 (Roxo):** +100% Ultra Mini-Turbo com fagulhas violetas e chamas de nitro.
- **Caixas de Itens & Roleta 3D:**
  - Caixas flutuantes translúcidas espalhadas pela pista com roleta aleatória de power-ups e som procedural.
- **Catálogo de Power-ups:**
  - 🌶️ **Nitro Flame:** Turbo propulsor imediato com partículas de fogo.
  - 🧊 **Cubo de Gelo (Ice Trap):** Lançado para trás; faz os rivais derraparem em 360°.
  - 🎯 **Bola Teleguiada (Homing Snowball):** Projétil que segue velozmente pela pista.
  - 🛡️ **Escudo de Neve (Snow Shield):** Bolha protetora que absorve o próximo impacto ou armadilha.
- **Acrobacias Aéreas (Air Tricks):**
  - Pressionar `Espaço` ou botão `A` no ar executa manobras com rotação de 360°, concedendo bônus de pontuação e turbo no pouso.
- **Pistas & Temas Selecionáveis:**
  - ☀️ **Pico Alpino (Dia):** Neve ensolarada, chalés e pinheiros.
  - 🌌 **Noite Polar com Aurora Boreal:** Céu estrelado e cortina cintilante de aurora boreal verde-esmeralda.
  - 💎 **Cavernas de Cristal:** Desfiladeiro com estalactites e cristais brilhantes em ciano e ametista.

### 2. ❄️ Arena de Guerra de Neve PvP em Tempo Real (Colyseus)
- **Sala Autoritativa (`snowball_arena`):**
  - Batalhas de até 8 jogadores simultâneos no servidor Colyseus.
  - Sistema de 3 Corações de Vida (HP), detecção de impacto e K.O.
  - Respawn automático em 3 segundos em pontos estratégicos da arena.
  - Placar em tempo real de K.O.s e acertos com premiação em moedas.
- **Modo Solo com Bots:**
  - Enfrente bots de IA com comportamentos de patrulha, flanqueamento e congelamento em bloco de gelo.

### 3. 🏘️ Vilarejo Alpino (*Alpine Hub*) & Interações Sociais
- **Sincronização Multiplayer Total:**
  - Movimentação, animações (andar, correr, sentar, arremessar) e cosméticos sincronizados entre jogadores.
  - **Chat de Texto em Tempo Real:** Balões flutuantes 3D e histórico lateral.
  - **Roda de Emotes & Dancinhas:** Acene (`👋`), dance (`💃`), celebre (`🎉`) ou mande corações (`❤️`).
- **Lojas & Customização:**
  - Garagem de trenós e pranchas, Boutique dos gorros e Ateliê de cachecóis e óculos.
- **Estande de Tiro de Parque (*Carnival Gallery*):**
  - Alvos móveis com combos e recompensas.

### 4. 🪙 Economia de Moedas de Neve & Conquistas
- Moedas coletadas na pista, nos minigames e nas vitórias.
- **Sistema de Conquistas com Notificações Toasts:**
  - 🏆 *Primeira Descida:* Conclua uma corrida.
  - ⚡ *Mestre do Drift:* Dispare um Mini-Turbo Nível 2 ou 3.
  - 🌪️ *Lenda dos Ares:* Conclua acrobacias durante o salto.
  - 🌶️ *Frenesi de Poder:* Utilize itens na corrida.
  - ❄️ *Atirador Polar:* Congele rivais na Guerra de Bolas de Neve.
  - 💰 *Colecionador Polar:* Acumule 100 Moedas de Neve.
  - 🚀 *Velocidade Máxima:* Atinja alta velocidade montanha abaixo.

### 5. 🎮 Suporte a Gamepad & Vibração Háptica
- API padrão HTML5 Gamepad com detecção automática de conexão.
- Deadzone inteligente nos analógicos.
- Suporte a gatilhos analógicos progressivos (`RT` acelerar, `LT` freio/drift).
- Vibração *dual-rumble* em Mini-Turbos, impactos e saltos.

---

## 🕹️ Tabela de Controles

| Ação | Teclado & Mouse | Gamepad | Mobile (Touch) |
|---|---|---|---|
| **Movimento** | `W, A, S, D` ou `Setas` | Analógico Esquerdo | Joystick Virtual 360° |
| **Câmera** | Mouse (Pointer Lock) | Analógico Direito | Deslize livre na tela |
| **Pular / Acrobacia no Ar** | `Espaço` | Botão `A` / Cruz | Botão `🔼 Pular` |
| **Derrapagem / Drift** | `Shift` + Curva | Botão `LB` / `LT` | Botão `Drift` |
| **Usar Item** | `Q` ou clique no item | Botão `X` / Quadrado | Botão `Usar Item` |
| **Arremessar Bola de Neve** | Segurar `Botão Esquerdo` | `RT` / Gatilho | Botão `❄️ Neve` |
| **Mira Tática (ADS)** | `Botão Direito` | `LT` (no Hub/Arena) | Botão `🎯 Mira` |
| **Roda de Emotes** | `T` | Botão `Y` / Triângulo | Botão `Emote Wheel` |
| **Interagir / Lojas** | `E` | Botão `A` | Botão Contextual `Interagir` |
| **Inventário** | `Tab` | — | Botão `Inventário` |
| **Configurações** | `O` | — | Botão `Configurações` |

---

## 📂 Arquitetura Modular

O monorepo está estruturado de forma desacoplada e escalável:

```plaintext
snow-slide-multiplayer/
├── client/                     # Frontend SPA (Three.js + Vite + TypeScript)
│   ├── index.html              # Interface do Usuário (HUDs, Modais, Roleta)
│   ├── src/
│   │   ├── animation/          # Rigging e animações esqueléticas procedurais
│   │   ├── audio/              # Síntese sonora procedural (Web Audio API)
│   │   ├── config/             # Catálogos de itens, conquistas e pistas
│   │   ├── core/               # Engine central e GamepadManager
│   │   ├── effects/            # Partículas de neve, fagulhas de drift e rastros
│   │   ├── models/             # Construtores procedurais de personagens e vilarejo
│   │   ├── network/            # Colyseus.js (Hub, Corrida e Arena PvP)
│   │   ├── physics/            # Colisões 3D, caixas OBB e atrito
│   │   ├── types/              # Tipagem TypeScript
│   │   └── ui/                 # Gerenciamento de HUDs, toasts e modais
├── server/                     # Servidor Autoritativo Multiplayer (Colyseus + Node.js)
│   ├── src/
│   │   ├── index.ts            # Ponto de entrada e registro de salas
│   │   └── rooms/
│   │       ├── AlpineHubRoom.ts       # Sincronização do Vilarejo
│   │       ├── SleddingMatchRoom.ts   # Corrida multiplayer 60Hz
│   │       └── SnowballArenaRoom.ts   # Arena PvP 8-player autoritativa
├── shared/                     # Schemas e Tipos Compartilhados (npm workspace)
│   ├── src/
│   │   ├── schemas/GameState.schema.ts  # Estado sincronizado em tempo real
│   │   └── types/player.types.ts
└── docs/                       # Guias de Deploy (Vercel, Railway, Render)
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.
- [pnpm](https://pnpm.io/) ou `npm`.

### Execução

1. **Instalar dependências:**
   ```bash
   pnpm install
   ```

2. **Compilar pacote compartilhado:**
   ```bash
   npm run build --workspace=shared
   ```

3. **Iniciar Servidor Multiplayer:**
   ```bash
   npm run dev:server
   # Executando em ws://localhost:2567
   ```

4. **Iniciar Cliente Vite:**
   ```bash
   npm run dev:client
   # Acesse em http://localhost:5173
   ```
