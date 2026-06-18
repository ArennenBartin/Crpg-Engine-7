import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// A short required pass-through between the residential south gate and the
// cave road. It should read as an old ceremonial lane, not a maze.

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const OLD_WOOD_W = MAX_X - MIN_X + 1;
export const OLD_WOOD_H = MAX_Z - MIN_Z + 1;

const GRASS = "obj_floor_dirt";
const STONE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateOldProcessionalWoodCells = (): {
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
  const entity_placements: EntityPlacementData[] = [];
  const triggers: TriggerData[] = [];
  const grid = new Map<string, CellData>();
  const reserved = new Set<string>();

  const get = (x: number, z: number) => grid.get(key(x, z));
  const reserve = (x: number, z: number) => reserved.add(key(x, z));

  const setTile = (x: number, z: number, objectId: string, walkable = true) => {
    const c = get(x, z);
    if (!c) return;
    c.object_id = objectId;
    c.walkable = walkable;
    c.blocks_los = false;
    c.visual_height = 0;
    c.terrain = objectId === STONE ? "stone" : "grass";
    c.surface_tag = "none";
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
    opts: { block?: boolean; dialogue?: string } = {},
  ) => {
    const c = get(x, z);
    if (!c || !c.walkable || reserved.has(key(x, z))) return false;
    place(objectId, x, z, facing, opts);
    return true;
  };

  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x,
        y: 0,
        z,
        active: true,
        walkable: true,
        blocks_los: false,
        height: 0,
        visual_height: 0,
        terrain: "grass",
        surface_tag: "none",
        object_id: GRASS,
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  // Main processional road: broad enough for manual play, narrow enough to
  // communicate direction. The pockets are visible but secondary.
  for (let z = MIN_Z; z <= MAX_Z; z++) {
    for (let x = -2; x <= 2; x++) setTile(x, z, STONE);
  }
  for (let x = -12; x <= 4; x++) for (let z = -4; z <= 4; z++) setTile(x, z, STONE);
  for (let x = -13; x <= -7; x++) for (let z = -1; z <= 3; z++) setTile(x, z, STONE);
  for (let x = 3; x <= 10; x++) for (let z = 8; z <= 12; z++) setTile(x, z, STONE);

  // Keep exits and spawn lanes clear.
  for (let x = -3; x <= 3; x++) {
    reserve(x, -20);
    reserve(x, -19);
    reserve(x, 19);
    reserve(x, 20);
  }

  // Edge tree belts and side clumps. Clear the middle road deliberately.
  for (let z = -18; z <= 18; z += 4) {
    placeIfClear("obj_pine_large", -18, z);
    placeIfClear("obj_pine_large", 18, z);
  }
  for (let x = -16; x <= 16; x += 4) {
    placeIfClear("obj_pine", x, -18);
    placeIfClear("obj_pine", x, 18);
  }
  for (const [x, z] of [
    [-14, -12], [-10, -15], [-7, -10], [8, -13], [13, -9],
    [-16, 8], [-11, 12], [-7, 10], [12, 3], [15, 9], [9, 16],
  ] as Vec2[]) {
    placeIfClear(z % 2 === 0 ? "obj_dead_tree" : "obj_pine", x, z);
  }

  // Readable landmarks: sign, old tally, and procession stones.
  placeIfClear("obj_ald_processional_marker", 0, -14, [0, 1], { block: false, dialogue: "dia_processional_wood_sign" });
  placeIfClear("obj_ald_processional_marker", -8, 0, [1, 0], { block: false, dialogue: "dia_tally_animal_clue" });
  for (const z of [-10, -6, 6, 10]) {
    if (z === -10 || z === 10) {
      placeIfClear("obj_ald_processional_marker", -4, z, [1, 0]);
      placeIfClear("obj_ald_processional_marker", 4, z, [-1, 0]);
    }
  }
  placeIfClear("obj_net_votive_heap", 8, 10, [0, 1], { block: false });
  placeIfClear("obj_ald_votive_light_cluster", 6, 11, [0, 1], { block: false });
  placeIfClear("obj_ald_civic_lantern_post", -3, -17);
  placeIfClear("obj_ald_civic_lantern_post", 3, -17);
  placeIfClear("obj_ald_civic_lantern_post", -3, 17);
  placeIfClear("obj_ald_civic_lantern_post", 3, 17);

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers,
  };
};
