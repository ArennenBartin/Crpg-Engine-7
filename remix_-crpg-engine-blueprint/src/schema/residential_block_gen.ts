import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Residential Block Test Map ──────────────────────────────────────────────
// A standalone block of the town featuring 3 distinct houses and diverse props.
// The map edges visually imply connections to a larger town.

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const BLOCK_W = MAX_X - MIN_X + 1;
export const BLOCK_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";
const WOOD = "obj_floor_wood";
const MOSAIC = "obj_floor_mosaic";
const WATER = "obj_water";
const WALL_MARBLE = "obj_wall_stone";
const WALL_CLAY = "obj_wall_brick";

const ROOF_PLANE_Y = 3;
const ROOF_CONNECTOR_Y = 2;
const ROOF_TILE = "obj_roof_tile";
const ROOF_N = "obj_p_roof_clay_n";
const ROOF_S = "obj_p_roof_clay_s";
const ROOF_E = "obj_p_roof_clay_e";
const ROOF_W = "obj_p_roof_clay_w";
const ROOF_NW = "obj_p_roof_clay_hip_nw";
const ROOF_NE = "obj_p_roof_clay_hip_ne";
const ROOF_SE = "obj_p_roof_clay_hip_se";
const ROOF_SW = "obj_p_roof_clay_hip_sw";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateResidentialBlockCells = (): {
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
    x: number,
    z: number,
    objectId: string,
    opts: { walkable?: boolean; blocksLos?: boolean; visualHeight?: number } = {},
  ) => {
    const c = get(x, z);
    if (!c) return;
    c.object_id = objectId;
    c.walkable = opts.walkable ?? objectId !== WATER;
    c.blocks_los = opts.blocksLos ?? objectId.startsWith("obj_wall");
    c.visual_height = opts.visualHeight ?? (objectId.startsWith("obj_wall") ? 4 : 0);
    c.terrain = objectId === WATER ? "water" : objectId === GROUND ? "grass" : "stone";
    c.surface_tag = objectId === WATER ? "water" : "none";
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
    objectId: string,
    x: number,
    z: number,
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const placement: ObjectPlacementData = { object_id: objectId, cell: [x, z], facing };
    if (opts.dialogue) placement.dialogue_id = opts.dialogue;
    custom_object_placements.push(placement);
    reserve(x, z);
    if (opts.block !== false) {
      const c = get(x, z);
      if (c) {
        c.walkable = false;
        c.blocks_los = false;
      }
    }
  };

  const placeIfClear = (
    objectId: string,
    x: number,
    z: number,
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string; groundOnly?: boolean } = {},
  ) => {
    const c = get(x, z);
    if (!c || !c.walkable || reserved.has(key(x, z))) return false;
    if (opts.groundOnly && c.object_id !== GROUND) return false;
    place(objectId, x, z, facing, opts);
    return true;
  };

  const placeMany = (
    objectId: string,
    cellsToPlace: Vec2[],
    facing: Vec2 = [0, 1],
    opts: { block?: boolean; dialogue?: string; groundOnly?: boolean } = {},
  ) => cellsToPlace.forEach(([x, z]) => placeIfClear(objectId, x, z, facing, opts));

  const placeContainer = (
    id: string,
    x: number,
    z: number,
    opts: {
      name?: string;
      facing?: Vec2;
      locked?: boolean;
      key?: string;
      items?: { item_id: string; count?: number }[];
    } = {},
  ) => {
    container_placements.push({
      id,
      object_id: "obj_chest",
      cell: [x, z],
      facing: opts.facing || [0, 1],
      display_name: opts.name,
      locked: opts.locked ?? false,
      key_item_id: opts.key,
      consume_key: false,
      items: (opts.items || []).map((e) => ({ item_id: e.item_id, count: e.count ?? 1 })),
    });
    reserve(x, z);
    const c = get(x, z);
    if (c) {
      c.walkable = false;
      c.blocks_los = false;
    }
  };

  const addRoof = (x0: number, z0: number, x1: number, z1: number, skip?: Set<string>) => {
    const hasRoof = (x: number, z: number) =>
      x >= x0 && x <= x1 && z >= z0 && z <= z1 && !skip?.has(key(x, z));
    const roofIdFor = (x: number, z: number) => {
      const edgeN = !hasRoof(x, z - 1);
      const edgeS = !hasRoof(x, z + 1);
      const edgeW = !hasRoof(x - 1, z);
      const edgeE = !hasRoof(x + 1, z);

      if (edgeN && edgeW) return ROOF_NW;
      if (edgeN && edgeE) return ROOF_NE;
      if (edgeS && edgeE) return ROOF_SE;
      if (edgeS && edgeW) return ROOF_SW;
      if (edgeN) return ROOF_N;
      if (edgeS) return ROOF_S;
      if (edgeE) return ROOF_W;
      if (edgeW) return ROOF_E;
      return ROOF_TILE;
    };

    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        if (skip?.has(key(x, z))) continue;
        const objectId = roofIdFor(x, z);
        cells.push({
          x, y: objectId === ROOF_TILE ? ROOF_PLANE_Y : ROOF_CONNECTOR_Y, z,
          active: true, walkable: false, blocks_los: true,
          height: 0, visual_height: 0,
          terrain: "stone", surface_tag: "none", object_id: objectId,
        });
      }
    }
  };

  const buildHouse = (
    x0: number, z0: number, x1: number, z1: number,
    wall: string, floor: string,
    door: { x: number; z: number }
  ) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const isDoor = x === door.x && z === door.z;
        const isPerimeter = x === x0 || x === x1 || z === z0 || z === z1;
        if (isDoor) {
          pave(x, z, floor);
          reserve(x, z);
        } else if (isPerimeter) {
          wallCell(x, z, wall);
        } else {
          pave(x, z, floor);
          reserve(x, z);
        }
      }
    }
    addRoof(x0, z0, x1, z1);
  };

  // Base grass terrain
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

  // ── Central Crossroads ────────────────────────────────────────────────────
  // Visual connections to the rest of the town at map edges.
  paveRect(-4, MIN_Z, 4, MAX_Z, MARBLE); // North-South street
  paveRect(MIN_X, -4, MAX_X, 4, MARBLE); // East-West street
  
  // Plazaway details
  place("obj_well", 0, 0, [0, 1]);
  place("obj_lantern_post", -4, -4, [1, 1]);
  place("obj_lantern_post", 4, 4, [-1, -1]);
  place("obj_notice_board", 2, 4, [0, -1]);

  // ── Northwest House (Merchant) ───────────────────────────────────────────
  buildHouse(-18, -18, -8, -8, WALL_CLAY, WOOD, { x: -8, z: -13 });
  paveRect(-17, -17, -15, -15, MOSAIC); // Inner mosaic floor

  // House interior
  place("obj_table", -13, -13, [0, 1]);
  place("obj_pallet_bed", -16, -16, [0, 1]);
  placeContainer("cnt_merchant_stash", -16, -10, { name: "Merchant's Stash" });
  place("obj_market_stall", -10, -16, [0, -1]);
  place("obj_barrel", -10, -14, [0, -1]);
  place("obj_amphora", -12, -16, [0, -1]);

  // Merchant yard & street frontage
  paveRect(-18, -7, -8, -5, WOOD);
  place("obj_pithos", -18, -6, [0, 1]);
  place("obj_barrel", -16, -6, [0, 1]);
  place("obj_barrel", -15, -6, [0, 1]);
  placeMany("obj_flower_bush", [[-18, -19], [-16, -19], [-14, -19]], [0, 1]);
  place("obj_fig_tree", -19, -13, [0, 1]);

  // ── Northeast House (Mason) ──────────────────────────────────────────────
  buildHouse(8, -18, 18, -10, WALL_MARBLE, MARBLE, { x: 8, z: -14 });
  
  // House interior
  place("obj_table", 15, -14, [0, 1]);
  place("obj_pallet_bed", 16, -16, [0, 1]);
  place("obj_chest", 16, -12, [0, 1]);
  place("obj_pew", 13, -14, [0, -1]);
  place("obj_p_furnace", 10, -16, [0, -1]);
  place("obj_p_smokestack", 12, -16, [0, 1]);
  place("obj_column_broken", 10, -12, [0, 1]);

  // Mason work yard
  paveRect(8, -9, 18, -5, GROUND);
  place("obj_p_railcart", 12, -7, [1, 0]);
  place("obj_column_broken", 14, -7, [0, 1]);
  place("obj_column", 10, -9, [0, 1]);
  place("obj_column", 16, -9, [0, 1]);
  placeMany("obj_grass_tuft", [[8, -19], [12, -19], [16, -19], [18, -19]], [0, 1], { block: false });

  // ── Southwest House (Pilgrim's Rest) ─────────────────────────────────────
  buildHouse(-18, 8, -8, 18, WALL_CLAY, WOOD, { x: -8, z: 13 });
  
  // House interior
  place("obj_altar", -16, 13, [1, 0]);
  place("obj_pew", -14, 13, [-1, 0]);
  place("obj_pallet_bed", -16, 16, [0, 1]);
  place("obj_pallet_bed", -16, 10, [0, 1]);
  place("obj_barrel", -10, 16, [0, 1]);
  place("obj_p_shrine_stone", -10, 10, [0, -1]);
  place("obj_statue_votary", -12, 10, [0, -1]);
  place("obj_lantern_post", -10, 12, [0, -1]);

  // Shrine yard
  place("obj_statue_votary", -16, 6, [0, -1]);
  place("obj_statue_votary", -12, 6, [0, -1]);
  place("obj_pew", -14, 6, [0, -1]);
  place("obj_cypress", -18, 6, [0, 1]);
  place("obj_cypress", -10, 6, [0, 1]);
  place("obj_pine", -18, 20, [0, 1]);

  // ── Southeast Park / Grove ───────────────────────────────────────────────
  paveRect(8, 8, 18, 18, GROUND);
  place("obj_fountain", 13, 13, [0, 1]);
  place("obj_stele", 13, 16, [0, -1]);
  place("obj_pew", 10, 13, [1, 0]);
  place("obj_pew", 16, 13, [-1, 0]);
  
  placeMany("obj_pine_large", [[10, 10], [16, 10], [10, 16], [16, 16]], [0, 1]);
  placeMany("obj_flower_bush", [[9, 13], [17, 13], [13, 10]], [0, 1]);
  placeMany("obj_grass_tuft", [[8, 8], [12, 8], [18, 8], [18, 18], [8, 18]], [0, 1], { block: false });

  // ── The Cast ─────────────────────────────────────────────────────────────
  const entity_placements: EntityPlacementData[] = [
    // Merchant inside their house
    { entity_id: "ent_merchant", cell: [-14, -13] },
    // Mason inside their house
    { entity_id: "ent_mason", cell: [11, -14] },
    // Pilgrim inside near the shrine
    { entity_id: "ent_pilgrim", cell: [-12, 13] },
  ];

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers: [],
  };
};
