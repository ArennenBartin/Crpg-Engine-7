// Minimal music layer for the play_music cutscene verb. One looping track at
// a time; starting a new track replaces the old one. Browser autoplay policy
// may block playback until the player has interacted with the page — cutscene
// clicks count, so in practice music started from dialogue/cutscenes plays.

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export const playMusic = (
  url: string,
  opts: { loop?: boolean; volume?: number } = {},
) => {
  if (currentAudio && currentUrl === url) {
    currentAudio.volume = Math.min(1, Math.max(0, opts.volume ?? currentAudio.volume));
    return;
  }
  stopMusic();
  const audio = new Audio(url);
  audio.loop = opts.loop ?? true;
  audio.volume = Math.min(1, Math.max(0, opts.volume ?? 0.7));
  audio.play().catch((err) => {
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
