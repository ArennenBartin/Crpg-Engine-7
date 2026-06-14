import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Cave Deep Map ─────────────────────────────────────────────────────────
// The deepest level. Contains the log chamber (grid sickness evidence),
// the boss arena (the Grid-Sick / Bound Remnant), and the ossuary passage
// leading to a locked shrine door (Act 2 tease).
//
// Exits: north (→ cave upper, return)
//
//   ┌────────────────────────────────────┐
//   │      exit north (→ cave upper)     │
//   │              │                     │
//   │       [Entry Corridor]             │
//   │              │                     │
//   │  [Log Chamber] ── [Main Corridor]  │
//   │  (writings)          │             │
//   │                      │             │
//   │              [Boss Arena]          │
//   │              (Grid-Sick)           │
//   │                      │             │
//   │       [Ossuary] ── [Shrine Door]   │
//   │                    (locked, Act 2) │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const CAVE_DEEP_W = MAX_X - MIN_X + 1;
export const CAVE_DEEP_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveDeepCells = (): {
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

  // Void by default, carve walkable areas
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

  // ── Entry Corridor (north, z = -20 to -12) ────────────────────────────
  carveRect(-2, -20, 2, -12); // from north exit

  // ── Log Chamber (west branch, x = -14 to -4, z = -12 to -6) ───────────
  carveRect(-14, -12, -3, -6);
  // Scratched walls — interact triggers for the grid sickness writings
  placeIfClear("obj_column_broken", -12, -10, [0, 1]);
  placeIfClear("obj_column_broken", -6, -10, [0, 1]);
  placeIfClear("obj_column_broken", -10, -7, [0, 1]);
  placeItem("wi_deep_shard", "itm_glass_shard", -8, -8);

  // ── Main Corridor (z = -12 to -2) ─────────────────────────────────────
  carveRect(-2, -12, 2, -2);

  // ── Boss Arena (z = -2 to 12, wider) ───────────────────────────────────
  carveRect(-8, -2, 8, 12);
  // Arena pillars
  placeIfClear("obj_column_broken", -6, 0, [0, 1]);
  placeIfClear("obj_column_broken", 6, 0, [0, 1]);
  placeIfClear("obj_column_broken", -6, 10, [0, 1]);
  placeIfClear("obj_column_broken", 6, 10, [0, 1]);

  // ── Ossuary Passage (south of arena, z = 12 to 18) ────────────────────
  carveRect(-2, 12, 2, 18);
  // West branch to shrine door
  carveRect(-10, 15, -3, 19);
  // Shrine door (blocked — Act 2 tease)
  placeIfClear("obj_p_arch", -8, 19, [0, 1]);
  // Make the arch cell non-walkable (locked door)
  const shrineCell = get(-8, 19);
  if (shrineCell) shrineCell.walkable = false;

  placeContainer("cnt_ossuary_cache", -6, 17, {
    name: "Bone Niche",
    items: [{ item_id: "itm_votive", count: 2 }],
  });

  // ── Entity Placements ──────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    // Enemies guarding log chamber / approach
    { entity_id: "ent_partial_conversion_2", cell: [-6, -9] },
    { entity_id: "ent_partial_conversion_3", cell: [0, -8] },
    // Boss: Bound Remnant / The Grid-Sick (center of arena)
    { entity_id: "ent_bound_remnant", cell: [0, 5] },
  ];

  // ── Triggers ───────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    // Deep cave music
    {
      id: "trg_deep_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_depths_enter",
      once: false,
    },
    // Boss intro
    {
      id: "trg_boss_activate",
      cell: [0, 0],
      type: "step",
      conditions: [],
      condition: { not: { switch: "cyberghost_defeated" } },
      cutscene_id: "cut_boss_intro",
      once: true,
    },
    // Grid sickness log triggers (interact on log chamber walls)
    {
      id: "trg_log_1",
      cell: [-12, -10],
      type: "interact",
      conditions: [],
      cutscene_id: "cut_read_log_1",
      once: true,
    },
    {
      id: "trg_log_2",
      cell: [-6, -10],
      type: "interact",
      conditions: [],
      cutscene_id: "cut_read_log_2",
      once: true,
    },
    {
      id: "trg_log_3",
      cell: [-10, -7],
      type: "interact",
      conditions: [],
      cutscene_id: "cut_read_log_3",
      once: true,
    },
    {
      id: "trg_log_4",
      cell: [-8, -8],
      type: "interact",
      conditions: [],
      cutscene_id: "cut_read_log_4",
      once: true,
    },
    // Ossuary shrine door (locked for Act 1)
    {
      id: "trg_shrine_locked",
      cell: [-8, 18],
      type: "interact",
      conditions: [],
      cutscene_id: "cut_gate_blocked_shrine",
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
