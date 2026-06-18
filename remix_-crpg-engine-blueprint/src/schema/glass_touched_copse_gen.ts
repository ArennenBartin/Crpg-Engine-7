import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// A short, denser threshold map between the old wood and the eastern caves.
// The route stays obvious while the scenery teaches that Glass can hold pattern.

type Vec2 = [number, number];

const MIN_X = -20;
const MAX_X = 20;
const MIN_Z = -20;
const MAX_Z = 20;

export const GLASS_COPSE_W = MAX_X - MIN_X + 1;
export const GLASS_COPSE_H = MAX_Z - MIN_Z + 1;

const GRASS = "obj_floor_dirt";
const STONE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateGlassTouchedCopseCells = (): {
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

  // One clear forward lane, bent slightly so the cave mouth feels discovered.
  for (let z = MIN_Z; z <= -5; z++) for (let x = -2; x <= 2; x++) setTile(x, z, STONE);
  for (let x = -2; x <= 8; x++) for (let z = -6; z <= -2; z++) setTile(x, z, STONE);
  for (let z = -2; z <= MAX_Z; z++) for (let x = 5; x <= 9; x++) setTile(x, z, STONE);
  for (let x = 3; x <= 11; x++) for (let z = 12; z <= 18; z++) setTile(x, z, STONE);

  for (let x = -3; x <= 3; x++) {
    reserve(x, -20);
    reserve(x, -19);
  }
  for (let x = 4; x <= 10; x++) {
    reserve(x, 19);
    reserve(x, 20);
  }

  // Dense copse walls, with Glass pulling the eye toward the lower exit.
  for (let z = -18; z <= 18; z += 3) {
    placeIfClear("obj_pine_large", -18, z);
    placeIfClear("obj_dead_tree", 18, z);
  }
  for (let x = -15; x <= 15; x += 5) {
    placeIfClear("obj_pine", x, -18);
    placeIfClear("obj_dead_tree", x, 18);
  }
  for (const [x, z] of [
    [-12, -12], [-8, -14], [-11, -4], [-15, 4], [-10, 9],
    [10, -13], [14, -8], [13, -1], [15, 8], [-3, 13],
  ] as Vec2[]) {
    placeIfClear("obj_pine", x, z);
  }

  for (const [x, z] of [
    [5, -5], [9, -3], [4, 1], [11, 4], [3, 10], [11, 13], [6, 17],
  ] as Vec2[]) {
    placeIfClear("obj_net_glass_growth", x, z, [0, 1], { block: false });
  }
  placeIfClear("obj_ald_glass_threshold_brazier", 7, -4, [-1, 0], { block: false, dialogue: "dia_glass_copse_trace" });
  placeIfClear("obj_net_arch_sigil", 7, 16, [0, 1], { block: false, dialogue: "dia_glass_copse_exit" });
  placeIfClear("obj_net_root_curtain", 8, 18, [0, 1], { block: false });
  placeIfClear("obj_ald_civic_lantern_post", -3, -17);
  placeIfClear("obj_ald_civic_lantern_post", 3, -17);
  placeIfClear("obj_ald_glass_threshold_brazier", 4, 15);
  placeIfClear("obj_ald_glass_threshold_brazier", 10, 15);

  return {
    cells,
    custom_object_placements,
    item_placements,
    container_placements,
    entity_placements,
    triggers,
  };
};
