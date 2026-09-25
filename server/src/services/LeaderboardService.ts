import * as fs from 'fs';
import * as path from 'path';

export interface RaceRecord {
  id: string;
  playerName: string;
  character: string;
  trackName: string;
  finishTime: number; // segundos (ex: 68.4)
  formattedTime: string; // "01:08.4"
  score: number;
  date: string;
}

export interface ArenaRecord {
  id: string;
  playerName: string;
  character: string;
  kos: number;
  score: number;
  date: string;
}

export interface LeaderboardData {
  race: RaceRecord[];
  arena: ArenaRecord[];
}

export class LeaderboardService {
  private static dataFilePath = path.resolve(__dirname, '../../data/leaderboard.json');
  private static memoryData: LeaderboardData = {
    race: [
      { id: 'seed-1', playerName: 'Pinguim Supersônico', character: 'penguin', trackName: 'Pico da Nevasca', finishTime: 68.4, formattedTime: '01:08.4', score: 18450, date: '2026-09-24' },
      { id: 'seed-2', playerName: 'Felino da Geada', character: 'cat', trackName: 'Pico da Nevasca', finishTime: 74.2, formattedTime: '01:14.2', score: 15200, date: '2026-09-24' },
      { id: 'seed-3', playerName: 'Sapo Glacial', character: 'frog', trackName: 'Pico da Nevasca', finishTime: 79.8, formattedTime: '01:19.8', score: 13550, date: '2026-09-24' },
      { id: 'seed-4', playerName: 'Shih Tzu Valente', character: 'dog', trackName: 'Pico da Nevasca', finishTime: 85.1, formattedTime: '01:25.1', score: 11900, date: '2026-09-25' },
      { id: 'seed-5', playerName: 'Urso Polar Veloz', character: 'polar_bear', trackName: 'Pico da Nevasca', finishTime: 91.5, formattedTime: '01:31.5', score: 9800, date: '2026-09-25' }
    ],
    arena: [
      { id: 'arena-1', playerName: 'Mestre das Neves', character: 'penguin', kos: 12, score: 3600, date: '2026-09-24' },
      { id: 'arena-2', playerName: 'Atirador Gelado', character: 'dog', kos: 9, score: 2700, date: '2026-09-24' },
      { id: 'arena-3', playerName: 'Pinguim Sniper', character: 'cat', kos: 7, score: 2100, date: '2026-09-25' },
      { id: 'arena-4', playerName: 'Defensor da Fortaleza', character: 'polar_bear', kos: 5, score: 1500, date: '2026-09-25' }
    ]
  };

  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.race) && Array.isArray(parsed.arena)) {
          this.memoryData = parsed;
        }
      } else {
        this.saveToFile();
      }
    } catch (err) {
      console.warn('[LeaderboardService] Aviso ao inicializar arquivo persistente:', err);
    }
  }

  private static saveToFile() {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[LeaderboardService] Não foi possível salvar em disco, usando apenas memória:', err);
    }
  }

  public static formatSeconds(totalSec: number): string {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    const tenths = Math.floor((totalSec % 1) * 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${tenths}`;
  }

  public static getLeaderboards(): LeaderboardData {
    this.init();
    return {
      race: [...this.memoryData.race].sort((a, b) => a.finishTime - b.finishTime).slice(0, 20),
      arena: [...this.memoryData.arena].sort((a, b) => b.kos - a.kos || b.score - a.score).slice(0, 20)
    };
  }

  public static addRaceRecord(data: {
    playerName: string;
    character?: string;
    trackName?: string;
    finishTime: number;
    score: number;
  }): RaceRecord {
    this.init();

    const record: RaceRecord = {
      id: 'race_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      playerName: (data.playerName || 'Piloto Anônimo').trim().substring(0, 24),
      character: data.character || 'penguin',
      trackName: data.trackName || 'Pico da Nevasca',
      finishTime: Math.max(10, Math.round(data.finishTime * 10) / 10),
      formattedTime: this.formatSeconds(data.finishTime),
      score: Math.max(0, Math.round(data.score)),
      date: new Date().toISOString().split('T')[0]
    };

    this.memoryData.race.push(record);
    this.memoryData.race.sort((a, b) => a.finishTime - b.finishTime);
    if (this.memoryData.race.length > 50) {
      this.memoryData.race = this.memoryData.race.slice(0, 50);
    }

    this.saveToFile();
    return record;
  }

  public static addArenaRecord(data: {
    playerName: string;
    character?: string;
    kos: number;
    score: number;
  }): ArenaRecord {
    this.init();

    const record: ArenaRecord = {
      id: 'arena_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      playerName: (data.playerName || 'Guerreiro da Neve').trim().substring(0, 24),
      character: data.character || 'penguin',
      kos: Math.max(0, Math.floor(data.kos)),
      score: Math.max(0, Math.round(data.score)),
      date: new Date().toISOString().split('T')[0]
    };

    this.memoryData.arena.push(record);
    this.memoryData.arena.sort((a, b) => b.kos - a.kos || b.score - a.score);
    if (this.memoryData.arena.length > 50) {
      this.memoryData.arena = this.memoryData.arena.slice(0, 50);
    }

    this.saveToFile();
    return record;
  }
}
