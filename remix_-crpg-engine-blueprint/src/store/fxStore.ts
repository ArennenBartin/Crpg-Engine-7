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

interface FxState {
  popups: DamagePopup[];
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
  flashEntity: (key: string) => void;
  markPlayerHurt: () => void;
  prunePopups: () => void;
}

let nextPopupId = 1;

export const useFxStore = create<FxState>()((set) => ({
  popups: [],
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
}));
