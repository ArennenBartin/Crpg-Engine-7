import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Cave Grotto Map (Expanded) ───────────────────────────────────────────
// A sprawling subterranean lake fed by underground rivers, filled with
// luminescent flora and secluded ritual islands.

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

export const GROTTO_W = MAX_X - MIN_X + 1;
export const GROTTO_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const WATER = "obj_water";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveGrottoCells = (): {
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

  const carvePath = (points: Vec2[], width = 1, floor = GROUND) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [sx, sz] = points[i];
      const [ex, ez] = points[i + 1];
      const steps = Math.max(Math.abs(ex - sx), Math.abs(ez - sz), 1);
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = Math.round(sx + (ex - sx) * t);
        const z = Math.round(sz + (ez - sz) * t);
        carveRoom(x - width, z - width, x + width, z + width, floor);
      }
    }
  };

  // Entry tunnel from West (x=-40 to -24, z=-2 to 2)
  carveRoom(-40, -2, -24, 2);

  // Massive Subterranean Lake (x=-24 to 36, z=-30 to 30)
  for (let x = -26; x <= 38; x++) {
    for (let z = -32; z <= 32; z++) {
      const dist = Math.sqrt(x*x + z*z);
      if (dist < 32 + Math.sin(x*0.6)*4 + Math.cos(z*0.6)*4) {
        pave(x, z, WATER);
        const c = get(x, z);
        if (c) { c.active = true; c.walkable = false; c.blocks_los = false; c.visual_height = -1; }
      }
    }
  }

  // The lake is carved after the entry tunnel, so restore a low causeway
  // from the west spawn to the first bend of the ritual path.
  carveRoom(-40, -2, -20, 2, GROUND);

  // A winding but continuous dirt causeway through the water.
  carvePath([[-24, 0], [-18, 2], [-12, 2], [-6, -5], [0, -2], [8, 3], [14, -5], [22, -1]], 1);

  // Ritual Island (x=16 to 28, z=-8 to 8)
  for (let x = 16; x <= 28; x++) {
    for (let z = -8; z <= 8; z++) {
      if (Math.sqrt((x-22)**2 + z**2) < 6) {
        pave(x, z, GROUND);
        const c = get(x, z);
        if (c) { c.walkable = true; c.visual_height = 0; }
      }
    }
  }
  carveRoom(16, -5, 22, -1, GROUND);

  // Island details — a rite stele and cold braziers (cave appropriate).
  place("obj_net_stele", 22, 0, [0, -1]);
  place("obj_net_brazier_cold", 18, -4, [0, 1]);
  place("obj_net_brazier_cold", 18, 4, [0, 1]);
  place("obj_net_candle_cluster", 26, -4, [0, 1]);
  place("obj_net_candle_cluster", 26, 4, [0, 1]);

  // Luminescent star-glass growths around the lake (grid-sickness flora).
  const rng = (() => { let s = 0x6707; return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }; })();
  for (let x = -20; x <= 36; x += 4) {
    for (let z = -30; z <= 30; z += 4) {
      if (rng() > 0.6) {
        placeIfClear("obj_net_glass_growth", x, z, [0, 1], { block: false });
      }
    }
  }

  // Enemies — each entity id appears in exactly one map.
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [-26, 0] },
    { entity_id: "ent_partial_conversion_4", cell: [0, 0] }, // was _1 (dupe with cave_upper)
    { entity_id: "ent_rite_remnant_2", cell: [20, 0] },
  ];

  const triggers: TriggerData[] = [
    {
      id: "trg_read_log_4",
      cell: [22, 0],
      type: "interact",
      conditions: [],
      condition: { not: { switch: "found_log_4" } },
      cutscene_id: "cut_read_log_4",
      once: true,
    },
  ];

  return { cells, custom_object_placements, item_placements, container_placements, entity_placements, triggers };
};
