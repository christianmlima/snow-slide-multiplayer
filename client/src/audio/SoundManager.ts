export class SoundManager {
  private soundEnabled = true;
  private audioCtx: AudioContext | null = null;

  constructor(soundEnabled = true) {
    this.soundEnabled = soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initAudio();
    return this.audioCtx;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, gainVal = 0.15) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  public playSlalomChime() {
    if (!this.soundEnabled) return;
    this.playTone(659.25, 'sine', 0.12, 0.2);
    setTimeout(() => this.playTone(880.00, 'triangle', 0.22, 0.25), 65);
  }

  public playJumpSound() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, this.audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.28);
    } catch (e) {}
  }

  public playVictoryFanfare() {
    if (!this.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.22), idx * 120);
    });
  }

  public playCoinSound() {
    if (!this.soundEnabled) return;
    this.playTone(987.77, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.18, 0.2), 70);
  }

  public playSnowThrowSound(charge = 0.5) {
    if (!this.soundEnabled) return;
    const baseFreq = 320 + charge * 260;
    this.playTone(baseFreq, 'sine', 0.08, 0.12 + charge * 0.12);
  }

  public playSnowSplatSound() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // 1. Ruído de impacto e esfarelamento de neve (Crunch / Splat / Powder burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.22);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      // Filtro passa-faixa dinâmico para o "crunch" característico de neve estilhaçando
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
      filter.Q.setValueAtTime(1.4, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.38, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noiseSrc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);

      // 2. Thump subsônico de impacto físico da massa de neve compactada
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      oscGain.gain.setValueAtTime(0.28, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  public playToyGunPopSound() {
    if (!this.soundEnabled) return;
    this.playTone(720, 'triangle', 0.04, 0.35);
    setTimeout(() => this.playTone(220, 'sine', 0.07, 0.4), 20);
  }

  public playTargetHitSound() {
    if (!this.soundEnabled) return;
    this.playTone(520, 'square', 0.04, 0.22);
    setTimeout(() => this.playTone(880, 'sine', 0.12, 0.25), 35);
  }

  public playCarnivalHornSound() {
    if (!this.soundEnabled) return;
    this.playTone(440, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(554.37, 'sawtooth', 0.18, 0.22), 120);
    setTimeout(() => this.playTone(659.25, 'sawtooth', 0.3, 0.28), 260);
  }

  public playDriftSparkSound() {
    if (!this.soundEnabled) return;
    this.playTone(800 + Math.random() * 400, 'sawtooth', 0.05, 0.08);
  }

  public playMiniTurboBoostSound(tier = 1) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const baseFreq = tier === 3 ? 320 : tier === 2 ? 260 : 200;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) {}
  }

  public playTrickSound() {
    if (!this.soundEnabled) return;
    this.playTone(523.25, 'triangle', 0.08, 0.2);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.08, 0.22), 60);
    setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.25), 120);
  }

  public playItemBoxHitSound() {
    if (!this.soundEnabled) return;
    this.playTone(880, 'sine', 0.08, 0.2);
    setTimeout(() => this.playTone(1320, 'triangle', 0.14, 0.25), 50);
  }

  public playItemRouletteSound() {
    if (!this.soundEnabled) return;
    this.playTone(700 + Math.random() * 300, 'square', 0.04, 0.1);
  }

  public playNitroSound() {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.62);
    } catch (e) {}
  }

  public playIceSlickSound() {
    if (!this.soundEnabled) return;
    this.playTone(320, 'sine', 0.18, 0.25);
    setTimeout(() => this.playTone(210, 'triangle', 0.24, 0.3), 100);
  }

  public playShieldSound() {
    if (!this.soundEnabled) return;
    this.playTone(440, 'sine', 0.2, 0.2);
    setTimeout(() => this.playTone(660, 'sine', 0.3, 0.25), 80);
  }

  public playAchievementSound() {
    if (!this.soundEnabled) return;
    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.28, 0.25), idx * 80);
    });
  }
}
