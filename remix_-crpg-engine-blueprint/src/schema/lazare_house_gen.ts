import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Lazare's House (Interior/Estate) ────────────────────────────────────
// A standalone map representing Lazare the vampire's shuttered estate.
// The grounds are overgrown, the house interior is dark and cluttered
// with personal effects that hint at his true nature.
//
// Dead-end map: only exit is south (→ residential, back to the street).
// No paths drawn to north, east, or west edges.
//
//   ┌────────────────────────────────────┐
//   │  [Overgrown Garden — north]        │
//   │       │                            │
//   │  [House Interior]                  │
//   │  (bedroom, study, cellar hatch)    │
//   │       │                            │
//   │  [Front Yard / Gate]               │
//   │       │                            │
//   │    exit south → residential        │
//   └────────────────────────────────────┘

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

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

  const buildHouse = (
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

  // ── Path: south exit to front door only ─────────────────────────────────
  // Short path from south edge (exit) to the house entrance — no path to
  // north/east/west edges since those have no exits.
  paveRect(-2, 8, 2, MAX_Z); // path from house door to south edge

  // ── Front Yard (south section, z = 10 to 18) ───────────────────────────
  // Estate fence along the perimeter (not reaching any exit-less edge)
  for (let x = -10; x <= 10; x++) {
    place("obj_fence_stone", x, 8, [0, -1]);
  }
  // Gate opening in fence
  const fenceGate = get(0, 8);
  if (fenceGate) { fenceGate.walkable = true; }
  // Remove the fence at gate position — re-mark as clear
  place("obj_lantern_post", -2, 8, [0, 1]);
  place("obj_lantern_post", 2, 8, [0, 1]);

  // ── Main House (center, z = -8 to 6) ───────────────────────────────────
  buildHouse(-8, -8, 8, 6, WALL_CLAY, WOOD, { x: 0, z: 6 });

  // Interior: Study (north half)
  paveRect(-7, -7, 7, -2, WOOD);
  place("obj_table", -4, -5, [0, 1]); // writing desk
  place("obj_podium", -2, -7, [0, 1]); // book stand
  placeIfClear("obj_pew", 0, -5, [0, -1]);
  place("obj_lantern_post", 6, -7, [0, 1]);

  // Interior: Bedroom (south half)
  place("obj_pallet_bed", 4, 2, [0, 1]);
  place("obj_pallet_bed", 4, 4, [0, 1]);
  place("obj_amphora", -6, 4, [0, 1]);
  place("obj_barrel", -6, 2, [0, 1]);

  // Cellar hatch hint (a suspicious trapdoor)
  place("obj_p_shrine_stone", -4, 0, [0, 1], { dialogue: "dia_lazare_cellar" });

  // Lazare's personal effects
  placeContainer("cnt_lazare_study", -6, -5, {
    name: "Lazare's Desk Drawer",
    locked: true,
    key: "itm_lazare_key",
    items: [{ item_id: "itm_carried_stone" }, { item_id: "itm_glass_shard" }],
  });

  placeContainer("cnt_lazare_wardrobe", 6, -3, {
    name: "Old Wardrobe",
    items: [{ item_id: "itm_votive", count: 3 }],
  });

  // ── Overgrown Garden (north, z = -20 to -10) ───────────────────────────
  // No path to north edge (dead end). Wild trees and bushes.
  placeIfClear("obj_pine_large", -12, -16, [0, 1]);
  placeIfClear("obj_pine_large", 12, -16, [0, 1]);
  placeIfClear("obj_cypress", -8, -14, [0, 1]);
  placeIfClear("obj_cypress", 8, -14, [0, 1]);
  placeIfClear("obj_flower_bush", -4, -12, [0, 1]);
  placeIfClear("obj_flower_bush", 4, -12, [0, 1]);
  placeIfClear("obj_flower_bush", 0, -16, [0, 1]);
  placeIfClear("obj_grass_tuft", -10, -18, [0, 1]);
  placeIfClear("obj_grass_tuft", 10, -18, [0, 1]);
  placeIfClear("obj_column_broken", 0, -14, [0, 1]); // ruined garden ornament

  // Side yards (east/west between house and map edge — no paths)
  placeIfClear("obj_pine", -14, 0, [0, 1]);
  placeIfClear("obj_pine", 14, 0, [0, 1]);
  placeIfClear("obj_barrel", 12, 4, [0, 1]);
  placeIfClear("obj_pithos", -12, 4, [0, 1]);

  // ── Entity Placements ───────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_lazare_vampire", cell: [-2, -4] }, // in his study
    { entity_id: "ent_save", cell: [0, 12] }, // save candle in front yard
  ];

  // ── Triggers ────────────────────────────────────────────────────────────
  const triggers: TriggerData[] = [
    {
      id: "trg_lazare_house_music",
      type: "on_load",
      conditions: [],
      cutscene_id: "cut_town_music",
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
