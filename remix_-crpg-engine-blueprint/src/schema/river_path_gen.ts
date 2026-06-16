import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── River Path Map ──────────────────────────────────────────────────────
// A riverside trail west of the Residential Quarter. The river runs N-S
// along the west half of the map. A stone bridge crosses it. A fishing
// dock juts into the water. Willows and reeds line the bank.
//
// Dead-end map: only exit is east (→ residential).
// No paths drawn to north, south, or west edges.
//
//   ┌────────────────────────────────────┐
//   │  [River — non-walkable water]      │
//   │       │                            │
//   │  [Dock] ── [Bridge] ── road east → │
//   │       │                            │
//   │  [River continues]                 │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const RIVER_W = MAX_X - MIN_X + 1;
export const RIVER_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const WATER = "obj_water";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateRiverPathCells = (): {
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
    c.walkable = opts.walkable ?? (objectId !== WATER);
    c.blocks_los = opts.blocksLos ?? false;
    c.visual_height = opts.visualHeight ?? 0;
    c.terrain = objectId === WATER ? "water" : objectId === GROUND ? "grass" : "stone";
    c.surface_tag = objectId === WATER ? "water" : "none";
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

  // ── Base terrain (grass) ────────────────────────────────────────────────
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

  // ── River (west half, x = -20 to -8, full N-S) ─────────────────────────
  for (let x = -20; x <= -8; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      setTile(x, z, WATER);
    }
  }

  // Muddy bank between lawful road and older river.
  for (let x = -7; x <= -4; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      setTile(x, z, "obj_p_mud");
    }
  }

  // ── Road: only east (from bridge to east edge exit) ─────────────────────
  // Road runs from x = -7 (bridge landing) to x = 20 (east edge exit)
  paveRect(-7, -3, MAX_X, 3);

  // ── Stone Bridge (x = -12 to -7, z = -2 to 2) ──────────────────────────
  paveRect(-12, -2, -7, 2, MARBLE);
  // Bridge railings
  for (let x = -12; x <= -7; x++) {
    place("obj_fence_stone", x, -3, [0, -1]);
    place("obj_fence_stone", x, 3, [0, 1]);
  }

  // ── Fishing Dock (west of bridge, extends into river) ───────────────────
  paveRect(-16, -1, -13, 1, WOOD);
  place("obj_barrel", -16, -1, [0, 1]);
  place("obj_barrel", -16, 1, [0, 1]);
  place("obj_p_dock", -15, 0, [1, 0], { block: false, dialogue: "dia_ferryman" });

  // ── East bank embellishments ────────────────────────────────────────────
  // Willows and reeds along the riverbank
  placeIfClear("obj_pine_large", -6, -10, [0, 1]);
  placeIfClear("obj_pine_large", -6, 10, [0, 1]);
  placeIfClear("obj_cypress", -5, -16, [0, 1]);
  placeIfClear("obj_cypress", -5, 16, [0, 1]);
  placeIfClear("obj_flower_bush", -7, -6, [0, 1]);
  placeIfClear("obj_flower_bush", -7, 6, [0, 1]);
  for (const z of [-14, -10, -6, 6, 10, 14]) {
    placeIfClear("obj_p_reeds", -8, z, [0, 1], { block: false });
    placeIfClear("obj_p_votive_token", -6, z + 1, [0, 1], { block: false });
  }

  // Small clearing (south of road) with a resting spot
  paveRect(4, 8, 12, 14, GROUND);
  placeIfClear("obj_pew", 6, 10, [0, -1]);
  placeIfClear("obj_pew", 10, 10, [0, -1]);
  placeIfClear("obj_lantern_post", 4, 8, [1, 1]);
  placeIfClear("obj_p_shrine_stone", 12, 12, [0, -1], { dialogue: "dia_old_rite_shrine" });
  placeIfClear("obj_p_candles", 12, 10, [0, -1], { block: false });

  // North meadow dressing
  placeIfClear("obj_grass_tuft", 6, -8, [0, 1]);
  placeIfClear("obj_grass_tuft", 12, -12, [0, 1]);
  placeIfClear("obj_flower_bush", 14, -6, [0, 1]);

  // Fisherman's stash near the dock
  placeContainer("cnt_river_stash", -6, 1, {
    name: "Fisherman's Tackle",
    items: [{ item_id: "itm_health_potion" }, { item_id: "itm_votive" }],
  });

  // ── Lanterns along road ─────────────────────────────────────────────────
  placeIfClear("obj_lantern_post", 0, -4, [0, 1]);
  placeIfClear("obj_lantern_post", 10, -4, [0, 1]);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_ferryman", cell: [-14, 0], schedule: [
      { hour: 5, cell: [-14, 0] },
      { hour: 12, cell: [-15, 0] },
      { hour: 18, cell: [-8, 0] },
      { hour: 23, cell: [-14, 0] },
    ] }, // on the dock
    { entity_id: "ent_save", cell: [2, 0] }, // save candle near bridge
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_river_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_river_music",
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
