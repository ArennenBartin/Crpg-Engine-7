// Minimal music/SFX layer for play mode. One looping music track at a time;
// sound effects are short overlapping Audio instances. Browser autoplay policy
// may block playback until the player has interacted with the page — cutscene
// clicks count, so in practice music and SFX started from play actions work.

import { resolveAssetUrl } from './assetBase';

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export const SFX = {
  ui_click: "/sfx/ui-click.wav",
  ui_back: "/sfx/ui-back.wav",
  dialogue_open: "/sfx/dialogue-open.wav",
  dialogue_next: "/sfx/dialogue-next.wav",
  document_open: "/sfx/document-open.wav",
  item_pickup: "/sfx/item-pickup.wav",
  coin: "/sfx/coin.wav",
  save_candle: "/sfx/save-candle.wav",
  shop_open: "/sfx/shop-open.wav",
  door_transition: "/sfx/door-transition.wav",
  footstep_stone: "/sfx/footstep-stone.wav",
  bump: "/sfx/bump.wav",
  melee_swing: "/sfx/melee-swing.wav",
  melee_hit: "/sfx/melee-hit.wav",
  melee_crit: "/sfx/melee-crit.wav",
  enemy_defeat: "/sfx/enemy-defeat.wav",
  spell_cast: "/sfx/spell-cast.wav",
  spell_hit: "/sfx/spell-hit.wav",
  heal: "/sfx/heal.wav",
  level_up: "/sfx/level-up.wav",
  warning: "/sfx/warning.wav",
} as const;

export type SoundEffectId = keyof typeof SFX;

const sfxLastPlayed = new Map<string, number>();

const isUrlLike = (value: string) =>
  value.startsWith("/") ||
  value.startsWith("http://") ||
  value.startsWith("https://") ||
  value.startsWith("data:");

const isAutoplayBlockError = (err: unknown) => {
  const name =
    typeof err === "object" && err && "name" in err ? String((err as any).name) : "";
  const message =
    typeof err === "object" && err && "message" in err
      ? String((err as any).message)
      : String(err || "");
  return (
    name === "NotAllowedError" ||
    message.includes("user didn't interact") ||
    message.includes("play() failed because")
  );
};

export const getSoundUrl = (
  idOrUrl: SoundEffectId | string,
  customSounds: Record<string, string> = {},
) => {
  if (isUrlLike(idOrUrl)) return idOrUrl;
  return customSounds[idOrUrl] || SFX[idOrUrl as SoundEffectId] || idOrUrl;
};

export const playMusic = (
  url: string,
  opts: { loop?: boolean; volume?: number } = {},
) => {
  if (currentAudio && currentUrl === url) {
    currentAudio.volume = Math.min(1, Math.max(0, opts.volume ?? currentAudio.volume));
    return;
  }
  stopMusic();
  const audio = new Audio(resolveAssetUrl(url));
  audio.loop = opts.loop ?? true;
  audio.volume = Math.min(1, Math.max(0, opts.volume ?? 0.7));
  audio.play().catch((err) => {
    if (isAutoplayBlockError(err)) return;
    console.warn("Music playback blocked or failed:", err?.message || err);
  });
  currentAudio = audio;
  currentUrl = url;
  initAudioAnalyser(audio);
};

// The URL currently looping, or null. Lets the combat-music layer remember
// which ambient track to restore when a fight ends.
export const getCurrentMusicUrl = () => currentUrl;

export const stopMusic = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
  }
  currentAudio = null;
  currentUrl = null;
};

// ── Audio Analyser ───────────────────────────────────────────────────────────
// Connects a music element to an AnalyserNode so ScreenFX can read frequency
// data for audio-reactive effects. Silently no-ops if the browser blocks the
// AudioContext or if the element can't be sourced (CORS).

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let analyserBuffer: Uint8Array | null = null;
let analyserSourceEl: HTMLAudioElement | null = null;

const initAudioAnalyser = (audio: HTMLAudioElement) => {
  if (analyserSourceEl === audio) return; // already wired
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserNode = analyser;
    analyserBuffer = new Uint8Array(analyser.frequencyBinCount);
    analyserSourceEl = audio;
  } catch {
    // CORS or browser restriction — audio-reactive visuals gracefully disabled
  }
};

/** Returns 0–1 low-frequency (bass) amplitude of currently playing music. */
export const getAudioBass = (): number => {
  if (!analyserNode || !analyserBuffer) return 0;
  analyserNode.getByteFrequencyData(analyserBuffer);
  // Bins 0–5 cover roughly 0–512 Hz at fftSize=256 / 44100 Hz sample rate
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += analyserBuffer[i];
  return sum / (6 * 255);
};

/** Returns 0–1 overall amplitude of currently playing music. */
export const getAudioLevel = (): number => {
  if (!analyserNode || !analyserBuffer) return 0;
  analyserNode.getByteFrequencyData(analyserBuffer);
  let sum = 0;
  const len = analyserBuffer.length;
  for (let i = 0; i < len; i++) sum += analyserBuffer[i];
  return sum / (len * 255);
};

export const playSound = (
  idOrUrl: SoundEffectId | string | undefined,
  opts: {
    volume?: number;
    playbackRate?: number;
    cooldownMs?: number;
    customSounds?: Record<string, string>;
  } = {},
) => {
  if (!idOrUrl) return;
  const url = getSoundUrl(idOrUrl, opts.customSounds);
  const now = performance.now();
  const cooldownMs = opts.cooldownMs ?? 30;
  const lastPlayed = sfxLastPlayed.get(url) ?? -Infinity;
  if (now - lastPlayed < cooldownMs) return;
  sfxLastPlayed.set(url, now);

  const audio = new Audio(resolveAssetUrl(url));
  audio.loop = false;
  audio.volume = Math.min(1, Math.max(0, opts.volume ?? 0.6));
  audio.playbackRate = Math.min(4, Math.max(0.25, opts.playbackRate ?? 1));
  audio.play().catch((err) => {
    if (isAutoplayBlockError(err)) return;
    console.warn("Sound playback blocked or failed:", err?.message || err);
  });
};
