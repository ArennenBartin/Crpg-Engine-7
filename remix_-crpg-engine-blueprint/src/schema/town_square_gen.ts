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

// ── Town Square Map ───────────────────────────────────────────────────────
// The civic heart of Alderamontico. The ceremony starts here. Aldric's
// scriptorium is the northeast building. Market stalls line the south side,
// with the Counted Cup on the southwest corner. The north road climbs toward
// the Mouthstone Field, but the true Mouthstone setpiece lives only there.
// Roads exit south (→ residential), east (→ temple/cordon), north
// (→ Mouthstone Field).
//
//   ┌────────────────────────────────────┐
//   │  [Mouthstone Gate — locked north]  │
//   │          │                         │
//   │  [Sister Vela]  [Gate Guard]       │
//   │          │                         │
//   │  ────── PLAZA ──────               │
//   │  │                    │            │
//   │  │   [Well] [Board]   │  [Script.] │
//   │  │                    │            │
//   │  │   [Market Stalls]  │            │
//   │  │                    │            │
//   │  ──── road south ─────── road east │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const SQUARE_W = MAX_X - MIN_X + 1;
export const SQUARE_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const WALL_MARBLE = "obj_wall_stone";
const WALL_CLAY = "obj_wall_brick";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateTownSquareCells = (): {
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
  const wallCell = (x: number, z: number, wall = WALL_MARBLE) => {
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

  // ── Base terrain ───────────────────────────────────────────────────────
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

  // ── Roads ──────────────────────────────────────────────────────────────
  // N-S civic spine, market elbow, and east processional road. Everything
  // outside these authored lanes is background mass, not free plaza.
  paveRect(-3, MIN_Z, 3, MAX_Z);
  paveRect(-12, -2, MAX_X, 2);
  paveRect(-10, -9, 10, 9);
  paveRect(-8, 5, -2, 8);
  paveRect(-13, 12, -6, 15, WOOD);
  paveRect(11, -16, 13, -12, WOOD);
  paveRect(-2, -14, 2, -9);

  // ── Old Exile Road Gate (north edge) ──────────────────────────────────
  // The actual Mouthstone appears only in map_mouthstone_field. This gate
  // visually announces the road without duplicating the hero setpiece.
  place("obj_p_lych_gate", 0, -18, [0, 1]);
  for (let x = -5; x <= -2; x++) place("obj_fence_stone", x, -18, [0, 1]);
  for (let x = 2; x <= 5; x++) place("obj_fence_stone", x, -18, [0, 1]);
  place("obj_ald_civic_lantern_post", -4, -16, [0, 1]);
  place("obj_ald_civic_lantern_post", 4, -16, [0, 1]);
  place("obj_statue_votary", -6, -19, [0, 1]);
  place("obj_statue_votary", 6, -19, [0, 1]);
  place("obj_p_placard", 0, -15, [0, 1], { block: false, dialogue: "dia_gate_blocked_mouthstone" });

  // ── Plaza features ─────────────────────────────────────────────────────
  place("obj_ald_residential_well_shrine", -4, 0, [0, 1]);
  place("obj_ald_civic_route_board", 5, -4, [0, 1], { dialogue: "dia_notice_board" });
  placeIfClear("obj_ald_civic_lantern_post", -10, -10, [0, 1]);
  placeIfClear("obj_ald_civic_lantern_post", 10, -10, [0, 1]);
  placeIfClear("obj_ald_civic_lantern_post", -10, 10, [0, 1]);
  placeIfClear("obj_ald_civic_lantern_post", 10, 10, [0, 1]);

  // Processional votaries along the north approach
  for (const z of [-14, -11]) {
    placeIfClear("obj_statue_votary", -3, z, [1, 0]);
    placeIfClear("obj_statue_votary", 3, z, [-1, 0]);
  }

  // ── Market Stalls (south part of plaza) ────────────────────────────────
  place("obj_ald_market_ledger_stall", -6, 8, [0, -1]); // Dimos' stall
  place("obj_ald_market_ledger_stall", 1, 8, [0, -1]);
  place("obj_ald_market_ledger_stall", 8, 8, [0, -1]);

  // ── Counted Cup Inn (southwest social anchor) ─────────────────────────
  buildHall(-20, 10, -8, 20, WALL_CLAY, WOOD, { x: -8, z: 14 });
  addHippedRoof(cells, -20, 10, -8, 20, "clay");
  pave(-7, 14, WOOD);
  pave(-6, 14, MARBLE);
  place("obj_p_inn_sign", -7, 13, [-1, 0], { block: false, dialogue: "dia_innkeep" });
  place("obj_table", -15, 14, [0, 1]);
  place("obj_table", -12, 16, [0, 1]);
  place("obj_pew", -15, 12, [0, 1]);
  place("obj_pew", -12, 18, [0, -1]);
  place("obj_barrel", -18, 18, [0, 1]);
  place("obj_p_trapdoor", -12, 13, [0, 1], { block: false, dialogue: "dia_cellar" });

  // ── Scriptorium (northeast, Aldric's office) ───────────────────────────
  buildHall(12, -18, 20, -10, WALL_CLAY, WOOD, { x: 12, z: -14 });
  addHippedRoof(cells, 12, -18, 20, -10, "clay");
  place("obj_p_desk", 16, -14, [0, 1]);
  place("obj_podium", 18, -14, [0, 1]);
  place("obj_notice_board", 13, -16, [0, 1], { block: false, dialogue: "dia_case_board" });
  place("obj_pew", 14, -12, [0, 1]);
  placeContainer("cnt_aldric_archive", 18, -16, {
    name: "Archive Chest",
    locked: true,
    key: "itm_archive_key",
    items: [{ item_id: "itm_glass_shard" }, { item_id: "itm_health_potion" }],
  });
  placeContainer("cnt_aldric_supplies", 18, -12, {
    name: "Office Supply Chest",
    items: [{ item_id: "itm_health_potion", count: 2 }],
  });
  placeItem("wi_archive_key", "itm_archive_key", 14, -13);

  for (const [x, z] of [
    [-18, -12], [-16, -4], [-16, 4], [-18, 8],
    [14, 6], [18, 8], [12, 14], [18, 16],
  ] as Vec2[]) {
    placeIfClear("obj_pine", x, z, [0, 1]);
  }

  // ── Entity Placements ──────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_aldric", cell: [15, -14], schedule: [
      { hour: 7, cell: [15, -14] },
      { hour: 18, cell: [2, -2] },
      { hour: 22, cell: [16, -13] },
    ]},
    { entity_id: "ent_merchant", cell: [-6, 7], schedule: [
      { hour: 7, cell: [-6, 7] },
      { hour: 18, cell: [-4, 6] },
      { hour: 22, cell: [-8, 7] },
    ]},
    // Staged market Orin for the public accusation. The interrogable Orin lives at the Glassworks.
    { entity_id: "ent_orin_public", cell: [-4, 7], schedule: [
      { hour: 7, cell: [-4, 7] },
      { hour: 18, cell: [-4, 7] },
      { hour: 22, cell: [-4, 7] },
    ]},
    { entity_id: "ent_innkeep", cell: [-14, 14], schedule: [
      { hour: 7, cell: [-14, 14] },
      { hour: 18, cell: [-11, 14] },
      { hour: 23, cell: [-16, 18] },
    ]},
    { entity_id: "ent_guard_gate", cell: [0, -16], schedule: [
      { hour: 6, cell: [0, -16] },
      { hour: 18, cell: [2, -16] },
      { hour: 22, cell: [-2, -16] },
    ]},
    { entity_id: "ent_high_clerk", cell: [7, -5], schedule: [
      { hour: 7, cell: [7, -5] },
      { hour: 14, cell: [13, -14] },
      { hour: 21, cell: [7, -3] },
    ]},
    { entity_id: "ent_elder", cell: [-3, -5], schedule: [
      { hour: 8, cell: [-3, -5] },
      { hour: 18, cell: [-6, 0] },
      { hour: 23, cell: [-2, -10] },
    ]},
    { entity_id: "ent_save", cell: [8, 0] }, // wayside candle
  ];

  const marketAccusationCells: Vec2[] = [
    [-8, 6], [-7, 6], [-6, 6], [-5, 6], [-4, 6], [-3, 6], [-2, 6],
    [-7, 5], [-6, 5], [-5, 5], [-4, 5], [-3, 5],
    [-7, 7], [-5, 7], [-3, 7],
  ];

  // ── Triggers ───────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    // Opening ceremony (on first load of this map as start)
    {
      id: "trg_arrival",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_arrival",
      once: true,
    },
    // Town music
    {
      id: "trg_town_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
      once: false,
    },
    // Office briefing trigger (entering scriptorium)
    {
      id: "trg_office_0",
      cell: [12, -14],
      type: "step",
      conditions: [],
      condition: { all: [{ not: { switch: "act1_assigned" } }, { switch: "opening_ceremony_complete" }] },
      cutscene_id: "cut_office_briefing",
      once: true,
    },
    {
      id: "trg_office_1",
      cell: [13, -14],
      type: "step",
      conditions: [],
      condition: { all: [{ not: { switch: "act1_assigned" } }, { switch: "opening_ceremony_complete" }] },
      cutscene_id: "cut_office_briefing",
      once: true,
    },
    {
      id: "trg_office_after_0",
      cell: [12, -14],
      type: "step",
      conditions: [],
      condition: {
        all: [
          { switch: "lazare_talked" },
          { switch: "cyberghost_defeated" },
          { not: { switch: "vampire_cleared" } },
        ],
      },
      cutscene_id: "cut_office_after",
      once: true,
    },
    {
      id: "trg_office_after_1",
      cell: [13, -14],
      type: "step",
      conditions: [],
      condition: {
        all: [
          { switch: "lazare_talked" },
          { switch: "cyberghost_defeated" },
          { not: { switch: "vampire_cleared" } },
        ],
      },
      cutscene_id: "cut_office_after",
      once: true,
    },
    ...marketAccusationCells.map((cell, i) => ({
      id: `trg_orin_public_accusation_${i}`,
      cell,
      type: "step" as const,
      conditions: [],
      condition: {
        all: [
          { not: { switch: "orin_public_accusation_seen" } },
          { not: { switch: "vampire_cleared" } },
        ],
      },
      cutscene_id: "cut_orin_public_accusation",
      once: false,
    })),
    // Mouthstone gate (always locked in Act 1)
    {
      id: "trg_mouthstone_locked",
      cell: [0, -19],
      type: "step",
      conditions: [],
      cutscene_id: "cut_gate_blocked_mouthstone",
      once: false,
    },
    {
      id: "trg_cellar_town_seen",
      cell: [-12, 13],
      type: "interact",
      conditions: [],
      condition: { all: [{ not: { switch: "seen_cellar" } }, { switch: "met_nessa" }] },
      cutscene_id: "cut_cellar_seal",
      once: false,
    },
    {
      id: "trg_trapdoor_town_locked",
      cell: [-12, 13],
      type: "interact",
      conditions: [],
      condition: { any: [{ not: { switch: "act1_assigned" } }, { not: { switch: "met_nessa" } }] },
      cutscene_id: "cut_trapdoor_locked",
      once: false,
    },
    {
      id: "trg_trapdoor_town_enter",
      cell: [-12, 13],
      type: "interact",
      conditions: [],
      condition: { all: [{ switch: "act1_assigned" }, { switch: "met_nessa" }] },
      cutscene_id: "cut_trapdoor_enter",
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
