import { SoundManager } from './SoundManager';

export type BGMTrack = 'hub' | 'racing' | 'war' | 'none';

export class MusicManager {
  private soundManager: SoundManager;
  private currentTrack: BGMTrack = 'none';
  private isEnabled: boolean = true;
  private volume: number = 0.45;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Sequenciador Lookahead
  private timerId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private tempo: number = 80; // BPM
  private readonly scheduleAheadTime: number = 0.12; // segundos
  private readonly lookaheadIntervalMs: number = 30; // ms

  constructor(soundManager: SoundManager) {
    this.soundManager = soundManager;
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedVol = localStorage.getItem('snow_slide_bgm_volume');
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
      const savedEn = localStorage.getItem('snow_slide_bgm_enabled');
      if (savedEn !== null) {
        this.isEnabled = savedEn === 'true';
      }
    } catch (e) {}
  }

  public saveSettings() {
    try {
      localStorage.setItem('snow_slide_bgm_volume', this.volume.toString());
      localStorage.setItem('snow_slide_bgm_enabled', this.isEnabled.toString());
    } catch (e) {}
  }

  private getAudioContext(): AudioContext | null {
    const ctx = this.soundManager.getAudioContext();
    if (ctx && !this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isEnabled ? this.volume : 0, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
      this.initNoiseBuffer(ctx);
    }
    return ctx;
  }

  private initNoiseBuffer(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 0.5; // 0.5s ruído branco
    this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    const ctx = this.getAudioContext();
    if (ctx && this.masterGain && this.isEnabled) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.saveSettings();
    const ctx = this.getAudioContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(this.isEnabled ? this.volume : 0, ctx.currentTime, 0.08);
    }
    if (enabled && this.currentTrack !== 'none' && !this.timerId) {
      this.startScheduler();
    }
  }

  public isBGMEnabled(): boolean {
    return this.isEnabled;
  }

  public getCurrentTrack(): BGMTrack {
    return this.currentTrack;
  }

  public play(track: BGMTrack) {
    if (this.currentTrack === track && this.timerId) return;

    this.currentTrack = track;
    if (track === 'none') {
      this.stop();
      return;
    }

    // Configura o andamento de acordo com o cenário
    if (track === 'hub') this.tempo = 80; // Lofi aconchegante
    else if (track === 'racing') this.tempo = 136; // Descida acelerada
    else if (track === 'war') this.tempo = 122; // Batalha de neve

    this.currentStep = 0;
    const ctx = this.getAudioContext();
    if (ctx) {
      this.nextStepTime = ctx.currentTime + 0.05;
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
        this.masterGain.gain.setTargetAtTime(this.isEnabled ? this.volume : 0, ctx.currentTime, 0.1);
      }
    }

    this.startScheduler();
  }

  public stop() {
    this.currentTrack = 'none';
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    const ctx = this.getAudioContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    }
  }

  private startScheduler() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    this.timerId = window.setInterval(() => {
      this.scheduler();
    }, this.lookaheadIntervalMs);
  }

  private scheduler() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Converte BPM para duração de semicolcheia (16th note)
    const secondsPer16th = (60.0 / this.tempo) * 0.25;

    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime, ctx);
      this.nextStepTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 32; // Loop de 2 compassos (32 semicolcheias)
    }
  }

  // =========================================================================
  // SÍNTESE DE INSTRUMENTOS VIRTUAIS
  // =========================================================================

  private playTone(
    freq: number,
    type: OscillatorType,
    time: number,
    duration: number,
    gainVal: number,
    filterFreq: number = 2400,
    ctx: AudioContext
  ) {
    if (!this.masterGain || !this.isEnabled || this.volume <= 0) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(120, filterFreq * 0.5), time + duration);

      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {}
  }

  private playKick(time: number, ctx: AudioContext) {
    if (!this.masterGain || !this.isEnabled || this.volume <= 0) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.15);
    } catch (e) {}
  }

  private playSnare(time: number, ctx: AudioContext) {
    if (!this.masterGain || !this.noiseBuffer || !this.isEnabled || this.volume <= 0) return;
    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1100, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time);
      noise.stop(time + 0.12);
    } catch (e) {}
  }

  private playHiHat(time: number, open: boolean, ctx: AudioContext) {
    if (!this.masterGain || !this.noiseBuffer || !this.isEnabled || this.volume <= 0) return;
    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(7500, time);

      const duration = open ? 0.12 : 0.04;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(open ? 0.08 : 0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time);
      noise.stop(time + duration);
    } catch (e) {}
  }

  // =========================================================================
  // COMPOSIÇÃO DOS PADRÕES MUSICAIS (SEQUENCIADOR)
  // =========================================================================

  private scheduleStep(step: number, time: number, ctx: AudioContext) {
    if (this.currentTrack === 'hub') {
      this.scheduleHubStep(step, time, ctx);
    } else if (this.currentTrack === 'racing') {
      this.scheduleRacingStep(step, time, ctx);
    } else if (this.currentTrack === 'war') {
      this.scheduleWarStep(step, time, ctx);
    }
  }

  /**
   * Trilha 1: Vilarejo Alpino (Alpine Village Lofi)
   * Andamento relaxante (80 BPM), progressão Cmaj7 - Am7 - Fmaj7 - G7
   * Teclado elétrico caloroso, sub-grave suave e toques de marimba na neve.
   */
  private scheduleHubStep(step: number, time: number, ctx: AudioContext) {
    // 32 passos = 2 compassos de 16 semicolcheias
    const measure = Math.floor(step / 16);
    const subStep = step % 16;

    // Baixo suave (Triangle/Sine com filtro quente) no tempo 1 e 3 de cada compasso
    if (subStep === 0) {
      const bassFreq = measure === 0 ? 130.81 : 110.0; // C3 ou A2
      this.playTone(bassFreq, 'triangle', time, 0.45, 0.22, 550, ctx);
    } else if (subStep === 8) {
      const bassFreq = measure === 0 ? 87.31 : 98.0; // F2 ou G2
      this.playTone(bassFreq, 'triangle', time, 0.45, 0.22, 550, ctx);
    }

    // Acordes e Arpeggios de Marimba / Piano Polar
    // Notas: C4 (261.6), E4 (329.6), G4 (392.0), B4 (493.8), C5 (523.2), D5 (587.3), E5 (659.2)
    const melodyNotes: { [step: number]: number } = {
      0: 261.63, // C4
      2: 329.63, // E4
      4: 392.0,  // G4
      6: 493.88, // B4
      8: 523.25, // C5
      10: 440.0, // A4
      12: 392.0, // G4
      14: 329.63,// E4
      16: 440.0, // A4
      18: 523.25,// C5
      20: 587.33,// D5
      22: 659.25,// E5
      24: 587.33,// D5
      26: 493.88,// B4
      28: 392.0, // G4
      30: 329.63 // E4
    };

    if (melodyNotes[step]) {
      this.playTone(melodyNotes[step], 'sine', time, 0.32, 0.12, 1400, ctx);
    }

    // Leve pulso percussivo / shaker de neve a cada 4 passos
    if (subStep % 4 === 2) {
      this.playHiHat(time, false, ctx);
    }
  }

  /**
   * Trilha 2: Descida da Montanha (Downhill Rush / Mario Kart Style)
   * Andamento rápido (136 BPM), baixo pulsante em oitavas, bateria ritmada e melodia triunfante.
   */
  private scheduleRacingStep(step: number, time: number, ctx: AudioContext) {
    const subStep = step % 16;
    const bar = Math.floor(step / 16);

    // Bateria Dinâmica: Kick nos tempos 0, 8 (4 em 4 no compasso)
    if (subStep === 0 || subStep === 8) {
      this.playKick(time, ctx);
    }
    // Snare nos contratempos (passos 4 e 12)
    if (subStep === 4 || subStep === 12) {
      this.playSnare(time, ctx);
    }
    // Hi-hats a cada 2 semicolcheias (andamento contínuo)
    if (subStep % 2 === 0) {
      this.playHiHat(time, subStep === 2 || subStep === 10, ctx);
    }

    // Linha de Baixo Pulsante Estilo Chiptune / Sintetizador FM
    // Progressão: Dm (D2-D3) -> F (F2-F3) -> G (G2-G3) -> A (A2-A3)
    const baseFreqs = [73.42, 87.31, 98.0, 110.0];
    const root = baseFreqs[Math.floor(step / 8) % 4];
    const isOctaveHigh = step % 2 === 1;
    const bassFreq = isOctaveHigh ? root * 2 : root;

    this.playTone(bassFreq, 'sawtooth', time, 0.12, 0.16, 950, ctx);

    // Melodia de Lead dos Campeões da Neve
    const raceMelody: { [step: number]: number } = {
      0: 293.66,  // D4
      3: 349.23,  // F4
      6: 440.00,  // A4
      8: 587.33,  // D5
      10: 523.25, // C5
      12: 440.00, // A4
      14: 392.00, // G4
      16: 349.23, // F4
      18: 392.00, // G4
      20: 440.00, // A4
      22: 523.25, // C5
      24: 659.25, // E5
      26: 587.33, // D5
      28: 440.00, // A4
      30: 349.23  // F4
    };

    if (raceMelody[step]) {
      this.playTone(raceMelody[step], 'square', time, 0.18, 0.10, 2200, ctx);
    }
  }

  /**
   * Trilha 3: Guerra de Bolas de Neve (Snowball Skirmish)
   * Andamento de batalha (122 BPM), percussão tensa, acordes staccato e baixo misterioso.
   */
  private scheduleWarStep(step: number, time: number, ctx: AudioContext) {
    const subStep = step % 16;

    // Batidas tribais de neve
    if (subStep === 0 || subStep === 6 || subStep === 10) {
      this.playKick(time, ctx);
    }
    if (subStep === 4 || subStep === 12) {
      this.playSnare(time, ctx);
    }
    if (subStep % 2 === 0) {
      this.playHiHat(time, false, ctx);
    }

    // Baixo tenso em Mi menor (E2 = 82.4Hz)
    const warBass = (step < 16) ? 82.41 : 73.42;
    if (subStep === 0 || subStep === 3 || subStep === 8 || subStep === 11) {
      this.playTone(warBass, 'triangle', time, 0.22, 0.22, 700, ctx);
    }

    // Stabs de sintetizador staccato
    const warStabs: { [step: number]: number } = {
      2: 329.63,  // E4
      4: 392.00,  // G4
      7: 493.88,  // B4
      12: 587.33, // D5
      14: 493.88, // B4
      18: 349.23, // F4
      20: 440.00, // A4
      23: 523.25, // C5
      28: 659.25  // E5
    };

    if (warStabs[step]) {
      this.playTone(warStabs[step], 'sawtooth', time, 0.14, 0.12, 1600, ctx);
    }
  }
}
