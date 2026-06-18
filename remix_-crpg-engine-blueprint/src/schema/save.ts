// Per-container runtime state. Fields left undefined fall back to the
// authored ContainerPlacement values (so a delta that only unlocks a chest
// doesn't clobber its authored inventory).
export interface ContainerSaveState {
  items?: { item_id: string; count: number }[];
  locked?: boolean;
  opened?: boolean;
}

// What the player has changed about a map: looted ground items, items they
// dropped, and container contents. Keyed by map id in PlaySave.map_deltas.
export interface MapDelta {
  taken_items?: string[]; // authored item_placement ids that were picked up
  opened_doors?: string[]; // authored obj_p_door placement keys that were opened
  dropped_items?: {
    id: string;
    item_id: string;
    cell: [number, number];
    count: number;
  }[];
  containers?: Record<string, ContainerSaveState>;
}

export interface PlaySave {
  schema: "familiar_dark_save_v1";
  package_version: string;
  current_map_id: string;
  player: {
    cell: [number, number];
    facing: [number, number];
    sprite_id?: string;
  };
  playerStats: {
    hp: number;
    max_hp: number;
    mp: number;
    max_mp: number;
    attack: number;
    defense: number;
    speed: number;
    energy: number;
  };
  level?: number;
  experience?: number;
  pending_level_ups?: number;
  known_skills: string[];
  flags: Record<string, any>;
  quests: Record<string, any>;
  evidence: string[];
  inventory: { id: string; count: number }[];
  money: number;
  entity_states: Record<string, any>;
  party_members: string[];
  map_deltas?: Record<string, MapDelta>;
  // Minutes since day 0, 00:00. Advances as turns pass.
  clock_minutes?: number;
  // Faction reputation by faction id; missing entries count as 0.
  faction_rep?: Record<string, number>;
  // Document IDs the player has read (for condition checks and journal).
  read_documents?: string[];
  // ── Turn-queue combat ──
  // True while hostiles are engaged. The queue holds actor ids in initiative
  // order: "player", party entity ids ("ent_aldric"), and enemy entity state
  // keys. active_turn_id points at the actor whose turn it is.
  in_combat?: boolean;
  combat_queue?: string[];
  active_turn_id?: string | null;
  combat_xp_pool?: number;
}
