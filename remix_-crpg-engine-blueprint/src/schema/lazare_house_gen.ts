import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";
import { addHippedRoof } from "../utils/cellRoofHelper";

// ── Lazare's House (Interior/Estate) ────────────────────────────────────
// A standalone map representing Lazare the vampire's shuttered estate.
// The grounds are heavily overgrown, functioning like a hedge maze.
// The house interior is sprawling and cluttered with personal effects.
//
// Dead-end map: only exit is south (→ residential, back to the street).

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

export const LAZARE_W = MAX_X - MIN_X + 1;
export const LAZARE_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const WALL_CLAY = "obj_wall_brick";
const WALL_MARBLE = "obj_wall_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateLazareHouseCells = (): {
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

  const buildRoom = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string, doors: { x: number; z: number }[],
  ) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = doors.some(d => d.x === x && d.z === z);
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

  // ── West Entrance Road & Outer Walls ────────────────────────────────────
  // Path from the West edge into the overgrown courtyard
  paveRect(MIN_X, 8, -4, 12, GROUND);

  // Solid South Wall
  for (let x = -20; x <= 20; x++) {
    wallCell(x, 30, WALL_MARBLE);
  }

  // ── Sprawling Overgrown Garden (x = -36 to 36, z = 0 to 28) ─────────────
  // A dense thicket of dead trees and large pines to obscure the house.
  // Deterministic RNG so the garden lays out the same way each load.
  const gardenRng = (() => { let s = 0x6aa1; return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }; })();
  for (let x = -36; x <= 36; x += 4) {
    for (let z = 0; z <= 28; z += 4) {
      const protectedCourtyard = Math.abs(x) <= 6 && z >= 4 && z <= 16;
      if (!protectedCourtyard && gardenRng() > 0.4 && (x < -6 || x > 6 || z < 10)) {
        const treeType = gardenRng() > 0.5 ? "obj_dead_tree" : "obj_pine_large";
        placeIfClear(treeType, x + Math.floor(gardenRng() * 2), z + Math.floor(gardenRng() * 2), [0, 1]);
      }
    }
  }

  // Winding path from the West entrance to the fountain
  for (let x = -36; x <= -4; x += 2) {
    paveRect(x, 8, x + 1, 12, GROUND);
    placeIfClear("obj_flower_bush", x, 7, [0, 1]);
    placeIfClear("obj_flower_bush", x, 13, [0, 1]);
  }

  // Fountain in garden (well stand-in)
  place("obj_well", 0, 10, [0, 1]);
  placeIfClear("obj_pew", -4, 10, [1, 0]);
  placeIfClear("obj_pew", 4, 10, [-1, 0]);
  placeIfClear("obj_p_iron_fence", -6, 14, [0, 1]);
  placeIfClear("obj_p_iron_fence", -2, 14, [0, 1]);
  placeIfClear("obj_p_iron_fence", 2, 14, [0, 1]);
  placeIfClear("obj_p_iron_fence", 6, 14, [0, 1]);
  placeIfClear("obj_p_candles", 0, 14, [0, 1], { block: false });

  // ── Mansion Structure ───────────────────────────────────────────────────
  // Foyer & Main Hall (x = -12 to 12, z = -16 to -2)
  buildRoom(-12, -16, 12, -2, WALL_MARBLE, MARBLE, [{ x: 0, z: -2 }, { x: -12, z: -8 }, { x: 12, z: -8 }, { x: 0, z: -16 }]);
  addHippedRoof(cells, -12, -16, 12, -2, "slate");
  place("obj_column", -6, -6, [0, 1]);
  place("obj_column", 6, -6, [0, 1]);
  place("obj_column", -6, -12, [0, 1]);
  place("obj_column", 6, -12, [0, 1]);
  place("obj_statue_votary", -2, -8, [0, -1]); // foyer votary statue
  place("obj_statue_votary", 2, -8, [0, -1]);

  // Dining Hall Wing (West, x = -36 to -12, z = -28 to -4)
  buildRoom(-36, -28, -12, -4, WALL_MARBLE, WOOD, [{ x: -12, z: -8 }]);
  addHippedRoof(cells, -36, -28, -12, -4, "slate");
  // Massive long dining table
  for (let x = -32; x <= -16; x += 2) {
    place("obj_table", x, -16, [0, 1]);
  }
  // Pews along both sides
  for (let x = -32; x <= -16; x += 4) {
    place("obj_pew", x, -18, [0, -1]);
    place("obj_pew", x, -14, [0, 1]);
  }
  placeItem("wi_lazare_votive_1", "itm_votive", -24, -15);
  placeItem("wi_lazare_votive_2", "itm_votive", -20, -17);
  place("obj_lantern_post", -34, -26, [0, 1]);
  place("obj_lantern_post", -34, -6, [0, 1]);
  place("obj_lantern_post", -14, -26, [0, 1]);

  // Library Wing (East, x = 12 to 36, z = -28 to -4)
  buildRoom(12, -28, 36, -4, WALL_MARBLE, WOOD, [{ x: 12, z: -8 }]);
  addHippedRoof(cells, 12, -28, 36, -4, "slate");
  for (let x = 16; x <= 32; x += 4) {
    place("obj_table", x, -22, [0, 1]);
    place("obj_table", x, -10, [0, 1]);
    place("obj_chest", x, -16, [0, 1]);
    place("obj_pew", x, -20, [0, 1]);
    place("obj_pew", x, -12, [0, -1]);
  }
  placeItem("wi_lazare_diary", "itm_votive", 34, -16); // placeholder until doc_lazare_diary exists
  place("obj_statue_votary", 34, -26, [0, -1]);
  place("obj_statue_votary", 34, -6, [0, 1]);

  // Lazare's Sanctum (North, x = -12 to 12, z = -38 to -16)
  buildRoom(-12, -38, 12, -16, WALL_CLAY, MARBLE, [{ x: 0, z: -16 }]);
  addHippedRoof(cells, -12, -38, 12, -16, "slate");
  place("obj_pallet_bed", 0, -32, [0, 1]); // sanctum couches (kline → pallet_bed)
  place("obj_pallet_bed", -4, -32, [0, 1]);
  place("obj_pallet_bed", 4, -32, [0, 1]);
  place("obj_altar", -6, -34, [0, 1]);
  place("obj_altar", 6, -34, [0, 1]);
  place("obj_lantern_post", -8, -20, [0, 1]);
  place("obj_lantern_post", 8, -20, [0, 1]);
  placeContainer("cnt_lazare_stash", 0, -36, {
    name: "Lazare's Locked Chest",
    locked: true,
    key: "itm_iron_key",
    items: [{ item_id: "itm_votive", count: 10 }],
  });

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [0, 8] }, // save candle near fountain
    { entity_id: "ent_lazare_vampire", cell: [0, -30] }, // Lazare in his sanctum
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_lazare_after_verdict",
      cell: [0, -28],
      type: "step",
      conditions: [],
      condition: {
        all: [
          { switch: "vampire_cleared" },
          { not: { switch: "lazare_after_verdict_seen" } },
        ],
      },
      cutscene_id: "cut_lazare_after_verdict",
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
