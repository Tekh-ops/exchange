/**
 * Procedural Retro 8-bit / 16-bit Web Audio Sound Synthesizer
 * Generates arcane spells, impacts, shield hums, button clicks,
 * and vintage gibberish banter voices (Petty Sorcerer vs Dark Mage).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;

  private getAudioContext(): AudioContext | null {
    try {
      if (typeof window === 'undefined') return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Retro button click
   */
  public playClick(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio errors should never crash user interactions
    }
  }

  /**
   * Arcane missile / dart cast sound
   */
  public playSpellCast(type: 'spark' | 'missile' | 'fire' | 'hex' | 'shield' | 'drain' | 'ice'): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      switch (type) {
        case 'ice':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
          gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
          break;

        case 'spark':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
          gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          break;

        case 'missile':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(960, t + 0.15);
          gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
          break;

        case 'fire':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.linearRampToValueAtTime(80, t + 0.3);
          gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
          break;

        case 'shield':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, t);
          osc.frequency.exponentialRampToValueAtTime(520, t + 0.25);
          gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          break;

        case 'hex':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.linearRampToValueAtTime(200, t + 0.2);
          gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
          break;

        case 'drain':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(350, t);
          osc.frequency.exponentialRampToValueAtTime(150, t + 0.25);
          gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
          break;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.4);
    } catch {
      // Audio errors should never crash user interactions
    }
  }

  /**
   * Crunchy impact hit sound
   */
  public playHit(isCritical: boolean = false): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isCritical ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isCritical ? 240 : 160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

      gain.gain.setValueAtTime((isCritical ? 0.4 : 0.25) * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.2);
    } catch {
      // Audio errors should never crash user interactions
    }
  }

  /**
   * Procedural retro gibberish dialogue voice
   */
  public playWizardVoice(speaker: 'player' | 'enemy'): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (speaker === 'player') {
        const baseFreq = 420 + (Math.random() * 140 - 70);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, t + 0.06);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(t + 0.08);
      } else {
        const baseFreq = 110 + (Math.random() * 40 - 20);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, t + 0.08);
        gain.gain.setValueAtTime(0.18 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
      }
    } catch {
      // Audio errors should never crash user interactions
    }
  }

  /**
   * Fanfare / Victory Jingle
   */
  public playVictoryFanfare(): void {
    try {
      if (this.isMuted) return;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch {
            // Ignored
          }
        }, i * 120);
      });
    } catch {
      // Audio errors should never crash user interactions
    }
  }
  /**
   * Level-up ascending arpeggio
   */
  public playLevelUp(): void {
    try {
      if (this.isMuted) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.18 * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch {
            // Ignored
          }
        }, i * 85);
      });
    } catch {
      // Audio errors should never crash user interactions
    }
  }
  /**
   * Soft restorative chime for healing spells
   */
  public playHealChime(): void {
    try {
      if (this.isMuted) return;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.16 * this.masterVolume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch {
            // Ignored
          }
        }, i * 70);
      });
    } catch {
      // Audio errors should never crash user interactions
    }
  }

  /**
   * Resonant magical barrier hum
   */
  public playShieldResonance(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.18);
      gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.26);
    } catch {
      // Ignored
    }
  }

  /**
   * Element-specific impact sound
   */
  public playElementalImpact(
    element: 'fire' | 'ice' | 'lightning' | 'arcane' | 'poison' | 'defense' | 'heal',
    isCritical: boolean = false
  ): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) {
        this.playHit(isCritical);
        return;
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      switch (element) {
        case 'fire':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(isCritical ? 160 : 120, t);
          osc.frequency.exponentialRampToValueAtTime(35, t + 0.24);
          break;
        case 'ice':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, t);
          osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);
          break;
        case 'lightning':
          osc.type = 'square';
          osc.frequency.setValueAtTime(980, t);
          osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);
          break;
        case 'poison':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, t);
          osc.frequency.linearRampToValueAtTime(130, t + 0.22);
          break;
        default:
          osc.type = isCritical ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(isCritical ? 320 : 210, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
          break;
      }

      gain.gain.setValueAtTime((isCritical ? 0.34 : 0.22) * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.25);
    } catch {
      // Ignored
    }
  }
}

export const soundEngine = new SoundEngine();
