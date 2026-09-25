import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import cors from 'cors';
import { AlpineHubRoom } from './rooms/AlpineHubRoom';
import { SleddingMatchRoom } from './rooms/SleddingMatchRoom';
import { SnowballArenaRoom } from './rooms/SnowballArenaRoom';
import { LeaderboardService } from './services/LeaderboardService';

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

// ==========================================
// REST API - SALÃO DE RECORDES (LEADERBOARD)
// ==========================================
app.get('/api/leaderboard', (_req, res) => {
  try {
    const data = LeaderboardService.getLeaderboards();
    res.json({ status: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || 'Erro ao carregar recordes' });
  }
});

app.post('/api/leaderboard/race', (req, res) => {
  try {
    const { playerName, character, trackName, finishTime, score } = req.body;
    if (typeof finishTime !== 'number' || finishTime <= 0) {
      return res.status(400).json({ status: 'error', message: 'finishTime inválido' });
    }
    const record = LeaderboardService.addRaceRecord({
      playerName: playerName || 'Piloto Anônimo',
      character: character || 'penguin',
      trackName: trackName || 'Pico da Nevasca',
      finishTime,
      score: typeof score === 'number' ? score : 0
    });
    res.json({ status: 'ok', record, leaderboard: LeaderboardService.getLeaderboards().race });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || 'Erro ao salvar recorde' });
  }
});

app.post('/api/leaderboard/arena', (req, res) => {
  try {
    const { playerName, character, kos, score } = req.body;
    const record = LeaderboardService.addArenaRecord({
      playerName: playerName || 'Guerreiro da Neve',
      character: character || 'penguin',
      kos: typeof kos === 'number' ? kos : 0,
      score: typeof score === 'number' ? score : 0
    });
    res.json({ status: 'ok', record, leaderboard: LeaderboardService.getLeaderboards().arena });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || 'Erro ao salvar recorde de arena' });
  }
});

const server = createServer(app);
const gameServer = new Server({ server });

// Registrar salas do Colyseus com suporte a Salas Privadas (?roomCode=...)
gameServer.define('alpine_hub', AlpineHubRoom).filterBy(['roomCode']);
gameServer.define('sledding_match', SleddingMatchRoom).filterBy(['roomCode']);
gameServer.define('snowball_arena', SnowballArenaRoom).filterBy(['roomCode']);

gameServer.listen(port).then(() => {
  console.log(`❄️ Snow Slide Authoritative Server running on ws://localhost:${port}`);
});
