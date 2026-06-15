import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Glassworks Map ──────────────────────────────────────────────────────
// An abandoned glassworks/workshop east of the Temple Cordon. Furnaces,
// molten glass vats, shattered windows, and old workbenches. Rumored to
// be where the Grid's physical manifestations were first observed.
//
// Dead-end map: only exit is west (→ temple cordon).
// No paths drawn to north, south, or east edges.
//
//   ┌────────────────────────────────────┐
//   │                                    │
//   │  [Furnace Hall]  [Storage]         │
//   │       │               │            │
//   │  ─── [Central Workshop] ───        │
//   │       │                            │
//   │  [Display Room]  [Office]          │
//   │       │                            │
//   │  ← exit west (to temple cordon)    │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const GLASS_W = MAX_X - MIN_X + 1;
export const GLASS_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const WALL_CLAY = "obj_wall_brick";
const WALL_MARBLE = "obj_wall_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateGlassworksCells = (): {
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
    c.blocks_los = opts.blocksLos ?? objectId.startsWith("obj_wall");
    c.visual_height = opts.visualHeight ?? (objectId.startsWith("obj_wall") ? 4 : 0);
    c.terrain = objectId === GROUND ? "grass" : "stone";
    c.surface_tag = "none";
  };

  const pave = (x: number, z: number, floor = MARBLE) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = MARBLE) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) pave(x, z, floor);
  };
  const wallCell = (x: number, z: number, wall = WALL_CLAY) => {
    setTile(x, z, wall, { walkable: false, blocksLos: true, visualHeight: 4 });
    reserve(x, z);
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

  const placeItem = (id: string, itemId: string, x: number, z: number, count = 1) => {
    item_placements.push({ id, item_id: itemId, cell: [x, z], count });
    reserve(x, z);
  };

  const buildHall = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string, door: { x: number; z: number },
  ) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = x === door.x && z === door.z;
        const isPerimeter = x === x0 || x === x1 || z === z0 || z === z1;
        if (isDoor) { pave(x, z, floor); reserve(x, z); }
        else if (isPerimeter) { wallCell(x, z, wall); }
        else { pave(x, z, floor); reserve(x, z); }
      }
    }
  };

  // ── Base terrain ────────────────────────────────────────────────────────
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

  // ── Road: only west (from west edge exit to workshop entrance) ──────────
  // Path runs from west edge (x=-20) to workshop courtyard. No paths to
  // north, south, or east edges.
  paveRect(MIN_X, -3, 0, 3); // west road to workshop

  // ── Central Workshop Courtyard (x = -4 to 12, z = -6 to 6) ─────────────
  paveRect(-4, -6, 12, 6);

  // ── Furnace Hall (north, x = -4 to 12, z = -18 to -8) ──────────────────
  buildHall(-4, -18, 12, -8, WALL_CLAY, MARBLE, { x: 4, z: -8 });
  // Furnaces
  place("obj_p_furnace", -2, -14, [0, 1]);
  place("obj_p_furnace", 2, -14, [0, 1]);
  place("obj_p_furnace", 6, -14, [0, 1]);
  place("obj_p_smokestack", -2, -16, [0, 1]);
  place("obj_p_smokestack", 2, -16, [0, 1]);
  place("obj_p_smokestack", 6, -16, [0, 1]);
  // Workbench
  place("obj_table", 10, -12, [0, 1]);
  placeItem("wi_glass_shard_1", "itm_glass_shard", 10, -14);
  placeIfClear("obj_barrel", 10, -16, [0, 1]);

  // ── Storage Room (east of furnace hall, x = 14 to 18, z = -16 to -10) ──
  buildHall(14, -16, 18, -10, WALL_MARBLE, WOOD, { x: 14, z: -13 });
  placeContainer("cnt_glass_storage", 16, -14, {
    name: "Glass Ingots",
    items: [{ item_id: "itm_glass_shard", count: 3 }],
  });
  placeIfClear("obj_barrel", 16, -12, [0, 1]);

  // ── Display Room (south, x = -4 to 6, z = 8 to 16) ─────────────────────
  buildHall(-4, 8, 6, 16, WALL_MARBLE, MARBLE, { x: 1, z: 8 });
  // Display pedestals
  place("obj_column", -2, 12, [0, 1]);
  place("obj_column", 4, 12, [0, 1]);
  placeIfClear("obj_stele", 1, 14, [0, -1]);
  placeItem("wi_glass_display", "itm_glass_shard", -2, 14);

  // ── Office (southeast, x = 8 to 16, z = 8 to 14) ──────────────────────
  buildHall(8, 8, 16, 14, WALL_CLAY, WOOD, { x: 8, z: 11 });
  place("obj_table", 12, 10, [0, 1]);
  place("obj_pew", 10, 12, [0, 1]);
  placeContainer("cnt_glass_office", 14, 12, {
    name: "Foreman's Ledger",
    items: [{ item_id: "itm_votive" }],
  });

  // ── Courtyard details ───────────────────────────────────────────────────
  place("obj_well", 4, 0, [0, 1]);
  placeIfClear("obj_lantern_post", -4, -6, [0, 1]);
  placeIfClear("obj_lantern_post", 12, -6, [0, 1]);
  placeIfClear("obj_lantern_post", -4, 6, [0, 1]);
  placeIfClear("obj_p_railcart", 8, 2, [1, 0]);
  placeIfClear("obj_column_broken", 0, -6, [0, 1]);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [-2, 0] }, // save candle in courtyard
    { entity_id: "ent_candle_eaten_1", cell: [6, -12] }, // enemy in furnace hall
    { entity_id: "ent_rite_remnant_1", cell: [1, 13] }, // enemy in display room
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_glass_music",
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
