// Synapse Audio Engine — ambient sounds that react to simulation state
// Uses Web Audio API to generate tones procedurally (no audio files needed)

let audioCtx: AudioContext | null = null;
let isEnabled = false;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function toggleAudio(enabled: boolean) {
  isEnabled = enabled;
  if (enabled) {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    startAmbient();
  } else {
    stopAmbient();
  }
}

export function isAudioEnabled(): boolean {
  return isEnabled;
}

// Ambient hum — very subtle low-frequency drone
function startAmbient() {
  if (ambientOsc) return;
  const ctx = getCtx();

  ambientOsc = ctx.createOscillator();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

  ambientGain = ctx.createGain();
  ambientGain.gain.setValueAtTime(0, ctx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);

  ambientOsc.connect(ambientGain);
  ambientGain.connect(ctx.destination);
  ambientOsc.start();
}

function stopAmbient() {
  if (ambientGain) {
    const ctx = getCtx();
    ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => {
      ambientOsc?.stop();
      ambientOsc?.disconnect();
      ambientGain?.disconnect();
      ambientOsc = null;
      ambientGain = null;
    }, 1100);
  }
}

// Update ambient based on global confidence
export function updateAmbientTone(globalConfidence: number) {
  if (!isEnabled || !ambientOsc || !ambientGain) return;
  const ctx = getCtx();
  // Pitch rises slightly with confidence: 55Hz → 82Hz
  const freq = 55 + (globalConfidence / 100) * 27;
  ambientOsc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.5);
  // Volume also increases slightly
  const vol = 0.02 + (globalConfidence / 100) * 0.03;
  ambientGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
}

// Ping sound — when an agent sends a thought
export function playThoughtPing(agentColor: string) {
  if (!isEnabled) return;
  const ctx = getCtx();

  // Map agent color to a frequency
  const colorFreqMap: Record<string, number> = {
    '#4FC3F7': 523,  // Oracle — C5
    '#B39DDB': 587,  // Nexus — D5
    '#FF7043': 659,  // Forge — E5
    '#66BB6A': 698,  // Echo — F5
    '#EF5350': 784,  // Cipher — G5
    '#FFEE58': 880,  // Sage — A5
  };
  const freq = colorFreqMap[agentColor] ?? 600;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

// Consensus chime — layered harmonic when consensus is reached
export function playConsensusChime() {
  if (!isEnabled) return;
  const ctx = getCtx();

  const freqs = [523, 659, 784, 1047]; // C major chord + octave
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 1.5);
  });
}

// Connection sound — brief sweep when edge activates
export function playConnectionSweep() {
  if (!isEnabled) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}
