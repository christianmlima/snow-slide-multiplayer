import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import cors from 'cors';
import { AlpineHubRoom } from './rooms/AlpineHubRoom';
import { SleddingMatchRoom } from './rooms/SleddingMatchRoom';
import { SnowballArenaRoom } from './rooms/SnowballArenaRoom';

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'Snow Slide Multiplayer', timestamp: Date.now() });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Snow Slide Multiplayer Authoritative Server',
    rooms: ['alpine_hub', 'sledding_match', 'snowball_arena'],
    time: new Date().toISOString()
  });
});

const server = createServer(app);
const gameServer = new Server({ server });

// Registrar salas do Colyseus
gameServer.define('alpine_hub', AlpineHubRoom);
gameServer.define('sledding_match', SleddingMatchRoom);
gameServer.define('snowball_arena', SnowballArenaRoom);

gameServer.listen(port).then(() => {
  console.log(`❄️ Snow Slide Authoritative Server running on ws://localhost:${port}`);
});
