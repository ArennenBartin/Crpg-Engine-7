import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Mouthstone Field Map ────────────────────────────────────────────────
// The barren field beyond the Mouthstone Gate. Cracked earth, scattered
// votary stones, and the looming Mouthstone monolith at the center. This
// is the pilgrimage approach — a sacred/dread site. Windswept, empty.
//
// Dead-end map: only exit is south (→ town square, through the gate).
// No paths drawn to north, east, or west edges.
//
//   ┌────────────────────────────────────┐
//   │                                    │
//   │        [Votary Circle]             │
//   │              │                     │
//   │       [THE MOUTHSTONE]             │
//   │              │                     │
//   │        [Processional]              │
//   │              │                     │
//   │         exit south → town square   │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const MOUTHSTONE_W = MAX_X - MIN_X + 1;
export const MOUTHSTONE_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateMouthstoneFieldCells = (): {
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

  const setTile = (
    x: number, z: number, objectId: string,
    opts: { walkable?: boolean; blocksLos?: boolean; visualHeight?: number } = {},
  ) => {
    const c = get(x, z);
    if (!c) return;
    c.object_id = objectId;
    c.walkable = opts.walkable ?? true;
    c.blocks_los = opts.blocksLos ?? false;
    c.visual_height = opts.visualHeight ?? 0;
    c.terrain = objectId === GROUND ? "grass" : "stone";
    c.surface_tag = "none";
  };

  const pave = (x: number, z: number, floor = MARBLE) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = MARBLE) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pave(x, z, floor);
  };

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

  // ── Base terrain (barren earth) ─────────────────────────────────────────
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x, y: 0, z,
        active: true, walkable: true, blocks_los: false,
        height: 0, visual_height: 0,
        terrain: "grass", surface_tag: "none", object_id: GROUND,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // ── Processional Path (south exit to Mouthstone — only south) ───────────
  // Path from south edge (exit) to center. No paths to N/E/W edges.
  paveRect(-3, 6, 3, MAX_Z); // south approach (exit at z=20)

  // ── Central Mouthstone Plaza ────────────────────────────────────────────
  paveRect(-8, -8, 8, 6); // the ritual clearing
  // The Mouthstone itself (large monolith, center)
  place("obj_mouthstone_gate", 0, -2, [0, 1], { dialogue: "dia_mouthstone" });
  // Votary circle around the Mouthstone
  for (const angle of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const radius = 7;
    const ax = Math.round(Math.cos(angle * Math.PI / 4) * radius);
    const az = Math.round(Math.sin(angle * Math.PI / 4) * radius - 2);
    if (ax >= -8 && ax <= 8 && az >= -8 && az <= 6) {
      placeIfClear("obj_statue_votary", ax, az, [0, 1]);
    }
  }

  // Processional votaries along the south approach
  for (const z of [8, 11, 14, 17]) {
    placeIfClear("obj_ald_mouthstone_field_marker", -3, z, [1, 0]);
    placeIfClear("obj_ald_mouthstone_field_marker", 3, z, [-1, 0]);
  }

  // ── Scattered stones and sparse vegetation ──────────────────────────────
  placeIfClear("obj_ald_mouthstone_field_marker", -14, -4, [0, 1]);
  placeIfClear("obj_ald_mouthstone_field_marker", 14, -4, [0, 1]);
  placeIfClear("obj_column_broken", -10, 10, [0, 1]);
  placeIfClear("obj_column_broken", 10, 10, [0, 1]);
  // Worn standing stones flanking the approach (votary statues as steles).
  placeIfClear("obj_statue_votary", -5, -12, [0, 1]);
  placeIfClear("obj_statue_votary", 5, -12, [0, 1]);

  // Sparse grass tufts (barren landscape)
  placeIfClear("obj_grass_tuft", -16, -14, [0, 1]);
  placeIfClear("obj_grass_tuft", 16, -14, [0, 1]);
  placeIfClear("obj_grass_tuft", -18, 8, [0, 1]);
  placeIfClear("obj_grass_tuft", 18, 8, [0, 1]);
  placeIfClear("obj_grass_tuft", 0, -16, [0, 1]);

  // A lone dead tree far north (no path to it, just atmosphere)
  placeIfClear("obj_pine", 0, -18, [0, 1]);
  for (const [x, z] of [
    [-18, -18], [18, -18], [-20, 14], [20, 14],
    [-14, 18], [14, 18],
  ] as Vec2[]) {
    placeIfClear("obj_dead_tree", x, z, [0, 1]);
  }

  // Offering stone with loot
  placeContainer("cnt_mouthstone_offering", 4, -6, {
    name: "Votary Offering",
    items: [{ item_id: "itm_votive", count: 2 }, { item_id: "itm_health_potion" }],
  });

  // ── Lanterns flanking processional ──────────────────────────────────────
  placeIfClear("obj_ald_river_fog_lantern", -4, 6, [0, 1]);
  placeIfClear("obj_ald_river_fog_lantern", 4, 6, [0, 1]);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_gate_anchorite", cell: [-2, 6], schedule: [
      { hour: 5, cell: [-2, 6] },
      { hour: 14, cell: [-6, 2] },
      { hour: 22, cell: [2, 6] },
    ] },
    { entity_id: "ent_save", cell: [0, 18] }, // save candle near south exit
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_mouthstone_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
      once: false,
    },
    // Eerie atmosphere trigger when approaching the Mouthstone
    {
      id: "trg_mouthstone_approach",
      cell: [0, 2],
      type: "step",
      conditions: [],
      condition: { not: { switch: "mouthstone_seen" } },
      cutscene_id: "cut_gate_blocked_mouthstone",
      once: true,
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
