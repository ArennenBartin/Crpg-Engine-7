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
