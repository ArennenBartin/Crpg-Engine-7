import type { ConditionData, ShopPriceModifierData } from "../schema/game";
import type { PlaySave } from "../schema/save";

// ── Clock phases ─────────────────────────────────────────────────────────────
// Single source of truth for phase boundaries; conditions and the HUD both
// read from here so they can never disagree.

export type ClockPhaseId =
  | "witching_hour"
  | "night"
  | "dawn"
  | "day"
  | "dusk";

export const getClockPhaseId = (hour: number): ClockPhaseId => {
  if (hour < 1) return "witching_hour";
  if (hour < 5) return "night";
  if (hour < 7) return "dawn";
  if (hour < 18) return "day";
  if (hour < 22) return "dusk";
  return "night";
};

export const CLOCK_PHASE_LABELS: Record<ClockPhaseId, string> = {
  witching_hour: "Witching Hour",
  night: "Night",
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
};

// ── Condition evaluation ────────────────────────────────────────────────────

export interface ConditionContext {
  flags: Record<string, any>;
  quests: Record<string, any>;
  inventory: { id: string; count: number }[];
  party: string[];
  clockMinutes: number;
  factionRep: Record<string, number>;
}

export const buildConditionContext = (
  save: PlaySave | null | undefined,
): ConditionContext => ({
  flags: save?.flags || {},
  quests: save?.quests || {},
  inventory: save?.inventory || [],
  party: save?.party_members || [],
  clockMinutes: save?.clock_minutes ?? 0,
  factionRep: save?.faction_rep || {},
});

const hourInRange = (hour: number, gte?: number, lt?: number) => {
  const lo = gte ?? 0;
  const hi = lt ?? 24;
  // Wrapping range (e.g. 22 → 5 covers late night past midnight).
  if (lo > hi) return hour >= lo || hour < hi;
  return hour >= lo && hour < hi;
};

// A missing/empty condition always passes. Predicates within one node are
// ANDed; `all`, `any` and `not` compose nested conditions.
export const evaluateCondition = (
  condition: ConditionData | null | undefined,
  ctx: ConditionContext,
): boolean => {
  if (!condition) return true;

  if (condition.all && !condition.all.every((c) => evaluateCondition(c, ctx)))
    return false;
  if (condition.any && !condition.any.some((c) => evaluateCondition(c, ctx)))
    return false;
  if (condition.not && evaluateCondition(condition.not, ctx)) return false;

  if (
    condition.switch !== undefined &&
    !!ctx.flags[condition.switch] !== (condition.switch_value ?? true)
  )
    return false;

  if (
    condition.quest !== undefined &&
    ctx.quests[condition.quest] !== condition.quest_state
  )
    return false;

  if (condition.has_item !== undefined) {
    const count =
      ctx.inventory.find((entry) => entry.id === condition.has_item)?.count ||
      0;
    if (count < (condition.item_count ?? 1)) return false;
  }

  if (
    condition.party_contains !== undefined &&
    !ctx.party.includes(condition.party_contains)
  )
    return false;

  if (condition.faction !== undefined) {
    const rep = ctx.factionRep[condition.faction] ?? 0;
    if (condition.rep_gte !== undefined && rep < condition.rep_gte)
      return false;
    if (condition.rep_lte !== undefined && rep > condition.rep_lte)
      return false;
  }

  const hour = Math.floor(ctx.clockMinutes / 60) % 24;

  if (condition.time_of_day !== undefined) {
    const phase = getClockPhaseId(hour);
    const allowed = Array.isArray(condition.time_of_day)
      ? condition.time_of_day
      : [condition.time_of_day];
    const matches = allowed.some(
      (entry) =>
        entry === phase || (entry === "night" && phase === "witching_hour"),
    );
    if (!matches) return false;
  }

  if (condition.hour_gte !== undefined || condition.hour_lt !== undefined) {
    if (!hourInRange(hour, condition.hour_gte, condition.hour_lt))
      return false;
  }

  return true;
};

// ── Shop pricing ────────────────────────────────────────────────────────────

// Applies each passing modifier in order: price * multiplier + delta.
// Result is rounded and never negative.
export const computeShopPrice = (
  basePrice: number,
  modifiers: ShopPriceModifierData[] | undefined,
  ctx: ConditionContext,
): number => {
  let price = basePrice;
  for (const modifier of modifiers || []) {
    if (!evaluateCondition(modifier.condition, ctx)) continue;
    price = price * (modifier.multiplier ?? 1) + (modifier.delta ?? 0);
  }
  return Math.max(0, Math.round(price));
};
