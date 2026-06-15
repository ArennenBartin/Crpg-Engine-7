import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Cave Grotto Map ─────────────────────────────────────────────────────
// A crystal-studded side cavern branching east off the Cave Upper level.
// Bioluminescent growths, a shallow underground pool, and ancient carved
// niches containing offerings. Quieter than the main tunnels.
//
// Dead-end map: only exit is west (→ cave upper).
// No paths carved to north, south, or east edges.
//
//   ┌────────────────────────────────────┐
//   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ (void/stone)
//   │  ▓▓▓▓ [Crystal Pool] ▓▓▓▓▓▓▓▓▓▓  │
//   │  ▓▓▓▓      │          ▓▓▓▓▓▓▓▓▓  │
//   │  ← exit ─ [Main Chamber] ─ [Niche]│
//   │  ▓▓▓▓      │          ▓▓▓▓▓▓▓▓▓  │
//   │  ▓▓▓▓ [Offering Alcove] ▓▓▓▓▓▓▓  │
//   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const GROTTO_W = MAX_X - MIN_X + 1;
export const GROTTO_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WATER = "obj_water";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveGrottoCells = (): {
  cells: CellData[];
  custom_object_placements: ObjectPlacementData[];
  item_placements: WorldItemPlacementData[];
  container_placements: ContainerPlacementData[];
  entity_placements: EntityPlacementData[];
  triggers: TriggerData[];
} => {
  const cells: CellData[] = [];
  const custom_object_placements: ObjectPlacementData[] = [];
  const item_placements: WorldItemPlacementData[] = [];
  const container_placements: ContainerPlacementData[] = [];
  const grid = new Map<string, CellData>();
  const reserved = new Set<string>();

  const get = (x: number, z: number) => grid.get(key(x, z));
  const reserve = (x: number, z: number) => reserved.add(key(x, z));

  const place = (
    objectId: string, x: number, z: number, facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const placement: ObjectPlacementData = { object_id: objectId, cell: [x, z], facing };
    if (opts.dialogue) placement.dialogue_id = opts.dialogue;
    custom_object_placements.push(placement);
    reserve(x, z);
    if (opts.block !== false) {
      const c = get(x, z);
      if (c) { c.walkable = false; c.blocks_los = false; }
    }
  };

  const placeIfClear = (
    objectId: string, x: number, z: number, facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const c = get(x, z);
    if (!c || !c.walkable || reserved.has(key(x, z))) return false;
    place(objectId, x, z, facing, opts);
    return true;
  };

  const placeContainer = (
    id: string, x: number, z: number,
    opts: { name?: string; locked?: boolean; key?: string; items?: { item_id: string; count?: number }[] } = {},
  ) => {
    container_placements.push({
      id, object_id: "obj_chest", cell: [x, z], facing: [0, 1],
      display_name: opts.name, locked: opts.locked ?? false,
      key_item_id: opts.key, consume_key: false,
      items: (opts.items || []).map(e => ({ item_id: e.item_id, count: e.count ?? 1 })),
    });
    reserve(x, z);
    const c = get(x, z);
    if (c) { c.walkable = false; c.blocks_los = false; }
  };

  const placeItem = (id: string, itemId: string, x: number, z: number, count = 1) => {
    item_placements.push({ id, item_id: itemId, cell: [x, z], count });
    reserve(x, z);
  };

  // Start with void (non-walkable stone) everywhere — cave style
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x, y: 0, z,
        active: true, walkable: false, blocks_los: true,
        height: 0, visual_height: 2,
        terrain: "stone", surface_tag: "none", object_id: MARBLE,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // Carve helper
  const carve = (x: number, z: number) => {
    const c = get(x, z);
    if (c) {
      c.walkable = true;
      c.blocks_los = false;
      c.visual_height = 0;
      c.object_id = GROUND;
      c.terrain = "grass";
    }
  };
  const carveRect = (x0: number, z0: number, x1: number, z1: number) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) carve(x, z);
  };
  const floodWater = (x0: number, z0: number, x1: number, z1: number) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const c = get(x, z);
        if (c) {
          c.walkable = false;
          c.blocks_los = false;
          c.visual_height = 0;
          c.object_id = WATER;
          c.terrain = "water";
          c.surface_tag = "water";
        }
      }
    }
  };

  // ── Entry Corridor (west, x = -20 to -10, z = -2 to 2) ────────────────
  // Path from west edge (exit) into the grotto. Only west edge has exit.
  carveRect(-20, -2, -10, 2);

  // ── Main Chamber (x = -10 to 6, z = -8 to 8) ──────────────────────────
  carveRect(-10, -8, 6, 8);

  // ── Crystal Pool (north alcove, x = -6 to 4, z = -14 to -9) ────────────
  carveRect(-6, -14, 4, -9);
  floodWater(-4, -13, 2, -10); // shallow pool

  // ── Offering Alcove (south, x = -6 to 4, z = 9 to 14) ──────────────────
  carveRect(-6, 9, 4, 14);
  placeIfClear("obj_p_shrine_stone", 0, 12, [0, 1]);
  placeContainer("cnt_grotto_crystal", -2, 13, {
    name: "Crystal Niche",
    items: [{ item_id: "itm_health_potion", count: 2 }, { item_id: "itm_votive" }],
  });
  placeItem("wi_grotto_shard", "itm_glass_shard", 2, 13);

  // ── East Niche (small, x = 7 to 12, z = -3 to 3) ──────────────────────
  carveRect(7, -3, 12, 3);
  placeIfClear("obj_column", 10, 0, [0, 1]);
  placeContainer("cnt_grotto_east", 11, -2, {
    name: "Carved Recess",
    items: [{ item_id: "itm_cave_sigil" }],
  });

  // ── Chamber details ─────────────────────────────────────────────────────
  placeIfClear("obj_column_broken", -8, -4, [0, 1]);
  placeIfClear("obj_column_broken", -8, 4, [0, 1]);
  placeIfClear("obj_column_broken", 4, -4, [0, 1]);
  placeIfClear("obj_column_broken", 4, 4, [0, 1]);
  placeIfClear("obj_lantern_post", -10, 0, [0, 1]);
  placeIfClear("obj_lantern_post", 0, -8, [0, 1]);
  placeItem("wi_grotto_potion", "itm_health_potion", -4, 6);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [-14, 0] }, // save candle in entry corridor
    { entity_id: "ent_candle_eaten_2", cell: [0, 0] }, // enemy in main chamber
    { entity_id: "ent_rite_remnant_2", cell: [-2, 10] }, // enemy in offering alcove
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_grotto_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_network_upper_enter",
      once: false,
    },
  ];

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers,
  };
};
