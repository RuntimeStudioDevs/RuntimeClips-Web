// RuntimeClips-Web — Sintetizador de audio retro estilo 8-bit Habbo Hotel (Web Audio API)
// Sin descargas de audio externas, 100% sintetizado en el cliente.

let ctx: AudioContext | null = null;
let muted = localStorage.getItem('runtimeclips_habbo_muted') === 'true';

function getContext(): AudioContext | null {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// Desbloqueo de audio por interacción
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => getContext(), { once: true });
  window.addEventListener('keydown', () => getContext(), { once: true });
}

export const habboAudio = {
  isMuted(): boolean {
    return muted;
  },

  toggleMute(): boolean {
    muted = !muted;
    localStorage.setItem('runtimeclips_habbo_muted', String(muted));
    return muted;
  },

  // Blip retro de mensaje/burbuja de diálogo Habbo
  playBubble(): void {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880.00, now + 0.04); // A5

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  },

  // Timbre de entrada a sala de Habbo Hotel (Two-tone: G5 -> C5)
  playDoorbell(): void {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    const now = ac.currentTime;
    const notes = [783.99, 523.25]; // G5, C5

    notes.forEach((freq, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = now + idx * 0.16;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  },

  // Clic en Furni / selección
  playFurniClick(): void {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  },

  // Sonido de error / Bobba
  playErrorBobba(): void {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  },

  // Fanfarria 8-bit Habbo de victoria (C5 -> E5 -> G5 -> C6)
  playFanfare(): void {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    const now = ac.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = now + idx * 0.1;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  },
};
