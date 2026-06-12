// Shared combat tuning + dice. One damage model for bump attacks, Act
// attacks, follower assists, enemy hits, and skill payloads so numbers stay
// legible across the whole game.

// Hostiles within this Manhattan distance count as "engaged": they show HP
// bars and threat rings, the HUD shows the danger panel, movement drops to
// step-by-step, and combat music takes over.
export const THREAT_RADIUS = 6;

// Hostile AI gives chase within this distance (corridor design = encounter
// design, per the production plan — keep it fixed).
export const CHASE_RADIUS = 8;

export const CRIT_CHANCE = 0.1;
export const CRIT_MULT = 1.5;

export interface DamageRoll {
  dmg: number;
  crit: boolean;
}

// Basic melee: attack vs defense, 10% crits at 1.5x, never below 1.
export const rollMeleeDamage = (
  attack: number,
  defense: number,
): DamageRoll => {
  const base = Math.max(1, attack - defense);
  const crit = Math.random() < CRIT_CHANCE;
  return { dmg: crit ? Math.max(1, Math.round(base * CRIT_MULT)) : base, crit };
};

// Skill damage: payload value scaled by half the caster's attack, reduced by
// target defense. Keeps authored payload numbers meaningful while letting
// stats matter.
export const rollSkillDamage = (
  payloadValue: number,
  attack: number,
  defense: number,
): DamageRoll => {
  const base = Math.max(1, payloadValue + Math.floor(attack / 2) - defense);
  const crit = Math.random() < CRIT_CHANCE;
  return { dmg: crit ? Math.max(1, Math.round(base * CRIT_MULT)) : base, crit };
};
