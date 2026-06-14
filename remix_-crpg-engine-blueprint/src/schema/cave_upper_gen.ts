import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Cave Upper Map ────────────────────────────────────────────────────────
// The eastern cave system — first level. A descending path from the surface
// into the cave mouth, branching tunnel, grotto with the sigil offering,
// and corridor south to the deep cave exit.
//
// Exits: north (→ residential, surface return), south (→ cave deep)
//
//   ┌────────────────────────────────────┐
//   │  road north (cave path, surface)   │
//   │          │                         │
//   │     [Cave Mouth]                   │
//   │          │                         │
//   │  [Grotto] ── [Tunnel] ── [Branch]  │
//   │  (sigil)       │                   │
//   │                │                   │
//   │          [Corridor South]          │
//   │                ↓                   │
//   │         exit → cave deep           │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const CAVE_UPPER_W = MAX_X - MIN_X + 1;
export const CAVE_UPPER_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveUpperCells = (): {
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

  // Cave maps use a different approach: void by default, carve walkable areas.
  // We fill with inactive void, then carve cave chambers as walkable ground.

  // Start with void everywhere
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x, y: 0, z,
        active: true, walkable: false, blocks_los: true,
        height: 0, visual_height: 2, // cave walls feel taller
        terrain: "stone", surface_tag: "none", object_id: MARBLE,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // Carve helper: make cells walkable ground
  const carve = (x: number, z: number) => {
    const c = get(x, z);
    if (c) {
      c.walkable = true;
      c.blocks_los = false;
      c.visual_height = 0;
      c.object_id = GROUND;
      c.terrain = "grass"; // cave dirt
    }
  };
  const carveRect = (x0: number, z0: number, x1: number, z1: number) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) carve(x, z);
  };

  // ── Cave Path (north entrance, z = -20 to -12) ────────────────────────
  // Road from surface, narrows into cave mouth
  carveRect(-3, -20, 3, -12); // entrance corridor from north exit
  carveRect(-2, -20, 2, -20); // narrow at map edge (exit cells)

  // ── Cave Mouth (z = -12 to -6) ────────────────────────────────────────
  carveRect(-5, -12, 5, -6); // first chamber, wider
  placeIfClear("obj_lantern_post", -4, -10, [0, 1]);
  placeIfClear("obj_lantern_post", 4, -10, [0, 1]);

  // ── Main Tunnel (z = -6 to 6, x = -3 to 3) ────────────────────────────
  carveRect(-3, -6, 3, 6); // central corridor

  // ── Grotto (west branch, x = -14 to -5, z = -3 to 3) ──────────────────
  carveRect(-14, -3, -4, 3); // grotto chamber
  placeIfClear("obj_p_shrine_stone", -10, 0, [0, 1]);
  placeContainer("cnt_grotto_offering", -12, -1, {
    name: "Shrine Offering",
    items: [{ item_id: "itm_cave_sigil" }, { item_id: "itm_votive", count: 2 }],
  });
  placeItem("wi_cave_potion_1", "itm_health_potion", -8, 2);

  // ── East Branch (x = 4 to 12, z = -2 to 2) ────────────────────────────
  carveRect(4, -2, 12, 2); // side alcove
  placeIfClear("obj_column_broken", 8, 0, [0, 1]);
  placeItem("wi_cave_potion_2", "itm_health_potion", 10, 1);

  // ── South Corridor (z = 6 to 18, narrow) ──────────────────────────────
  carveRect(-2, 6, 2, 20); // corridor toward deep cave exit
  // The deep gate: blocked until player has sigil
  // (Triggers handle the gate; the cells are walkable)

  // ── Entity Placements (enemies) ────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [0, -11] }, // cave entrance save candle
    { entity_id: "ent_rite_remnant_1", cell: [0, -4] },
    { entity_id: "ent_rite_remnant_2", cell: [-2, 3] },
    { entity_id: "ent_rite_remnant_3", cell: [1, 8] },
    { entity_id: "ent_candle_eaten_1", cell: [-11, 1] }, // grotto
    { entity_id: "ent_candle_eaten_2", cell: [-8, -2] }, // grotto
    { entity_id: "ent_partial_conversion_1", cell: [8, -1] }, // east branch
  ];

  // ── Triggers ───────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    // Cave music on enter
    {
      id: "trg_cave_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_network_upper_enter",
      once: false,
    },
    // Gate: deep cave blocked without sigil
    {
      id: "trg_gate_deep_0",
      cell: [0, 14],
      type: "step",
      conditions: [],
      condition: { not: { has_item: "itm_cave_sigil" } },
      cutscene_id: "cut_gate_blocked_deep",
      once: false,
    },
    {
      id: "trg_gate_deep_1",
      cell: [-1, 14],
      type: "step",
      conditions: [],
      condition: { not: { has_item: "itm_cave_sigil" } },
      cutscene_id: "cut_gate_blocked_deep",
      once: false,
    },
    {
      id: "trg_gate_deep_2",
      cell: [1, 14],
      type: "step",
      conditions: [],
      condition: { not: { has_item: "itm_cave_sigil" } },
      cutscene_id: "cut_gate_blocked_deep",
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
