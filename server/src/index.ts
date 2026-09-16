import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import cors from 'cors';
import { AlpineHubRoom } from './rooms/AlpineHubRoom';
import { SleddingMatchRoom } from './rooms/SleddingMatchRoom';

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = createServer(app);
const gameServer = new Server({ server });

// Registrar salas do Colyseus
gameServer.define('alpine_hub', AlpineHubRoom);
gameServer.define('sledding_match', SleddingMatchRoom);

gameServer.listen(port).then(() => {
  console.log(`❄️ Snow Slide Authoritative Server running on ws://localhost:${port}`);
});
