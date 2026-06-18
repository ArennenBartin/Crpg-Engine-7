import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";
import { addHippedRoof } from "../utils/cellRoofHelper";
import { DOOR_OBJECT_ID, doorFacingForBounds } from "../utils/doorPlacement";

// ── Glassworks Map (Expanded) ───────────────────────────────────────────
// An abandoned glassworks/workshop east of the Temple Cordon. Furnaces,
// molten glass vats, shattered windows, and old workbenches. Rumored to
// be where the Grid's physical manifestations were first observed.
//
// Dead-end map: only exit is west (→ temple cordon).

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

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
    place(DOOR_OBJECT_ID, door.x, door.z, doorFacingForBounds(door, x0, z0, x1, z1), { block: false });
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
  paveRect(MIN_X, -3, -12, 3, MARBLE);

  // ── Central Cooling Yard (x = -24 to 24, z = -16 to 12) ─────────────────
  paveRect(-24, -16, 24, 12, GROUND);
  place("obj_ald_glass_threshold_brazier", 0, 0, [0, 1], { block: false });
  place("obj_c_glass_dome", 0, -8, [0, 1], { block: false });
  placeIfClear("obj_ald_glassworks_arc_lamp", -12, -12, [0, 1]);
  placeIfClear("obj_ald_glassworks_arc_lamp", 12, -12, [0, 1]);
  placeIfClear("obj_ald_glassworks_arc_lamp", -12, 8, [0, 1]);
  placeIfClear("obj_ald_glassworks_arc_lamp", 12, 8, [0, 1]);
  for (const [x, z] of [
    [-30, -12], [-30, 10], [30, -12], [30, 10],
    [-36, -8], [-36, 8], [36, -8], [36, 8],
  ] as Vec2[]) {
    placeIfClear("obj_dead_tree", x, z, [0, 1]);
  }

  // Industrial litter
  placeIfClear("obj_p_railcart", 6, 2, [1, 0]);
  placeIfClear("obj_p_railcart", -12, -4, [1, 0]);
  placeIfClear("obj_barrel", -16, 6, [0, 1]);
  placeIfClear("obj_column_broken", 0, -8, [0, 1]);
  placeIfClear("obj_column_broken", -2, -9, [0, 1]);

  // ── Furnace Hall (North, x = -24 to 24, z = -38 to -16) ────────────────
  buildHall(-24, -38, 24, -16, WALL_CLAY, MARBLE, { x: 0, z: -16 });
  addHippedRoof(cells, -24, -38, 24, -16, "slate");

  // Three readable machinery banks replace the old row of small repeated props.
  for (const x of [-14, 0, 14]) {
    place("obj_ald_glassworks_furnace_bank", x, -34, [0, 1]);
    place("obj_ald_smokestack_cluster", x, -37, [0, 1]);
    placeIfClear("obj_p_pipes", x, -31, [0, 1], { block: false });
  }
  placeItem("wi_glass_shard_1", "itm_glass_shard", 4, -28);
  placeItem("wi_glass_shard_2", "itm_glass_shard", -16, -28);
  place("obj_net_arch_sigil", 22, -20, [-1, 0], { dialogue: "dia_gate_blocked_shrine" });
  placeIfClear("obj_net_glass_growth", 20, -28, [0, 1], { block: false });
  placeIfClear("obj_p_placard", 18, -18, [0, 1], { block: false, dialogue: "dia_gate_blocked_shrine" });

  // ── Storage Wing (East, x = 24 to 38, z = -16 to 36) ───────────────────
  buildHall(24, -16, 38, 36, WALL_MARBLE, WOOD, { x: 24, z: 0 });
  addHippedRoof(cells, 24, -16, 38, 36, "clay");

  // Storage aisles — deterministic (no Math.random in gens).
  const storeRng = (() => { let s = 0x5701; return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }; })();
  for (let x = 28; x <= 34; x += 6) {
    for (let z = -12; z <= 32; z += 8) {
      if (storeRng() > 0.3) {
        place("obj_chest", x, z, [0, 1]);
      } else {
        place("obj_amphora", x, z, [0, 1]);
      }
    }
  }
  placeContainer("cnt_glass_storage", 36, 0, {
    name: "Massive Ingot Crate",
    items: [{ item_id: "itm_glass_shard", count: 5 }],
  });

  // ── Admin/Display Wing (South/West, x = -24 to 12, z = 12 to 38) ────────────
  buildHall(-24, 12, 12, 38, WALL_MARBLE, MARBLE, { x: 0, z: 12 });
  addHippedRoof(cells, -24, 12, 12, 38, "clay");

  // Display pedestals
  place("obj_column", -16, 24, [0, 1]);
  place("obj_column", -8, 24, [0, 1]);
  place("obj_column", 0, 24, [0, 1]);
  place("obj_column", 8, 24, [0, 1]);
  placeIfClear("obj_ald_cave_evidence_shrine", -4, 28, [0, -1], { block: false });
  placeItem("wi_glass_display", "itm_glass_shard", -16, 22);
  placeItem("wi_glass_display_2", "itm_glass_shard", 8, 22);

  // Office space
  place("obj_table", -20, 34, [0, 1], { dialogue: "dia_orin_workbench" });
  place("obj_table", -16, 34, [0, 1]);
  place("obj_pew", -20, 36, [0, 1]);
  placeContainer("cnt_glass_office", -12, 34, {
    name: "Foreman's Ledger",
    items: [{ item_id: "itm_votive" }],
  });

  // ── Entity Placements ───────────────────────────────────────────────────
  // Enemy ids are unique across maps so state (death, hidden) isn't shared.
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [-4, 0] }, // save candle in courtyard
    { entity_id: "ent_glass_apprentice", cell: [-8, 22], schedule: [
      { hour: 7, cell: [-8, 22] },
      { hour: 14, cell: [0, 14] },
      { hour: 20, cell: [-18, 32] },
      { hour: 23, cell: [-8, 22] },
    ] }, // Orin in the admin wing
    { entity_id: "ent_candle_eaten_4", cell: [0, -20] }, // was _1
    { entity_id: "ent_rite_remnant_3", cell: [0, 28] }, // was _1
    { entity_id: "ent_partial_conversion_3", cell: [20, 0] }, // was _1
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
    {
      id: "trg_orin_private_confrontation",
      cell: [-8, 20],
      type: "step",
      conditions: [],
      condition: {
        all: [
          { switch: "found_log_1" },
          { not: { switch: "orin_private_questioned" } },
          { not: { switch: "vampire_cleared" } },
        ],
      },
      cutscene_id: "cut_orin_private_confrontation",
      once: true,
    },
    {
      id: "trg_orin_after_verdict",
      cell: [-8, 20],
      type: "step",
      conditions: [],
      condition: {
        all: [
          { switch: "vampire_cleared" },
          { not: { switch: "orin_after_verdict_seen" } },
        ],
      },
      cutscene_id: "cut_orin_after_verdict",
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
