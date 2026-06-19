import { create } from "zustand";

// Transient combat feedback — floating damage numbers, hit flashes, and the
// player-hurt vignette. Never persisted; cleared by age, not by save/load.

export interface DamagePopup {
  id: number;
  cell: [number, number];
  // World-space Y the popup starts at (top of the target's sprite).
  y: number;
  text: string;
  color: string;
  born: number;
}

export const POPUP_LIFETIME_MS = 950;
export const HIT_FLASH_MS = 220;

// ── Ambient barks ────────────────────────────────────────────────────────────
// Overheard NPC-to-NPC speech rendered as floating text above the speaker. An
// "exchange" is a sequence of lines staggered in time so it reads as a back and
// forth; each line is its own world-anchored bubble.
export interface Bark {
  id: number;
  cell: [number, number];
  text: string;
  speaker: string;
  // performance.now() time this line should begin showing, and how long it
  // stays up.
  showAt: number;
  lifetime: number;
}

// How long a single overheard line stays legible, and how far apart successive
// lines in one exchange begin (slight overlap keeps the conversation flowing).
export const BARK_LINE_LIFETIME_MS = 3200;
export const BARK_LINE_STAGGER_MS = 2300;

interface FxState {
  popups: DamagePopup[];
  barks: Bark[];
  // Entity state key (or "player") -> timestamp of the last hit taken.
  hitFlashes: Record<string, number>;
  // Timestamp of the last time the player took damage (drives the vignette).
  playerHurtAt: number;
  addPopup: (
    cell: [number, number],
    text: string,
    color?: string,
    y?: number,
  ) => void;
  enqueueBark: (
    lines: { cell: [number, number]; text: string; speaker: string }[],
  ) => void;
  flashEntity: (key: string) => void;
  markPlayerHurt: () => void;
  prunePopups: () => void;
  pruneBarks: () => void;
}

let nextPopupId = 1;
let nextBarkId = 1;

export const useFxStore = create<FxState>()((set) => ({
  popups: [],
  barks: [],
  hitFlashes: {},
  playerHurtAt: 0,
  addPopup: (cell, text, color = "#ffffff", y = 1.1) =>
    set((state) => {
      const now = performance.now();
      // Stagger popups landing on the same tile so they don't overlap.
      const stacked = state.popups.filter(
        (p) =>
          p.cell[0] === cell[0] &&
          p.cell[1] === cell[1] &&
          now - p.born < POPUP_LIFETIME_MS,
      ).length;
      return {
        popups: [
          ...state.popups.filter((p) => now - p.born < POPUP_LIFETIME_MS),
          {
            id: nextPopupId++,
            cell,
            y: y + stacked * 0.34,
            text,
            color,
            born: now,
          },
        ],
      };
    }),
  enqueueBark: (lines) =>
    set((state) => {
      const now = performance.now();
      // Drop any still-pending exchange so a new one doesn't talk over it.
      const alive = state.barks.filter(
        (b) => now < b.showAt + b.lifetime && b.showAt <= now,
      );
      const queued = lines.map((line, i) => ({
        id: nextBarkId++,
        cell: line.cell,
        text: line.text,
        speaker: line.speaker,
        showAt: now + i * BARK_LINE_STAGGER_MS,
        lifetime: BARK_LINE_LIFETIME_MS,
      }));
      return { barks: [...alive, ...queued] };
    }),
  flashEntity: (key) =>
    set((state) => ({
      hitFlashes: { ...state.hitFlashes, [key]: performance.now() },
    })),
  markPlayerHurt: () => set({ playerHurtAt: performance.now() }),
  prunePopups: () =>
    set((state) => {
      const now = performance.now();
      const alive = state.popups.filter(
        (p) => now - p.born < POPUP_LIFETIME_MS,
      );
      return alive.length === state.popups.length ? state : { popups: alive };
    }),
  pruneBarks: () =>
    set((state) => {
      const now = performance.now();
      const alive = state.barks.filter((b) => now < b.showAt + b.lifetime);
      return alive.length === state.barks.length ? state : { barks: alive };
    }),
}));
