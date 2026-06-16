import {
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  ObjectPlacementData,
  TriggerData,
  WorldItemPlacementData,
} from "./game";

// ── Cave Deep Map (Expanded) ─────────────────────────────────────────────
// The massive lower depths where pagan remnants and strange rituals took place.

type Vec2 = [number, number];

const MIN_X = -40;
const MAX_X = 40;
const MIN_Z = -40;
const MAX_Z = 40;

export const CAVE_DEEP_W = MAX_X - MIN_X + 1;
export const CAVE_DEEP_H = MAX_Z - MIN_Z + 1;

const GROUND = "obj_floor_dirt";
const MARBLE = "obj_floor_stone";

const key = (x: number, z: number) => `${x}|${z}`;

export const generateCaveDeepCells = (): {
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

  // Entry tunnel from North (x=-2 to 2, z=-40 to -28)
  carveRoom(-2, -40, 2, -28);

  // Massive Central Cavern (x=-30 to 30, z=-28 to 30)
  // We'll carve an uneven, organic shape.
  for (let x = -30; x <= 30; x++) {
    for (let z = -28; z <= 30; z++) {
      const dist = Math.sqrt(x*x + z*z);
      if (dist < 28 + Math.sin(x*0.5)*5 + Math.cos(z*0.5)*5) {
        pave(x, z, GROUND);
        const c = get(x, z);
        if (c) { c.active = true; c.walkable = true; c.blocks_los = false; c.visual_height = 0; }
      }
    }
  }

  // A ruined pagan rite circle in the center — broken columns + bone piles.
  carveRoom(-8, -8, 8, 8, MARBLE);
  for (let x = -8; x <= 8; x += 4) {
    placeIfClear("obj_net_column_root", x, -8, [0, 1]);
    placeIfClear("obj_net_column_root", x, 8, [0, 1]);
    placeIfClear("obj_net_bone_pile", -8, x, [0, 1]);
    placeIfClear("obj_net_bone_pile", 8, x, [0, 1]);
  }
  place("obj_net_rite_circle", 0, -2, [0, 1]);
  place("obj_net_glass_kneeler", -2, -2, [0, -1]);
  place("obj_net_glass_kneeler", 2, -2, [0, -1]);
  place("obj_net_brazier_cold", -4, 4, [0, 1]);
  place("obj_net_brazier_cold", 4, 4, [0, 1]);

  // Rubble piles strewn around the cavern edges (deterministic seed).
  const rng = (() => { let s = 0xdee1; return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }; })();
  for (let x = -28; x <= 28; x += 4) {
    for (let z = -26; z <= 28; z += 4) {
      const dist = Math.sqrt(x*x + z*z);
      if (dist > 16 && dist < 26 && rng() > 0.5) {
        placeIfClear("obj_net_rubble", x + Math.floor(rng()*2), z + Math.floor(rng()*2), [0, 1]);
      }
    }
  }

  // Enemies — each entity id appears in exactly one map (state is per-id).
  const entity_placements: EntityPlacementData[] = [
    { entity_id: "ent_save", cell: [0, -20] },
    { entity_id: "ent_candle_eaten_3", cell: [-12, -12] }, // was _1 (dupe with cave_upper)
    { entity_id: "ent_candle_eaten_2", cell: [12, -12] },
    { entity_id: "ent_bound_remnant", cell: [0, 6] },
  ];

  const triggers: TriggerData[] = [
    {
      id: "trg_boss_intro",
      cell: [0, -12],
      type: "step",
      conditions: [],
      condition: { not: { switch: "boss_intro_seen" } },
      cutscene_id: "cut_boss_intro",
      once: true,
    },
    {
      id: "trg_read_log_3",
      cell: [0, -2],
      type: "interact",
      conditions: [],
      condition: { not: { switch: "found_log_3" } },
      cutscene_id: "cut_read_log_3",
      once: true,
    },
  ];

  return { cells, custom_object_placements, item_placements, container_placements, entity_placements, triggers };
};
