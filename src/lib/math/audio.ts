let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  return ctx;
}

export function unlockAudio() {
  const audio = ac();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
}

function tone(freq: number, dur: number, gain = 0.05, type: OscillatorType = "sine", delay = 0) {
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playOk() {
  tone(523.25, 0.12, 0.05, "triangle");
  tone(659.25, 0.16, 0.04, "triangle", 0.07);
}

export function playBad() {
  tone(196, 0.22, 0.05, "sine");
}

export function playCombo(n: number) {
  const steps = Math.min(4, 1 + Math.floor(n / 3));
  for (let i = 0; i < steps; i += 1) tone(523.25 * (1 + i * 0.17), 0.1, 0.04, "triangle", i * 0.05);
}

export function playWin() {
  tone(523.25, 0.14, 0.05, "triangle", 0);
  tone(659.25, 0.14, 0.05, "triangle", 0.1);
  tone(783.99, 0.22, 0.05, "triangle", 0.2);
}

export function playTap() {
  tone(880, 0.04, 0.02, "square");
}
