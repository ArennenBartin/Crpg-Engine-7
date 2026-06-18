import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Upper Caves Map (Expanded) ──────────────────────────────────────────
// Subterranean entry from the Residential district down into the network.

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

export const CAVE_UPPER_W = MAX_X - MIN_X + 1;
export const CAVE_UPPER_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_ald_cave_floor";
const WOOD = "obj_floor_wood";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveUpperCells = (): {
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

  const pave = (x: number, z: number, floor = GROUND) => setTile(x, z, floor);
  const paveRect = (x0: number, z0: number, x1: number, z1: number, floor = GROUND) => {
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

  // ── Base void ────────────────────────────────────────────────────────
  for (let x = MIN_X; x <= MAX_X; x++) {
    for (let z = MIN_Z; z <= MAX_Z; z++) {
      const cell: CellData = {
        x, y: 0, z,
        active: false, walkable: false, blocks_los: true,
        height: 0, visual_height: 4,
        terrain: "grass", surface_tag: "none",
      };
      grid.set(key(x, z), cell);
      cells.push(cell);
    }
  }

  const carveRoom = (x0: number, z0: number, x1: number, z1: number, floor = GROUND) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const c = get(x, z);
        if (c) {
          c.active = true; c.walkable = true; c.blocks_los = false; c.visual_height = 0; c.object_id = floor;
        }
      }
    }
  };

  // Main tunnel from North (x=-2 to 2, z=-40 to -24)
  carveRoom(-2, -40, 2, -24);
  // Large Cavern (x=-12 to 12, z=-24 to -8)
  carveRoom(-12, -24, 12, -8);
  // West witness/log alcove: optional but visible from the main cavern.
  carveRoom(-24, -22, -13, -14);
  // Tunnel to East (x=12 to 40, z=-14 to -10)
  carveRoom(12, -14, 40, -10);
  
  // Winding path South (x=-4 to 4, z=-8 to 16)
  carveRoom(-4, -8, 4, 16);
  // Ravine Bridge (x=-8 to 8, z=16 to 24)
  carveRoom(-8, 16, 8, 24, WOOD);
  // Tunnel to South Exit (x=-2 to 2, z=24 to 40)
  carveRoom(-2, 24, 2, 40);

  // Dress the cavern with cave-appropriate props (network kit).
  for (let x = -10; x <= 10; x += 4) {
    place("obj_net_column_root", x, -22, [0, 1]);
    place("obj_net_rubble", x, -10, [0, 1]);
  }
  placeIfClear("obj_ald_cave_evidence_shrine", -8, -16, [0, 1], { block: false });
  placeIfClear("obj_net_rubble", -6, -16, [0, 1]);
  placeIfClear("obj_ald_cave_evidence_shrine", 0, -16, [0, 1], { block: false });
  placeIfClear("obj_net_shrine_family", -22, -18, [1, 0]);
  placeIfClear("obj_ald_votive_light_cluster", -18, -20, [0, 1], { block: false });
  placeIfClear("obj_net_root_curtain", -14, -18, [1, 0]);
  placeIfClear("obj_net_stele", 8, -22, [0, 1], { block: false });

  // Ravine bridge: cold braziers along the planks.
  placeIfClear("obj_ald_glass_threshold_brazier", -4, 20, [0, 1]);
  placeIfClear("obj_ald_glass_threshold_brazier", 4, 20, [0, 1]);

  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_candle_eaten_1", cell: [0, -18] },
    { entity_id: "ent_partial_conversion_1", cell: [20, -12] }, // guarding the east exit
    { entity_id: "ent_partial_conversion_2", cell: [0, 20] },   // guarding the bridge
  ];

  const triggers: TriggerData[] = [
    {
      id: "trg_read_log_1",
      cell: [-8, -16],
      type: "interact",
      conditions: [],
      condition: { not: { switch: "found_log_1" } },
      cutscene_id: "cut_read_log_1",
      once: true,
    },
    {
      id: "trg_read_log_2",
      cell: [0, -16],
      type: "interact",
      conditions: [],
      condition: { not: { switch: "found_log_2" } },
      cutscene_id: "cut_read_log_2",
      once: true,
    },
  ];

  return { cells, custom_object_placements, item_placements, container_placements, entity_placements, triggers };
};
